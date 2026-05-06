import express from 'express';
import multer from 'multer';
import { uploadPdf, getSignedUrl } from '../services/cloudinary.service';
import OpenAI from 'openai';
import { Contract } from '../models/Contract';
import { Analysis } from '../models/Analysis';
import { requireAuth } from '../middleware/auth';
import { checkPlanLimit } from '../middleware/planGate';
import { strictLimiter } from '../middleware/rateLimit';
import { User } from '../models/User';
import { analyzeQueue } from '../jobs/analyze.job';
import { querySimilar } from '../services/vector.service';
import PDFDocument from 'pdfkit';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const router = express.Router();

// Add multer for local file handling
import path from "path";
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads'))
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
})

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (_, file, cb) => {
    file.mimetype === 'application/pdf' ? cb(null, true) : cb(new Error('Only PDFs allowed'));
  },
});

// POST /api/contracts/upload
router.post('/upload', requireAuth, strictLimiter, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    if (!req.auth?.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const originalname = req.file.originalname;
    const userId = req.auth.userId;

    // Local URL for the uploaded PDF
    const url = `http://localhost:3001/uploads/${req.file.filename}`;
    const publicId = req.file.filename;

    // Save contract to MongoDB
    const contract = await Contract.create({
      userId,
      name: originalname,
      s3Url: url, // reuse same field - just store Cloudinary URL
      s3Key: publicId, // reuse same field - store Cloudinary publicId
      fileSize: req.file.size,
      status: 'pending',
    });

    // Add job to BullMQ for background processing
    await analyzeQueue.add('analyze', { contractId: contract.id });

    // Increment user contracts used
    await User.updateOne({ clerkId: userId }, { $inc: { contractsUsed: 1 } });

    res.json({ contractId: contract.id });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// GET /api/contracts - List all contracts for the current user
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const contracts = await Contract.find({ userId }).sort({ createdAt: -1 });
    res.json(contracts);
  } catch (error) {
    console.error('Fetch contracts error:', error);
    res.status(500).json({ error: 'Failed to fetch contracts' });
  }
});

// POST /api/contracts/compare - Compare two contracts
router.post('/compare', requireAuth, async (req, res) => {
  try {
    const { contractIdA, contractIdB } = req.body;
    const userId = req.auth?.userId;

    if (!contractIdA || !contractIdB) {
      return res.status(400).json({ error: 'Missing contract IDs' });
    }

    const [contractA, contractB] = await Promise.all([
      Contract.findOne({ _id: contractIdA, userId }),
      Contract.findOne({ _id: contractIdB, userId })
    ]);

    if (!contractA || !contractB) {
      return res.status(404).json({ error: 'One or both contracts not found' });
    }

    const [analysisA, analysisB] = await Promise.all([
      Analysis.findOne({ contractId: contractIdA }),
      Analysis.findOne({ contractId: contractIdB })
    ]);

    if (!analysisA || !analysisB) {
      return res.status(400).json({ error: 'Analyses not yet complete for both contracts' });
    }

    const prompt = `
You are a highly precise legal AI. Compare these two versions of a contract and identify the key differences.
Return a STRICT JSON object matching this schema exactly:
{
  "added": ["List of new clauses or obligations added in Version B"],
  "removed": ["List of clauses or obligations removed from Version A"],
  "changed": [
    {
      "clause": "Name of the changed clause",
      "before": "Summary of how it was in Version A",
      "after": "Summary of how it is in Version B"
    }
  ],
  "riskChange": "improved" | "worsened" | "same"
}

Version A Summary:
\${analysisA.summary}
Version A Clauses:
\${JSON.stringify(analysisA.clauses.map(c => ({ title: c.title, text: c.text })))}

Version B Summary:
\${analysisB.summary}
Version B Clauses:
\${JSON.stringify(analysisB.clauses.map(c => ({ title: c.title, text: c.text })))}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "system", content: "You strictly output raw JSON." }, { role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No output from OpenAI");
    
    res.json({
      contractA,
      contractB,
      comparison: JSON.parse(content)
    });
  } catch (error) {
    console.error('Compare error:', error);
    res.status(500).json({ error: 'Failed to compare contracts' });
  }
});

// GET /api/contracts/:id - Fetch contract and its analysis
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const contract = await Contract.findOne({ _id: req.params.id, userId: req.auth?.userId });
    if (!contract) return res.status(404).json({ error: 'Contract not found' });

    // Fetch the analysis document linked to this contract (might be null if still analyzing)
    const analysis = await Analysis.findOne({ contractId: contract._id });
    
    res.json({ contract, analysis });
  } catch (error) {
    console.error('Fetch contract details error:', error);
    res.status(500).json({ error: 'Failed to fetch contract details' });
  }
});

// GET /api/contracts/:id/stream - Server-Sent Events for analysis progress
router.get('/:id/stream', requireAuth, async (req, res) => {
  const contractId = req.params.id;
  const userId = req.auth?.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // Tell Express to send headers immediately

  // Verify ownership before streaming
  const contract = await Contract.findOne({ _id: contractId, userId });
  if (!contract) {
    res.write(`data: ${JSON.stringify({ error: 'Contract not found' })}\n\n`);
    return res.end();
  }

  const sendEvent = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const intervalId = setInterval(async () => {
    try {
      const currentContract = await Contract.findById(contractId);
      if (!currentContract) {
        clearInterval(intervalId);
        res.end();
        return;
      }

      let progress = 0;
      switch(currentContract.status) {
        case 'pending': progress = 10; break;
        case 'analyzing': progress = 50; break;
        case 'done': progress = 100; break;
        case 'failed': progress = 0; break;
      }

      sendEvent({ status: currentContract.status, progress });

      if (currentContract.status === 'done' || currentContract.status === 'failed') {
        clearInterval(intervalId);
        res.end();
      }
    } catch (error) {
      console.error('SSE Error:', error);
      clearInterval(intervalId);
      res.end();
    }
  }, 2000); // Poll DB every 2 seconds

  // Cleanup on client disconnect
  req.on('close', () => {
    clearInterval(intervalId);
  });
});

// POST /api/contracts/:id/chat - RAG Chat Stream
router.post('/:id/chat', requireAuth, strictLimiter, async (req, res) => {
  try {
    const contractId = req.params.id;
    const { question, history } = req.body;
    
    // Verify ownership
    const contract = await Contract.findOne({ _id: contractId, userId: req.auth?.userId });
    if (!contract) return res.status(404).json({ error: 'Contract not found' });

    // 1) Get relevant chunks from Pinecone
    const chunks = await querySimilar(contractId, question, 5);
    const contextText = chunks.join('\n\n---\n\n');

    // 2) Build strict prompt
    const systemPrompt = `You are a highly precise legal AI assistant analyzing a contract. 
Answer the user's question based strictly on the provided contract context below. 
If the answer is not in the context, clearly state "I cannot find the answer in the contract." 
Do not invent or hallucinate information. Keep answers concise.

Contract Context:
${contextText}
`;

    // 3) Call OpenAI with streaming enabled
    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...(history || []),
        { role: "user", content: question }
      ],
      stream: true,
      temperature: 0.2, // Low temp for factual accuracy
    });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.flushHeaders();

    // 4) Pipe the stream bytes back to the frontend
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || "";
      if (text) {
        res.write(text);
      }
    }
    res.end();
  } catch (error) {
    console.error("Chat error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate chat response" });
    } else {
      res.end("\n[Error: Connection dropped]");
    }
  }
});

// GET /api/contracts/:id/export - Export analysis as PDF
router.get('/:id/export', requireAuth, async (req, res) => {
  try {
    const contract = await Contract.findOne({ _id: req.params.id, userId: req.auth?.userId });
    if (!contract) return res.status(404).json({ error: 'Contract not found' });

    const analysis = await Analysis.findOne({ contractId: contract._id });
    if (!analysis) return res.status(400).json({ error: 'Analysis not found' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Analysis-${contract.name.replace(/\.pdf$/i, '')}.pdf"`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // Title
    doc.fontSize(24).fillColor('#333333').text('AI Contract Analysis Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#666666').text(`Contract: ${contract.name}`, { align: 'center' });
    doc.moveDown(2);

    // Metadata
    doc.fontSize(16).fillColor('#222222').text('Metadata', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#444444')
       .text(`Parties: ${analysis.parties.join(', ')}`)
       .text(`Effective Date: ${analysis.effectiveDate ? new Date(analysis.effectiveDate).toLocaleDateString() : 'N/A'}`)
       .text(`Termination Date: ${analysis.terminationDate ? new Date(analysis.terminationDate).toLocaleDateString() : 'N/A'}`);
    doc.moveDown(2);

    // Overall Risk
    doc.fontSize(16).fillColor('#222222').text('Overall Risk Score', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(14).fillColor(analysis.overallRisk > 70 ? '#ef4444' : analysis.overallRisk > 30 ? '#f59e0b' : '#10b981')
       .text(`${analysis.overallRisk} / 100`);
    
    // Risk Bar
    const barWidth = 400;
    const barHeight = 20;
    const fillWidth = (analysis.overallRisk / 100) * barWidth;
    doc.rect(50, doc.y + 10, barWidth, barHeight).stroke('#dddddd');
    doc.rect(50, doc.y + 10, fillWidth, barHeight).fill(analysis.overallRisk > 70 ? '#ef4444' : analysis.overallRisk > 30 ? '#f59e0b' : '#10b981');
    doc.moveDown(3);

    // Summary
    doc.fontSize(16).fillColor('#222222').text('Summary', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#444444').text(analysis.summary, { align: 'justify' });
    doc.moveDown(2);

    // Clauses Table
    doc.addPage();
    doc.fontSize(16).fillColor('#222222').text('Extracted Clauses', { underline: true });
    doc.moveDown(1);

    analysis.clauses.forEach((clause: any) => {
      if (doc.y > 700) doc.addPage();
      
      const riskColor = clause.risk === 'high' ? '#ef4444' : clause.risk === 'medium' ? '#f59e0b' : '#10b981';
      
      doc.fontSize(14).fillColor('#333333').text(clause.title, { continued: true });
      doc.fontSize(12).fillColor(riskColor).text(`  [${clause.risk.toUpperCase()} RISK]`);
      doc.moveDown(0.5);
      
      doc.fontSize(10).fillColor('#666666').text('Description:', { underline: true });
      doc.fontSize(10).fillColor('#444444').text(clause.plainEnglish);
      doc.moveDown(1);
    });

    doc.end();
  } catch (error) {
    console.error('Export error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to export PDF' });
    }
  }
});

export default router;

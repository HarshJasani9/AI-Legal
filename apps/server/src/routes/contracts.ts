import express from 'express';
import multer from 'multer';
import { uploadPdf } from '../services/cloudinary.service';
import { Contract } from '../models/Contract';
import { Analysis } from '../models/Analysis';
import { requireAuth } from '../middleware/auth';
import { analyzeQueue } from '../jobs/analyze.job';

const router = express.Router();

// Add multer for in-memory file handling
const upload = multer({
  storage: multer.memoryStorage(), // keep file in RAM buffer
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (_, file, cb) => {
    file.mimetype === 'application/pdf' ? cb(null, true) : cb(new Error('Only PDFs allowed'));
  },
});

// POST /api/contracts/upload
router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    if (!req.auth?.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { buffer, originalname } = req.file;
    const userId = req.auth.userId;

    // Upload buffer directly to Cloudinary
    const { url, publicId } = await uploadPdf(buffer, originalname, userId);

    // Save contract to MongoDB
    const contract = await Contract.create({
      userId,
      name: originalname,
      s3Url: url, // reuse same field - just store Cloudinary URL
      s3Key: publicId, // reuse same field - store Cloudinary publicId
      fileSize: buffer.length,
      status: 'pending',
    });

    // Add job to BullMQ for background processing
    await analyzeQueue.add('analyze', { contractId: contract.id });

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

export default router;

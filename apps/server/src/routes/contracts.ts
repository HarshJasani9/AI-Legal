import express from 'express';
import multer from 'multer';
import { uploadPdf } from '../services/cloudinary.service';
import { Contract } from '../models/Contract';
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

export default router;

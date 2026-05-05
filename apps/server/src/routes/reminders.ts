import express from 'express';
import { requireAuth } from '../middleware/auth';
import { Reminder } from '../models/Reminder';

const router = express.Router();

// POST /api/reminders - Create a new reminder
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { contractId, contractName, type, dueDate, remindDaysBefore, email } = req.body;

    if (!contractId || !contractName || !type || !dueDate || remindDaysBefore == null || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const reminder = await Reminder.create({
      userId,
      contractId,
      contractName,
      type,
      dueDate: new Date(dueDate),
      remindDaysBefore,
      email,
      sent: false
    });

    res.status(201).json(reminder);
  } catch (error) {
    console.error('Create reminder error:', error);
    res.status(500).json({ error: 'Failed to create reminder' });
  }
});

// GET /api/reminders - List all reminders for the current user
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const reminders = await Reminder.find({ userId }).sort({ dueDate: 1 });
    res.json(reminders);
  } catch (error) {
    console.error('Fetch reminders error:', error);
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});

export default router;

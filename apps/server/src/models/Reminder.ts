import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  contractId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract', required: true },
  contractName: { type: String, required: true },
  type: { type: String, enum: ['expiry', 'renewal'], required: true },
  dueDate: { type: Date, required: true },
  remindDaysBefore: { type: Number, required: true },
  email: { type: String, required: true },
  sent: { type: Boolean, default: false }
}, {
  timestamps: true
});

export const Reminder = mongoose.model('Reminder', reminderSchema);

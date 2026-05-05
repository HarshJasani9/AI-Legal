import { Queue, Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { Reminder } from '../models/Reminder';
import { sendReminderEmail } from '../services/email.service';

const REMINDER_QUEUE_NAME = 'reminderQueue';

export const reminderQueue = new Queue(REMINDER_QUEUE_NAME, {
  connection: redisConnection,
});

// Setup the repeatable cron job (Runs every day at 9:00 AM)
const setupRepeatableJob = async () => {
  await reminderQueue.add(
    'processReminders',
    {},
    {
      repeat: {
        pattern: '0 9 * * *', // Cron pattern for 9 AM daily
      },
      jobId: 'daily-reminder-job' // Ensure only one recurring job exists
    }
  );
  console.log('Registered repeatable reminder cron job (9:00 AM daily)');
};

setupRepeatableJob();

// Worker that processes the daily job
export const reminderWorker = new Worker(
  REMINDER_QUEUE_NAME,
  async (job: Job) => {
    console.log(`Executing daily reminder processing...`);
    
    // 1. Fetch all unsent reminders
    const unsentReminders = await Reminder.find({ sent: false });
    console.log(`Found ${unsentReminders.length} unsent reminders in the database.`);
    
    // 2. Filter to find the ones that are due to trigger TODAY
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    
    let processedCount = 0;
    
    for (const reminder of unsentReminders) {
      const dueDate = new Date(reminder.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      
      // Calculate exactly how many days are left until the due date
      const msPerDay = 1000 * 60 * 60 * 24;
      const daysDiff = Math.round((dueDate.getTime() - today.getTime()) / msPerDay);
      
      // If the days remaining exactly matches (or is slightly less than, if we missed a day) 
      // their configured 'remindDaysBefore', trigger the email.
      if (daysDiff <= reminder.remindDaysBefore && daysDiff >= 0) {
        try {
          await sendReminderEmail(reminder);
          
          // Atomically mark as sent to prevent duplicate emails tomorrow
          reminder.sent = true;
          await reminder.save();
          processedCount++;
          console.log(`Successfully sent email reminder for: ${reminder.contractName}`);
        } catch (error) {
          console.error(`Error sending reminder ${reminder._id}:`, error);
        }
      }
    }
    
    console.log(`Finished processing reminders. Sent ${processedCount} emails today.`);
    return { processedCount };
  },
  {
    connection: redisConnection,
  }
);

reminderWorker.on('failed', (job, err) => {
  console.error(`Reminder cron job failed with error:`, err);
});

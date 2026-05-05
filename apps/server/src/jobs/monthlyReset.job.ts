import { Queue, Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { User } from '../models/User';

const RESET_QUEUE_NAME = 'monthlyResetQueue';

export const monthlyResetQueue = new Queue(RESET_QUEUE_NAME, {
  connection: redisConnection as any,
});

const setupRepeatableJob = async () => {
  await monthlyResetQueue.add(
    'resetContractsUsed',
    {},
    {
      repeat: {
        pattern: '0 0 1 * *', // Run at 00:00 (midnight) on the 1st day of every month
      },
      jobId: 'monthly-reset-job' // Deduplicates the job in Redis
    }
  );
  console.log('Registered repeatable monthly reset cron job (1st of every month)');
};

setupRepeatableJob();

export const monthlyResetWorker = new Worker(
  RESET_QUEUE_NAME,
  async (job: Job) => {
    console.log(`Executing monthly reset of contractsUsed...`);
    
    try {
      // Find all users (primarily 'free' plan users) and reset their contractsUsed to 0
      const result = await User.updateMany(
        { plan: 'free' },
        { $set: { contractsUsed: 0 } }
      );
      
      console.log(`Successfully reset contractsUsed back to 0 for ${result.modifiedCount} free users.`);
      return { resetCount: result.modifiedCount };
    } catch (error) {
      console.error('Failed to run monthly reset:', error);
      throw error; // Rethrow to trigger BullMQ failure handling
    }
  },
  {
    connection: redisConnection as any,
  }
);

monthlyResetWorker.on('failed', (job, err) => {
  console.error(`Monthly reset cron job failed with error:`, err);
});

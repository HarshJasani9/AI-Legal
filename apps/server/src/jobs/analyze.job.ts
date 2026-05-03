import { Queue, Worker, Job } from "bullmq";
import { redisConnection } from "../config/redis";

export interface AnalyzeJobData {
  contractId: string;
}

const QUEUE_NAME = "analyze-contracts";

// 1. Create the Queue (Exported so routes can add jobs to it)
export const analyzeQueue = new Queue<AnalyzeJobData>(QUEUE_NAME, {
  connection: redisConnection as any,
});

// 2. Create the Worker (Listens for jobs in the background)
export const analyzeWorker = new Worker<AnalyzeJobData>(
  QUEUE_NAME,
  async (job: Job<AnalyzeJobData>) => {
    const { contractId } = job.data;
    
    console.log(`[Worker] Starting analysis job for contract ID: ${contractId}`);
    
    // Placeholder for actual AI analysis logic
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate work
    
    console.log(`[Worker] Completed analysis for contract ID: ${contractId}`);
  },
  {
    connection: redisConnection as any,
  }
);

// Worker Event Listeners
analyzeWorker.on("completed", (job) => {
  console.log(`[Job ${job.id}] Successfully completed.`);
});

analyzeWorker.on("failed", (job, err) => {
  console.error(`[Job ${job?.id}] Failed with error: ${err.message}`);
});

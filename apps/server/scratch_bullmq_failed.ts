import "dotenv/config";
import { Queue } from "bullmq";
import { redisConnection } from "./src/config/redis";

const analyzeQueue = new Queue("analyze-contracts", { connection: redisConnection as any });

async function checkFailed() {
  const failed = await analyzeQueue.getFailed();
  console.log(`Found ${failed.length} failed jobs.`);
  for (const job of failed.slice(-5)) {
    console.log(`Job ${job.id} failed:`, job.failedReason);
    console.log(`Stack trace:`, job.stacktrace);
  }
  process.exit(0);
}

checkFailed().catch(console.error);

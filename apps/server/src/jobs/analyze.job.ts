import { Queue, Worker, Job } from "bullmq";
import { redisConnection } from "../config/redis";
import { Contract } from "../models/Contract";
import { Analysis } from "../models/Analysis";
import { parsePdf } from "../services/pdf.service";
import { embedAndStore } from "../services/vector.service";
import { extractContractData, analyzeClauses } from "../services/ai.service";

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
    
    // Step 1: Find the Contract and update status to "analyzing"
    const contract = await Contract.findById(contractId);
    if (!contract) {
      throw new Error(`Contract not found: ${contractId}`);
    }
    
    contract.status = "analyzing";
    await contract.save();

    try {
      // Step 2: Download PDF from Cloudinary and parse it
      console.log(`[Worker] Parsing PDF for contract ID: ${contractId}`);
      const { text, pageCount, chunks } = await parsePdf(contract.s3Url);
      
      // Update page count early
      if (pageCount) {
        contract.pageCount = pageCount;
        await contract.save();
      }

      // Step 3: Embed chunks and store in Pinecone
      console.log(`[Worker] Embedding and storing vectors for contract ID: ${contractId}`);
      await embedAndStore(contractId, chunks);

      // Step 4: Run AI Extractions in parallel
      console.log(`[Worker] Running AI analysis for contract ID: ${contractId}`);
      const [extractedData, clausesAnalysis] = await Promise.all([
        extractContractData(text),
        analyzeClauses(text),
      ]);

      // Step 5: Calculate overallRisk as average (low=1, medium=5, high=9) mapped to 0-100
      let overallRisk = 0;
      if (clausesAnalysis.clauses.length > 0) {
        const riskScores = clausesAnalysis.clauses.map(c => {
          if (c.risk === 'high') return 9;
          if (c.risk === 'medium') return 5;
          return 1; // low
        });
        
        const average = riskScores.reduce((a, b) => a + b, 0) / riskScores.length;
        // Formula: (average - min) / (max - min) * 100 -> (average - 1) / 8 * 100
        overallRisk = Math.max(0, Math.min(100, Math.round(((average - 1) / 8) * 100)));
      }

      // Step 6: Save the Analysis document
      console.log(`[Worker] Saving analysis results for contract ID: ${contractId}`);
      await Analysis.create({
        contractId: contract._id,
        summary: extractedData.summary,
        parties: extractedData.parties,
        effectiveDate: extractedData.effectiveDate && !isNaN(Date.parse(extractedData.effectiveDate)) 
          ? new Date(extractedData.effectiveDate) 
          : undefined,
        terminationDate: extractedData.terminationDate && !isNaN(Date.parse(extractedData.terminationDate)) 
          ? new Date(extractedData.terminationDate) 
          : undefined,
        overallRisk: overallRisk,
        clauses: clausesAnalysis.clauses,
      });

      // Step 7: Update Contract status to "done"
      contract.status = "done";
      await contract.save();
      
      console.log(`[Worker] Successfully completed analysis for contract ID: ${contractId}`);
    } catch (error) {
      console.error(`[Worker] Analysis completely failed for contract ID: ${contractId}`, error);
      contract.status = "failed";
      await contract.save();
      throw error; // Rethrow to let BullMQ handle retries/failures
    }
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

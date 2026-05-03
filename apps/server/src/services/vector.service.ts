import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || "",
});

const INDEX_NAME = process.env.PINECONE_INDEX_NAME || "legal-contracts";

/**
 * Embeds document chunks using OpenAI and stores them in Pinecone
 */
export async function embedAndStore(contractId: string, chunks: string[]) {
  if (!chunks.length) return;

  const index = pinecone.index(INDEX_NAME);

  // Generate embeddings for all chunks in one API call
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: chunks,
  });

  const vectors = embeddingResponse.data.map((embeddingData, i) => {
    return {
      id: `${contractId}-chunk-${i}`,
      values: embeddingData.embedding,
      metadata: {
        contractId,
        chunkIndex: i,
        text: chunks[i],
      },
    };
  });

  // Pinecone recommends upserting in batches to avoid payload limits
  const BATCH_SIZE = 100;
  for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
    const batch = vectors.slice(i, i + BATCH_SIZE);
    await index.upsert(batch);
  }
}

/**
 * Queries Pinecone for chunks similar to the question, strictly filtered by contractId
 */
export async function querySimilar(contractId: string, question: string, topK: number = 5): Promise<string[]> {
  const index = pinecone.index(INDEX_NAME);

  // Embed the user's question
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: question,
  });
  
  const queryEmbedding = embeddingResponse.data[0].embedding;

  // Search Pinecone with metadata filtering
  const queryResult = await index.query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true,
    filter: {
      contractId: { $eq: contractId },
    },
  });

  // Extract and return the raw text chunks
  const matches = queryResult.matches || [];
  return matches
    .map(match => match.metadata?.text as string)
    .filter(text => text !== undefined && text !== null);
}

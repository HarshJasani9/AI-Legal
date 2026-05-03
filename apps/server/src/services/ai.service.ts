import OpenAI from "openai";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Zod schema to enforce the extracted data shape
export const ContractExtractionSchema = z.object({
  parties: z.array(z.string()).describe("The parties involved in the contract"),
  effectiveDate: z.string().nullable().describe("The effective date of the contract, or null if not found"),
  terminationDate: z.string().nullable().describe("The termination date of the contract, or null if not found"),
  summary: z.string().describe("A concise 3-sentence plain English summary of the contract"),
});

export type ContractExtractionResult = z.infer<typeof ContractExtractionSchema>;

/**
 * Extracts core metadata and a summary from the full text of a contract using GPT-4o.
 * Ensures the output strictly adheres to the requested JSON format and validates it with Zod.
 */
export async function extractContractData(fullText: string): Promise<ContractExtractionResult> {
  const prompt = `
You are a highly precise legal data extraction AI. Your task is to analyze the provided contract text and extract specific metadata.
You must return your response as a raw, valid JSON object exactly matching the schema below. 
Do NOT include any markdown formatting (like \`\`\`json) or additional conversational text.

Required JSON Structure:
{
  "parties": ["List", "of", "parties", "involved"],
  "effectiveDate": "YYYY-MM-DD or null if not found",
  "terminationDate": "YYYY-MM-DD or null if not found",
  "summary": "Exactly 3 sentences explaining the contract's main purpose and obligations in plain English."
}

Contract Text:
"""
${fullText.substring(0, 100000) /* Safety slice to ensure we fit inside GPT-4o's context window */}
"""
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are a legal AI. You only output strictly formatted JSON data.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    // Force the model to return valid JSON
    response_format: { type: "json_object" }, 
    temperature: 0, // 0 for max determinism in data extraction
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Failed to receive content from OpenAI");
  }

  try {
    // Parse the raw JSON string
    const parsedData = JSON.parse(content);
    
    // Validate the parsed object against our Zod schema to ensure type safety
    return ContractExtractionSchema.parse(parsedData);
  } catch (error) {
    console.error("Validation or Parsing Error:", error);
    console.error("Raw OpenAI Output:", content);
    throw new Error("OpenAI returned an invalid JSON structure that failed Zod validation.");
  }
}

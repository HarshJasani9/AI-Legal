# AI Contract Analyzer

An enterprise-grade, AI-powered legal document analysis platform. This application leverages large language models and vector search to autonomously extract clauses, assess risk profiles, and enable interactive conversational querying against complex legal contracts.

## 🛠 Tech Stack

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-%23412991.svg?style=for-the-badge&logo=openai&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-626CD9?style=for-the-badge&logo=Stripe&logoColor=white)

## ✨ Key Features

- **📑 Automated Clause Extraction:** Processes dense PDF contracts and extracts core legal clauses, translating them into plain English summaries.
- **⚖️ AI Risk Assessment:** Automatically scores individual clauses and computes an overall document risk profile (High, Medium, Low) based on historical legal precedents.
- **💬 RAG Conversational Interface:** Context-aware chat system utilizing Pinecone vector embeddings to accurately answer highly specific questions directly from the contract text.
- **🔄 Contract Diffing Engine:** Side-by-side comparative analysis of multiple contract versions to highlight added, removed, and mutated obligations.
- **📊 Export & Reporting:** Generates client-ready PDF reports containing visual risk scorecards and formatted clause tables.
- **🛡 Robust Infrastructure:** Features BullMQ job orchestration, Redis-backed rate limiting, global error boundary management, and strict Zod environment validation.

## 🏗 Architecture Overview

The system is built as a highly decoupled monorepo (Turborepo) featuring a Next.js frontend and an Express/Node.js backend. The critical asynchronous document processing pipeline follows this deterministic flow:

1. **Upload & Ingestion:** The client uploads a PDF to the Express backend. The file is streamed to Cloudinary for durable storage, and an initial `Contract` document is saved to MongoDB as `pending`.
2. **Asynchronous Dispatch:** The request is immediately acknowledged, and a background task is dispatched to a Redis-backed **BullMQ** processing queue. 
3. **Parse & Chunk:** The worker downloads the PDF, extracts raw text using `pdf-parse`, and segments the document into intelligent chunks using LangChain's `RecursiveCharacterTextSplitter`.
4. **Embed & Index:** Chunks are fed into OpenAI's embedding model (`text-embedding-3-small`). The resulting vectors are upserted into **Pinecone** to enable rapid semantic querying (RAG).
5. **Analyze & Score:** The raw text is passed to GPT-4o with strict JSON-schema instructions to extract parties, dates, clauses, and calculate risk metrics. The results are securely persisted to MongoDB.
6. **Real-time Feedback:** Throughout this lifecycle, the Next.js client connects via **Server-Sent Events (SSE)** to stream live progress bar updates to the user interface.

## 🚀 Local Development

### Prerequisites

Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [pnpm](https://pnpm.io/installation) (v8+)
- Active instances of MongoDB and Redis
- API Keys for OpenAI, Pinecone, Cloudinary, Clerk, and Stripe

### 1. Environment Setup

Copy the environment variables template into both the frontend and backend applications.

**Backend (`apps/server/.env`):**
```env
PORT=3001
MONGODB_URI=your_mongodb_connection_string
REDIS_URL=your_redis_url

OPENAI_API_KEY=your_openai_key
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX=your_pinecone_index

CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

CLERK_SECRET_KEY=your_clerk_secret_key
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

EMAIL_USER=your_smtp_user
EMAIL_PASS=your_smtp_password
```

**Frontend (`apps/web/.env.local`):**
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

### 2. Install Dependencies

From the root directory, run:

```bash
pnpm install
```

### 3. Start Development Servers

Leverage Turborepo to concurrently start both the backend and frontend in development mode:

```bash
pnpm dev
```

The frontend will be available at `http://localhost:3000` and the API at `http://localhost:3001`.

---
*Architected and maintained by Harsh Jasani*

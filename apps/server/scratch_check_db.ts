import "dotenv/config";
import mongoose from "mongoose";
import { Contract } from "./src/models/Contract";

async function check() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const latest = await Contract.find().sort({ createdAt: -1 }).limit(3);
  console.log("Latest contracts:");
  for (const c of latest) {
    console.log(`- ID: ${c.id}, Name: ${c.name}, Status: ${c.status}, CreatedAt: ${c.createdAt}`);
  }
  process.exit(0);
}

check().catch(console.error);

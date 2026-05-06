import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function resetLimits() {
  if (!MONGODB_URI) throw new Error("No MONGODB_URI found");
  
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  
  console.log("Resetting contractsUsed to 0 for all users...");
  const result = await mongoose.connection.collection('users').updateMany(
    {}, 
    { $set: { contractsUsed: 0 } }
  );
  
  console.log(`Successfully reset limit for ${result.modifiedCount} users!`);
  
  await mongoose.disconnect();
}

resetLimits().catch(console.error);

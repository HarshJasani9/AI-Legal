import "dotenv/config";
import axios from "axios";
import mongoose from "mongoose";
import { Contract } from "./src/models/Contract";
import { getSignedUrl } from "./src/services/cloudinary.service";

async function test() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const latest = await Contract.findOne().sort({ createdAt: -1 });
  if (!latest) {
    console.log("No contracts");
    return process.exit(0);
  }
  console.log("Latest Contract s3Key:", latest.s3Key);
  console.log("Latest Contract s3Url:", latest.s3Url);
  
  const url = getSignedUrl(latest.s3Key);
  console.log("Signed URL:", url);
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    console.log("Success! Status:", response.status, "Length:", response.data.length);
  } catch (error: any) {
    console.error("Error Status:", error.response?.status);
    console.error("Error Data:", error.response?.data?.toString());
  }
  process.exit(0);
}

test();

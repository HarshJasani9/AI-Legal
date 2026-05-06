import "dotenv/config";
import axios from "axios";
import mongoose from "mongoose";
import { Contract } from "./src/models/Contract";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function test() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const latest = await Contract.findOne().sort({ createdAt: -1 });
  
  const url = cloudinary.url(latest!.s3Key, { resource_type: 'raw', type: 'authenticated' });
  console.log("URL:", url);
  try {
    const response = await axios.get(url, { 
      auth: {
        username: process.env.CLOUDINARY_API_KEY as string,
        password: process.env.CLOUDINARY_API_SECRET as string
      },
      responseType: 'arraybuffer' 
    });
    console.log("Success! Status:", response.status, "Length:", response.data.length);
  } catch (error: any) {
    console.error("Error Status:", error.response?.status);
    console.error("Error Data:", error.response?.data?.toString());
  }
  process.exit(0);
}

test();

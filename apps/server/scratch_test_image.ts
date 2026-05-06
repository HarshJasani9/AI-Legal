import "dotenv/config";
import axios from "axios";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function test() {
  console.log("Downloading sample PDF...");
  const res = await axios.get("https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", { responseType: "arraybuffer" });
  const buffer = Buffer.from(res.data);
  console.log("Uploading as image...");
  try {
    const result = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "test", resource_type: "image", format: "pdf" },
        (error, res) => { if (error) reject(error); else resolve(res); }
      );
      stream.end(buffer);
    });
    console.log("Uploaded URL:", result.secure_url);
    
    console.log("Attempting to download...");
    const response = await axios.get(result.secure_url, { responseType: 'arraybuffer' });
    console.log("Success! Status:", response.status, "Length:", response.data.length);
  } catch (error: any) {
    console.error("Error:", error.response?.status || error.message);
  }
  process.exit(0);
}

test();

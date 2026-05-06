import "dotenv/config";
import axios from "axios";
import { getSignedUrl } from "./src/services/cloudinary.service";

async function test() {
  const publicId = "sample_contract.pdf"; // from previous upload
  const url = getSignedUrl(publicId);
  console.log("Signed URL:", url);
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    console.log("Success! Status:", response.status, "Length:", response.data.length);
  } catch (error: any) {
    console.error("Error Status:", error.response?.status);
    console.error("Error Data:", error.response?.data?.toString());
  }
}

test();

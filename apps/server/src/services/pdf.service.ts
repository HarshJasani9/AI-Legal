import pdfParse from 'pdf-parse';
import axios from 'axios';

// Download from Cloudinary URL and parse
export async function parsePdf(cloudinaryUrl: string) {
  // Fetch the PDF from Cloudinary URL directly
  const response = await axios.get(cloudinaryUrl, { responseType: 'arraybuffer' });
  const buffer = Buffer.from(response.data);
  const parsed = await pdfParse(buffer);
  
  // Chunk text into 1000-char segments with 200 overlap
  const chunks: string[] = [];
  const text = parsed.text;
  let i = 0;
  
  while (i < text.length) {
    chunks.push(text.slice(i, i + 1000));
    i += 800; // 200 overlap
  }
  
  return { text, pageCount: parsed.numpages, chunks };
}

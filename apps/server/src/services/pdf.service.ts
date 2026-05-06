const pdfParse = require('pdf-parse');
import axios from 'axios';
import { getSignedUrl } from './cloudinary.service';

// Download from Cloudinary URL and parse
export async function parsePdf(url: string, publicId?: string) {
  // If it's a Cloudinary URL, use getSignedUrl. Otherwise, use the local URL directly.
  const fetchUrl = (publicId && url.includes('cloudinary'))
    ? getSignedUrl(publicId) 
    : url;
    
  // Fetch the PDF from Cloudinary
  const response = await axios.get(fetchUrl, { responseType: 'arraybuffer' });
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

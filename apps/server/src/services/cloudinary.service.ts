import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload a PDF buffer directly to Cloudinary
export async function uploadPdf(buffer: Buffer, fileName: string, userId: string) {
  return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `contracts/${userId}`,
        public_id: fileName,
        resource_type: 'raw', // required for PDFs
        type: 'authenticated', // required to bypass PDF restriction
        format: 'pdf',
      },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    Readable.from(buffer).pipe(stream);
  });
}

// Delete a file from Cloudinary
export async function deleteFile(publicId: string) {
  await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
}

// Get a signed URL to bypass restrictions on raw PDFs
export function getSignedUrl(publicId: string): string {
  return cloudinary.url(publicId, { sign_url: true, resource_type: 'raw', type: 'authenticated' });
}

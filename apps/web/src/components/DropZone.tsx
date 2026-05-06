"use client";
import { useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/nextjs';

export default function DropZone({ onSuccess }: { onSuccess: (contractId: string) => void }) {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const { getToken } = useAuth();

  const handleUpload = useCallback(async (file: File) => {
    try {
      setIsUploading(true);
      const token = await getToken();
      
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await axios.post('http://localhost:3001/api/contracts/upload', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        onUploadProgress: (e) => {
          const pct = Math.round((e.loaded * 100) / e.total!);
          setProgress(pct);
        },
      });
      
      onSuccess(res.data.contractId);
    } catch (error: any) {
      console.error('Upload failed', error);
      alert(error.response?.data?.error || error.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [getToken, onSuccess]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer relative">
      <input 
        type="file" 
        accept="application/pdf" 
        onChange={onFileChange} 
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isUploading}
      />
      
      {isUploading ? (
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p>Uploading... {progress}%</p>
        </div>
      ) : (
        <div>
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-lg mb-2">Drag and drop your PDF here</p>
          <p className="text-sm text-gray-400">or click to browse files</p>
        </div>
      )}
    </div>
  );
}

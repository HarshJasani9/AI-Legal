"use client";

import { pdfjs, Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Ensure the worker is using the .js extension for pdfjs-dist v3
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFViewerProps {
  url: string;
  pageNumber: number;
  setNumPages: (n: number) => void;
}

export default function PDFViewer({ url, pageNumber, setNumPages }: PDFViewerProps) {
  return (
    <Document 
      file={url} 
      onLoadSuccess={({ numPages }) => setNumPages(numPages)}
      loading={<div className="text-gray-400 p-20 animate-pulse">Loading Document...</div>}
    >
      <Page 
        pageNumber={pageNumber} 
        renderTextLayer={true} 
        renderAnnotationLayer={true}
        className="max-w-full"
        width={700}
      />
    </Document>
  );
}

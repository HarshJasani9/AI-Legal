"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import axios from "axios";
import { UploadCloud, FileText, CheckCircle2, Loader2, Sparkles, Lightbulb, X } from "lucide-react";

type UploadState = "idle" | "selected" | "uploading" | "success";

export default function UploadPage() {
  const [state, setState] = useState<UploadState>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const { getToken } = useAuth();
  const router = useRouter();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setState("selected");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setState("idle");
  };

  const handleUpload = async () => {
    if (!file) return;
    
    try {
      setState("uploading");
      setProgress(0);
      const token = await getToken();
      
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await axios.post("http://localhost:3001/api/contracts/upload", formData, {
        headers: { 
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${token}`
        },
        onUploadProgress: (e) => {
          const pct = Math.round((e.loaded * 100) / e.total!);
          setProgress(pct);
        },
      });
      
      setState("success");
      setTimeout(() => {
        router.push(`/contracts/${res.data.contractId}`);
      }, 1500);
    } catch (error: any) {
      console.error("Upload failed", error);
      alert(error.response?.data?.error || error.message || "Upload failed");
      setState("selected"); // revert so they can try again
    }
  };

  return (
    <div className="p-4 md:p-8 flex flex-col xl:flex-row gap-8 items-start max-w-7xl mx-auto">
      
      {/* MAIN UPLOAD COLUMN */}
      <div className="flex-1 w-full max-w-3xl">
        
        {/* VISUAL STEPPER */}
        <div className="flex items-center w-full mb-10 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium text-sm">1</div>
            <span className="text-indigo-300 font-medium text-sm">Upload PDF</span>
          </div>
          <div className="flex-1 h-px bg-white/10 mx-4 min-w-[30px]" />
          <div className="flex items-center gap-3 shrink-0 opacity-50">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white font-medium text-sm">2</div>
            <span className="text-white font-medium text-sm">AI Analysis</span>
          </div>
          <div className="flex-1 h-px bg-white/10 mx-4 min-w-[30px]" />
          <div className="flex items-center gap-3 shrink-0 opacity-50">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white font-medium text-sm">3</div>
            <span className="text-white font-medium text-sm">Review Results</span>
          </div>
        </div>

        {/* UPLOAD CARD */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 md:p-8">
          <h2 className="text-white text-xl font-semibold">Upload Your Contract</h2>
          <p className="text-slate-400 text-sm mt-1 mb-6">PDF files only · Maximum 10MB · Your file is encrypted in transit</p>
          
          {state === "idle" && (
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ease-in-out ${
                isDragActive 
                  ? "border-indigo-500 bg-indigo-500/5 scale-[1.01]" 
                  : "border-white/20 hover:border-indigo-500/40 hover:bg-white/[0.02]"
              }`}
            >
              <input {...getInputProps()} />
              <UploadCloud className={`w-12 h-12 mx-auto mb-4 transition-colors ${isDragActive ? "text-indigo-400" : "text-indigo-400/60"}`} />
              
              <h3 className={`font-medium text-base mb-1 ${isDragActive ? "text-indigo-300" : "text-white"}`}>
                {isDragActive ? "Drop it here!" : "Drag and drop your PDF here"}
              </h3>
              <p className="text-slate-500 text-sm mb-6">or click to browse files</p>
              
              <div className="flex flex-wrap justify-center gap-2">
                <span className="text-xs text-slate-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/5 flex items-center gap-1.5">
                  <span>🔒</span> Encrypted
                </span>
                <span className="text-xs text-slate-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/5 flex items-center gap-1.5">
                  <span>📄</span> PDF only
                </span>
                <span className="text-xs text-slate-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/5 flex items-center gap-1.5">
                  <span>⚡</span> &lt;30s analysis
                </span>
              </div>
            </div>
          )}

          {state === "selected" && file && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-white font-medium truncate max-w-[200px] sm:max-w-xs">{file.name}</p>
                    <p className="text-slate-400 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button 
                  onClick={removeFile}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <button 
                onClick={handleUpload}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Upload & Analyze
              </button>
            </div>
          )}

          {state === "uploading" && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <div className="p-8 border-2 border-dashed border-indigo-500/30 rounded-xl bg-indigo-500/5 text-center flex flex-col items-center justify-center min-h-[220px]">
                <div className="w-full max-w-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-indigo-300 text-sm font-medium flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing Document...
                    </span>
                    <span className="text-indigo-300 text-sm font-medium">{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {state === "success" && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <div className="p-8 border border-green-500/30 rounded-xl bg-green-500/5 text-center flex flex-col items-center justify-center min-h-[220px]">
                <CheckCircle2 className="w-14 h-14 text-green-400 mb-4 animate-in zoom-in duration-500 delay-150" />
                <h3 className="text-white font-semibold text-lg mb-1">Upload Complete!</h3>
                <p className="text-slate-400 text-sm">Redirecting to analysis dashboard...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT TIPS PANEL (Desktop Only) */}
      <div className="w-72 shrink-0 hidden xl:flex flex-col sticky top-24">
        <h3 className="text-white text-sm font-medium mb-4 px-1">Tips for best results</h3>
        <div className="flex flex-col gap-3">
          {[
            "Use text-based PDFs for best accuracy — scanned images may reduce quality.",
            "Contracts under 20 pages analyze fastest.",
            "You can upload NDAs, service agreements, employment contracts, and more.",
            "Your documents are securely encrypted and deleted from our servers after 30 days."
          ].map((tip, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/5 rounded-xl p-4 flex gap-3 hover:bg-white/[0.05] transition-colors">
              <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-slate-400 text-xs leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

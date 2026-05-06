"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import axios from 'axios';
import dynamic from 'next/dynamic';
import ContractProgress from '../../../../components/ContractProgress';
import ClauseList from '../../../../components/ClauseList';
import ChatWithContract from '../../../../components/ChatWithContract';
import AnalysisSkeleton from '../../../../components/skeletons/AnalysisSkeleton';

const PDFViewer = dynamic(() => import('../../../../components/PDFViewer'), { 
  ssr: false,
  loading: () => <div className="text-gray-500 p-20 animate-pulse">Loading PDF engine...</div>
});

export default function ContractDetailsPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { getToken } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'clauses' | 'chat'>('summary');
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);

  const fetchContract = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`http://localhost:3001/api/contracts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
    } catch (error) {
      console.error("Failed to fetch contract:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContract();
    
    // Fallback polling: if SSE fails or isn't used, we still ping every 5 seconds until done
    const interval = setInterval(() => {
      if (data?.contract?.status === 'analyzing' || data?.contract?.status === 'pending') {
        fetchContract();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [id, getToken, data?.contract?.status]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] bg-gray-950 text-white overflow-hidden">
        {/* LEFT COLUMN SKELETON */}
        <div className="w-[55%] border-r border-gray-800 flex flex-col relative bg-gray-900 shadow-inner p-8">
           <div className="h-full w-full bg-gray-800/50 animate-pulse rounded-xl border border-gray-700 flex items-center justify-center">
             <div className="flex flex-col items-center space-y-4">
               <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
               <p className="text-gray-500 font-medium animate-pulse">Loading Document...</p>
             </div>
           </div>
        </div>
        
        {/* RIGHT COLUMN SKELETON */}
        <div className="w-[45%] flex flex-col bg-gray-900 shadow-2xl relative z-20">
          <div className="p-4 border-b border-gray-800 bg-gray-950 flex space-x-2">
            <div className="h-10 bg-gray-800 animate-pulse rounded-xl w-24"></div>
            <div className="h-10 bg-gray-800 animate-pulse rounded-xl w-24"></div>
            <div className="h-10 bg-gray-800 animate-pulse rounded-xl w-24"></div>
          </div>
          <div className="flex-1 overflow-auto p-8 custom-scrollbar">
            <AnalysisSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.contract) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <div className="text-2xl text-gray-500 font-semibold bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-2xl">
          Contract not found
        </div>
      </div>
    );
  }

  const { contract, analysis } = data;
  const isAnalyzing = contract.status === 'analyzing' || contract.status === 'pending';

  const handleExport = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`http://localhost:3001/api/contracts/${id}/export`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to export');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Analysis-${contract.name.replace(/\.pdf$/i, '')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export report");
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-950 text-white overflow-hidden">
      {/* LEFT COLUMN: PDF Viewer (55%) */}
      <div className="w-[55%] border-r border-gray-800 flex flex-col relative bg-gray-900 shadow-inner">
        {/* PDF Toolbar */}
        <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-gray-950/80 backdrop-blur-md z-10 shadow-sm">
          <h2 className="font-semibold text-lg truncate pr-4 text-gray-200">{contract.name}</h2>
          <div className="flex items-center space-x-4 text-sm font-medium bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700">
            <button 
              disabled={pageNumber <= 1} 
              onClick={() => setPageNumber(prev => prev - 1)}
              className="text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
            >
              Prev
            </button>
            <span className="text-blue-400">{pageNumber} <span className="text-gray-500">/</span> {numPages || '-'}</span>
            <button 
              disabled={pageNumber >= (numPages || 1)} 
              onClick={() => setPageNumber(prev => prev + 1)}
              className="text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
        
        {/* PDF Document Container */}
        <div className="flex-1 overflow-auto p-8 flex justify-center custom-scrollbar">
          <div className="shadow-2xl border border-gray-700 rounded-lg overflow-hidden bg-white">
            <PDFViewer 
              url={contract.s3Url} 
              pageNumber={pageNumber} 
              setNumPages={(n) => setNumPages(n)} 
            />
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Analysis Panel (45%) */}
      <div className="w-[45%] flex flex-col bg-gray-900 shadow-2xl relative z-20">
        {/* Tabs */}
        <div className="flex justify-between items-center border-b border-gray-800 p-4 bg-gray-950">
          <div className="flex space-x-2">
            {['summary', 'clauses', 'chat'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                  activeTab === tab 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          
          {!isAnalyzing && analysis && (
            <button 
              onClick={handleExport}
              className="flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg border border-gray-700 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export PDF
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto p-8 custom-scrollbar">
          {isAnalyzing ? (
            <div className="mt-20 flex flex-col items-center justify-center animate-in slide-in-from-bottom-4 duration-700">
              <ContractProgress contractId={contract._id} />
              <p className="text-center text-blue-400/80 mt-6 text-sm font-medium animate-pulse tracking-wide">
                Our AI is actively processing and extracting legal clauses...
              </p>
            </div>
          ) : !analysis ? (
            <div className="flex flex-col items-center justify-center h-full text-red-400/80">
              <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Analysis failed or is missing. Please re-upload the document.
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              
              {/* SUMMARY TAB */}
              {activeTab === 'summary' && (
                <div className="space-y-8">
                  <div className="flex justify-between items-end pb-4 border-b border-gray-800">
                    <h3 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                      Contract Summary
                    </h3>
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-gray-500 uppercase tracking-widest mb-1.5 font-semibold">Overall Risk Score</span>
                      <span className={`px-4 py-1.5 rounded-full text-sm font-black shadow-lg ${
                        analysis.overallRisk > 70 ? 'bg-red-500/20 text-red-400 shadow-red-900/20' :
                        analysis.overallRisk > 30 ? 'bg-yellow-500/20 text-yellow-400 shadow-yellow-900/20' :
                        'bg-green-500/20 text-green-400 shadow-green-900/20'
                      }`}>
                        {analysis.overallRisk} / 100
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800/40 p-6 rounded-2xl border border-gray-700/50 shadow-inner leading-relaxed text-gray-300 text-lg">
                    {analysis.summary}
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-gray-800/60 p-6 rounded-2xl border border-gray-700/50 shadow-sm hover:border-gray-600 transition-colors">
                      <h4 className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        Parties Involved
                      </h4>
                      <ul className="list-disc list-inside text-sm text-gray-300 space-y-2">
                        {analysis.parties.map((p: string, i: number) => <li key={i}>{p}</li>)}
                      </ul>
                    </div>
                    <div className="bg-gray-800/60 p-6 rounded-2xl border border-gray-700/50 shadow-sm hover:border-gray-600 transition-colors space-y-6">
                      <div>
                        <h4 className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                          Effective Date
                        </h4>
                        <p className="text-base font-medium text-gray-200 bg-gray-900 inline-block px-3 py-1 rounded">
                          {analysis.effectiveDate ? new Date(analysis.effectiveDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          Termination Date
                        </h4>
                        <p className="text-base font-medium text-gray-200 bg-gray-900 inline-block px-3 py-1 rounded">
                          {analysis.terminationDate ? new Date(analysis.terminationDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not specified'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CLAUSES TAB */}
              {activeTab === 'clauses' && (
                <ClauseList clauses={analysis.clauses} />
              )}

              {/* CHAT TAB */}
              {activeTab === 'chat' && (
                <ChatWithContract contractId={contract._id} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

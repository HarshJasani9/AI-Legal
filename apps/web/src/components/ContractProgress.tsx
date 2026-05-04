"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';

export default function ContractProgress({ contractId }: { contractId: string }) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('pending');
  const { getToken } = useAuth();

  useEffect(() => {
    let eventSource: EventSource | null = null;

    const setupSSE = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        // We pass the token in the query string since EventSource does not support custom headers
        eventSource = new EventSource(`http://localhost:3001/api/contracts/${contractId}/stream?token=${token}`);

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.error) {
              console.error(data.error);
              eventSource?.close();
              return;
            }

            setProgress(data.progress);
            setStatus(data.status);

            if (data.status === 'done' || data.status === 'failed') {
              eventSource?.close();
            }
          } catch (e) {
            console.error("Failed to parse SSE data", e);
          }
        };

        eventSource.onerror = (error) => {
          console.error("SSE Error:", error);
          eventSource?.close();
        };
      } catch (err) {
        console.error("Error setting up SSE:", err);
      }
    };

    setupSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [contractId, getToken]);

  return (
    <div className="w-full max-w-xl mx-auto my-8 p-6 bg-gray-800 rounded-xl border border-gray-700 shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">AI Analysis Status</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
          ${status === 'done' ? 'bg-green-500/20 text-green-400' : 
            status === 'failed' ? 'bg-red-500/20 text-red-400' : 
            'bg-blue-500/20 text-blue-400 animate-pulse'}`}>
          {status}
        </span>
      </div>

      <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden relative">
        <div 
          className={`h-4 transition-all duration-500 ease-out ${status === 'failed' ? 'bg-red-500' : 'bg-blue-500'}`} 
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-right text-sm text-gray-400 mt-2">{progress}% complete</p>
    </div>
  );
}

"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import axios from 'axios';
import Link from 'next/link';

export default function CompareView() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [contractA, setContractA] = useState<string>('');
  const [contractB, setContractB] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const token = await getToken();
        const res = await axios.get('http://localhost:3001/api/contracts', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const completedContracts = res.data.filter((c: any) => c.status === 'done');
        setContracts(completedContracts);
      } catch (error) {
        console.error("Failed to fetch contracts", error);
      }
    };
    fetchContracts();
  }, [getToken]);

  const handleCompare = async () => {
    if (!contractA || !contractB) return;
    setLoading(true);
    setResult(null);
    
    try {
      const token = await getToken();
      const res = await axios.post('http://localhost:3001/api/contracts/compare', {
        contractIdA: contractA,
        contractIdB: contractB
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResult(res.data);
    } catch (error) {
      console.error("Failed to compare", error);
      alert("Failed to compare contracts. Ensure both have completed analysis.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto text-white">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
            Compare Contracts
          </h1>
          <p className="text-gray-400 mt-2">AI-powered redlining and risk shift analysis.</p>
        </div>
        <Link 
          href="/contracts" 
          className="bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 px-6 rounded-lg transition-colors border border-gray-700"
        >
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-gray-800/60 p-6 rounded-2xl border border-gray-700/50 shadow-xl mb-10">
        <div className="flex flex-col md:flex-row gap-6 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wider">Version A (Original)</label>
            <select 
              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner"
              value={contractA}
              onChange={(e) => setContractA(e.target.value)}
            >
              <option value="">Select a base contract...</option>
              {contracts.map(c => (
                <option key={c._id || c.id} value={c._id || c.id}>{c.name} ({new Date(c.createdAt).toLocaleDateString()})</option>
              ))}
            </select>
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wider">Version B (Modified)</label>
            <select 
              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner"
              value={contractB}
              onChange={(e) => setContractB(e.target.value)}
            >
              <option value="">Select a modified contract...</option>
              {contracts.map(c => (
                <option key={c._id || c.id} value={c._id || c.id}>{c.name} ({new Date(c.createdAt).toLocaleDateString()})</option>
              ))}
            </select>
          </div>
          <button 
            onClick={handleCompare}
            disabled={!contractA || !contractB || contractA === contractB || loading}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 px-8 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-900/50"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Comparing...
              </span>
            ) : 'Run AI Comparison'}
          </button>
        </div>
      </div>

      {result && result.comparison && (
        <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
          {/* Risk Change Banner */}
          <div className={`p-8 rounded-2xl border flex items-center justify-between shadow-2xl ${
            result.comparison.riskChange === 'improved' ? 'bg-green-500/10 border-green-500/30 shadow-green-900/20' :
            result.comparison.riskChange === 'worsened' ? 'bg-red-500/10 border-red-500/30 shadow-red-900/20' :
            'bg-gray-800 border-gray-700'
          }`}>
            <div>
              <h2 className="text-2xl font-bold mb-2 text-white">Overall Risk Shift</h2>
              <p className="text-base text-gray-300">Based on our analysis, the legal risk profile of Version B has <strong className="text-white">{result.comparison.riskChange}</strong> compared to Version A.</p>
            </div>
            <span className={`px-6 py-3 rounded-xl font-black uppercase tracking-widest text-lg shadow-sm ${
              result.comparison.riskChange === 'improved' ? 'text-green-400 bg-green-500/20 border border-green-500/30' :
              result.comparison.riskChange === 'worsened' ? 'text-red-400 bg-red-500/20 border border-red-500/30' :
              'text-gray-300 bg-gray-700 border border-gray-600'
            }`}>
              {result.comparison.riskChange}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Added & Removed */}
            <div className="space-y-8">
              <div className="bg-gray-800/40 rounded-2xl p-6 border border-gray-700/50 shadow-sm hover:border-gray-600 transition-colors">
                <h3 className="text-xl font-bold text-green-400 flex items-center mb-6 pb-4 border-b border-gray-700/50">
                  <svg className="w-6 h-6 mr-3 bg-green-500/20 p-1 rounded" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                  Added in Version B
                </h3>
                {result.comparison.added?.length > 0 ? (
                  <ul className="space-y-4">
                    {result.comparison.added.map((item: string, i: number) => (
                      <li key={i} className="flex items-start bg-gray-900/80 p-4 rounded-xl text-sm text-gray-200 border-l-4 border-green-500 shadow-sm leading-relaxed">
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-gray-500 italic text-sm text-center py-4">No new clauses added.</p>}
              </div>

              <div className="bg-gray-800/40 rounded-2xl p-6 border border-gray-700/50 shadow-sm hover:border-gray-600 transition-colors">
                <h3 className="text-xl font-bold text-red-400 flex items-center mb-6 pb-4 border-b border-gray-700/50">
                  <svg className="w-6 h-6 mr-3 bg-red-500/20 p-1 rounded" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" /></svg>
                  Removed from Version A
                </h3>
                {result.comparison.removed?.length > 0 ? (
                  <ul className="space-y-4">
                    {result.comparison.removed.map((item: string, i: number) => (
                      <li key={i} className="flex items-start bg-gray-900/80 p-4 rounded-xl text-sm text-gray-400 border-l-4 border-red-500 shadow-sm line-through decoration-red-500/50 leading-relaxed">
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-gray-500 italic text-sm text-center py-4">No clauses removed.</p>}
              </div>
            </div>

            {/* Changed */}
            <div className="bg-gray-800/40 rounded-2xl p-6 border border-gray-700/50 shadow-sm hover:border-gray-600 transition-colors h-fit">
              <h3 className="text-xl font-bold text-blue-400 flex items-center mb-6 pb-4 border-b border-gray-700/50">
                <svg className="w-6 h-6 mr-3 bg-blue-500/20 p-1 rounded" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Modified Clauses
              </h3>
              {result.comparison.changed?.length > 0 ? (
                <div className="space-y-8">
                  {result.comparison.changed.map((change: any, i: number) => (
                    <div key={i} className="bg-gray-900/50 rounded-xl p-1 border border-gray-700">
                      <div className="px-4 py-3 border-b border-gray-800">
                        <h4 className="font-bold text-gray-200 text-lg">{change.clause}</h4>
                      </div>
                      <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-gray-800">
                        <div className="flex-1 p-4 bg-red-900/5">
                          <p className="text-red-400 text-xs font-bold uppercase tracking-wider mb-2">Version A</p>
                          <p className="text-gray-400 text-sm leading-relaxed">{change.before}</p>
                        </div>
                        <div className="flex-1 p-4 bg-green-900/5">
                          <p className="text-green-400 text-xs font-bold uppercase tracking-wider mb-2">Version B</p>
                          <p className="text-gray-200 text-sm leading-relaxed">{change.after}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-gray-500 italic text-sm text-center py-4">No existing clauses were modified.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

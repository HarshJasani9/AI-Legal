import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

interface Contract {
  id: string;
  name: string;
  createdAt: string;
  fileSize: number;
  status: 'pending' | 'analyzing' | 'done' | 'failed';
}

async function getContracts(token: string): Promise<Contract[]> {
  try {
    const res = await axios.get('http://localhost:3001/api/contracts', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  } catch (error) {
    console.error("Error fetching contracts:", error);
    return [];
  }
}

export default async function ContractsPage() {
  const { userId, getToken } = auth(); // Note: use await auth() if using Clerk v5+ strict mode
  
  if (!userId) {
    redirect('/');
  }

  const token = await getToken();
  const contracts = await getContracts(token!);

  const formatSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'analyzing': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'done': return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'failed': return 'bg-red-500/20 text-red-400 border border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-800">
          <h1 className="text-3xl font-bold">My Contracts</h1>
          <Link 
            href="/" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-lg shadow-blue-500/20"
          >
            Upload New Contract
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contracts.map(contract => (
            <Link href={`/contracts/${contract.id}`} key={contract.id}>
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-blue-500/50 hover:bg-gray-800 transition-all cursor-pointer group">
                <h2 className="text-xl font-semibold mb-3 truncate group-hover:text-blue-400 transition-colors" title={contract.name}>
                  {contract.name}
                </h2>
                
                <div className="text-sm text-gray-400 mb-6 space-y-2">
                  <div className="flex justify-between">
                    <span>Uploaded:</span>
                    <span className="text-gray-300">{new Date(contract.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Size:</span>
                    <span className="text-gray-300">{formatSize(contract.fileSize)}</span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider ${getStatusColor(contract.status)}`}>
                    {contract.status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
          
          {contracts.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500 bg-gray-800/30 border border-dashed border-gray-700 rounded-xl">
              <svg className="w-16 h-16 mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg mb-2">No contracts found</p>
              <p className="text-sm">Upload your first document to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

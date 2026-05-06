"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-900 text-white p-6 text-center">
      <div className="bg-gray-800 border border-gray-700 p-10 rounded-2xl shadow-2xl max-w-md w-full">
        <svg className="w-16 h-16 text-red-500 mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
        <p className="text-gray-400 mb-8">
          We encountered an unexpected error while rendering this page.
        </p>
        <div className="flex flex-col space-y-3">
          <button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-lg shadow-blue-500/20"
            onClick={() => reset()}
          >
            Try again
          </button>
          <button
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            onClick={() => window.location.href = '/'}
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
}

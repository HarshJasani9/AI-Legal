export default function AnalysisSkeleton() {
  return (
    <div className="space-y-5 mt-4">
      <div className="h-8 bg-gray-800 animate-pulse rounded w-1/3 mb-8"></div>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 animate-pulse">
          <div className="flex justify-between items-start mb-5">
            <div className="h-5 bg-gray-700 rounded w-1/3"></div>
            <div className="h-6 bg-gray-700 rounded-full w-20"></div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-700 rounded w-4/6"></div>
          </div>
          <div className="h-4 bg-gray-700 rounded w-1/4 mt-5"></div>
        </div>
      ))}
    </div>
  );
}

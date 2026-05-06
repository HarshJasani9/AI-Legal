export default function ContractCardSkeleton() {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 h-full flex flex-col justify-between animate-pulse">
      <div>
        <div className="h-6 bg-gray-700 rounded w-3/4 mb-4"></div>
        
        <div className="mb-6 space-y-3 mt-5">
          <div className="flex justify-between items-center">
            <div className="h-4 bg-gray-700 rounded w-1/4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/3"></div>
          </div>
          <div className="flex justify-between items-center">
            <div className="h-4 bg-gray-700 rounded w-1/4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/4"></div>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <div className="h-7 bg-gray-700 rounded-full w-24"></div>
      </div>
    </div>
  );
}

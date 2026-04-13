import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const DashboardSkeleton = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Skeleton width={200} height={32} />
            <div className="flex items-center space-x-4">
              <Skeleton circle width={40} height={40} />
              <Skeleton width={100} height={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs Skeleton */}
        <div className="mb-8">
          <div className="flex space-x-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} width={120} height={40} />
            ))}
          </div>
        </div>

        {/* Content Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6">
              <Skeleton width="80%" height={24} className="mb-4" />
              <Skeleton width="100%" height={16} className="mb-2" />
              <Skeleton width="60%" height={16} className="mb-4" />
              <Skeleton width="40%" height={20} className="mb-4" />
              <Skeleton width="100%" height={40} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
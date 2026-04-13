import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const ProjectCardSkeleton = () => {
  return (
    <div className="bg-white shadow-md rounded p-4 w-full max-w-md">
      <Skeleton height={24} width="80%" className="mb-2" />
      <Skeleton height={16} width="100%" className="mb-2" />
      <Skeleton height={16} width="60%" className="mb-2" />
      <Skeleton height={20} width="40%" className="mb-4" />
      <Skeleton height={40} width="100%" />
    </div>
  );
};

export default ProjectCardSkeleton;
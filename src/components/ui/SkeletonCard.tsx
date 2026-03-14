'use client';

import { Skeleton, SkeletonText, SkeletonAvatar } from './Skeleton';

interface SkeletonCardProps {
  showImage?: boolean;
  showTitle?: boolean;
  showDescription?: boolean;
  showFooter?: boolean;
  lines?: number;
  className?: string;
}

export function SkeletonCard({
  showImage = true,
  showTitle = true,
  showDescription = true,
  showFooter = false,
  lines = 3,
  className,
}: SkeletonCardProps) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg shadow p-4 ${className}`}>
      {showImage && (
        <div className="mb-4">
          <Skeleton height="160px" className="w-full" />
        </div>
      )}
      
      {showTitle && (
        <Skeleton variant="text" width="70%" height="1.5rem" className="mb-2" />
      )}
      
      {showDescription && (
        <SkeletonText lines={lines} />
      )}
      
      {showFooter && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <SkeletonAvatar size="sm" />
          <Skeleton variant="text" width="80px" height="1rem" />
        </div>
      )}
    </div>
  );
}

/**
 * Skeleton Card Grid - Hiển thị nhiều skeleton cards trong grid
 */
interface SkeletonCardGridProps {
  count?: number;
  columns?: 1 | 2 | 3 | 4;
  showImage?: boolean;
  showTitle?: boolean;
  showDescription?: boolean;
}

export function SkeletonCardGrid({
  count = 4,
  columns = 3,
  showImage = true,
  showTitle = true,
  showDescription = true,
}: SkeletonCardGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard
          key={i}
          showImage={showImage}
          showTitle={showTitle}
          showDescription={showDescription}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton Stats Card - Cho dashboard stats
 */
interface SkeletonStatsCardProps {
  icon?: boolean;
}

export function SkeletonStatsCard({ icon = true }: SkeletonStatsCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        {icon && (
          <Skeleton variant="rectangular" width="48px" height="48px" className="rounded-lg" />
        )}
        <Skeleton variant="text" width="60px" height="1.5rem" />
      </div>
      <Skeleton variant="text" width="100%" height="2rem" className="mb-2" />
      <Skeleton variant="text" width="80%" height="1rem" />
    </div>
  );
}

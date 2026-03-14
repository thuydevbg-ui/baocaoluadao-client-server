'use client';

import { Skeleton } from '@/components/ui/Skeleton';
import { SkeletonStatsCard, SkeletonCardGrid } from '@/components/ui/SkeletonCard';
import { SkeletonTable } from '@/components/ui/SkeletonTable';

const recentColumns = [
  { key: 'id', label: 'ID', width: '60px' },
  { key: 'type', label: 'Loại', width: '100px' },
  { key: 'value', label: 'Giá trị' },
  { key: 'status', label: 'Trạng thái', width: '100px' },
  { key: 'date', label: 'Ngày', width: '120px' },
];

export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton variant="text" width="250px" height="2rem" />
        <Skeleton height="2.5rem" width="150px" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SkeletonStatsCard />
        <SkeletonStatsCard />
        <SkeletonStatsCard />
        <SkeletonStatsCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <Skeleton variant="text" width="180px" height="1.25rem" className="mb-4" />
          <Skeleton height="200px" className="w-full" />
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <Skeleton variant="text" width="180px" height="1.25rem" className="mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton variant="circular" width="40px" height="40px" />
                <div className="flex-1">
                  <Skeleton variant="text" width="150px" height="1rem" />
                  <Skeleton variant="text" width="100px" height="0.875rem" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <Skeleton variant="text" width="150px" height="1.25rem" className="mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton variant="text" width="100px" height="1rem" />
                <Skeleton variant="text" width="50px" height="1rem" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 col-span-2">
          <div className="flex items-center justify-between mb-4">
            <Skeleton variant="text" width="150px" height="1.25rem" />
            <Skeleton height="2rem" width="80px" />
          </div>
          <SkeletonTable columns={recentColumns} rows={5} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SkeletonCardGrid count={3} columns={3} showImage={false} showTitle={true} showDescription={true} />
      </div>
    </div>
  );
}

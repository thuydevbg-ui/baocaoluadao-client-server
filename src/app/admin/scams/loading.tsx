'use client';

import { SkeletonTable } from '@/components/ui/SkeletonTable';
import { Skeleton } from '@/components/ui/Skeleton';

const scamColumns = [
  { key: 'checkbox', label: '', width: '40px' },
  { key: 'id', label: 'ID', width: '60px' },
  { key: 'type', label: 'Loại', width: '100px' },
  { key: 'value', label: 'Nội dung' },
  { key: 'category', label: 'Danh mục', width: '120px' },
  { key: 'risk_level', label: 'Mức độ', width: '100px' },
  { key: 'reports', label: 'Báo cáo', width: '80px' },
  { key: 'verified', label: 'Xác minh', width: '80px' },
  { key: 'created', label: 'Ngày tạo', width: '120px' },
  { key: 'actions', label: 'Thao tác', width: '100px' },
];

export default function ScamsLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton variant="text" width="180px" height="1.75rem" />
        <div className="flex gap-3">
          <Skeleton height="2.5rem" width="100px" />
          <Skeleton height="2.5rem" width="140px" />
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height="2rem" width={`${80 + Math.random() * 60}px`} />
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
            <Skeleton variant="text" width="70px" height="0.875rem" className="mb-2" />
            <Skeleton variant="text" width="50px" height="1.5rem" />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Skeleton height="2.5rem" width="250px" />
        <Skeleton height="2.5rem" width="130px" />
        <Skeleton height="2.5rem" width="130px" />
        <Skeleton height="2.5rem" width="100px" />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        <SkeletonTable
          columns={scamColumns}
          rows={10}
          showCheckbox={true}
          showActions={true}
        />
      </div>

      <div className="flex items-center justify-between">
        <Skeleton variant="text" width="180px" height="1rem" />
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} height="2rem" width="2.5rem" />
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';

import { SkeletonTable } from '@/components/ui/SkeletonTable';
import { Skeleton } from '@/components/ui/Skeleton';

const reportColumns = [
  { key: 'checkbox', label: '', width: '40px' },
  { key: 'id', label: 'ID', width: '60px' },
  { key: 'type', label: 'Loại', width: '100px' },
  { key: 'value', label: 'Nội dung' },
  { key: 'reporter', label: 'Người báo cáo', width: '150px' },
  { key: 'status', label: 'Trạng thái', width: '100px' },
  { key: 'priority', label: 'Ưu tiên', width: '80px' },
  { key: 'created', label: 'Ngày báo cáo', width: '120px' },
  { key: 'actions', label: 'Thao tác', width: '100px' },
];

export default function ReportsLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton variant="text" width="200px" height="1.75rem" />
        <Skeleton height="2.5rem" width="140px" />
      </div>

      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height="2.5rem" width={`${100 + Math.random() * 50}px`} />
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
            <Skeleton variant="text" width="80px" height="0.875rem" className="mb-2" />
            <Skeleton variant="text" width="60px" height="1.5rem" />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Skeleton height="2.5rem" width="280px" />
        <Skeleton height="2.5rem" width="120px" />
        <Skeleton height="2.5rem" width="120px" />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        <SkeletonTable
          columns={reportColumns}
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

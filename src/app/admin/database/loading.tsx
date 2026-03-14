'use client';

import { SkeletonTable } from '@/components/ui/SkeletonTable';
import { Skeleton } from '@/components/ui/Skeleton';

const databaseColumns = [
  { key: 'checkbox', label: '', width: '40px' },
  { key: 'id', label: 'ID', width: '60px' },
  { key: 'type', label: 'Loại', width: '100px' },
  { key: 'value', label: 'Giá trị' },
  { key: 'status', label: 'Trạng thái', width: '100px' },
  { key: 'risk', label: 'Mức độ rủi ro', width: '120px' },
  { key: 'reports', label: 'Số báo cáo', width: '100px' },
  { key: 'source', label: 'Nguồn', width: '100px' },
  { key: 'created', label: 'Ngày tạo', width: '120px' },
  { key: 'updated', label: 'Cập nhật', width: '120px' },
  { key: 'actions', label: 'Thao tác', width: '100px' },
];

export default function DatabaseLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton variant="text" width="220px" height="1.75rem" />
        <div className="flex gap-3">
          <Skeleton height="2.5rem" width="100px" />
          <Skeleton height="2.5rem" width="140px" />
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} height="2rem" width={`${80 + Math.random() * 60}px`} />
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
            <Skeleton variant="text" width="70px" height="0.875rem" className="mb-2" />
            <Skeleton variant="text" width="50px" height="1.5rem" />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Skeleton height="2.5rem" width="250px" />
        <Skeleton height="2.5rem" width="140px" />
        <Skeleton height="2.5rem" width="140px" />
        <Skeleton height="2.5rem" width="100px" />
        <Skeleton height="2.5rem" width="100px" />
      </div>

      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
        <Skeleton variant="rectangular" width="20px" height="20px" />
        <Skeleton variant="text" width="120px" height="1rem" />
        <div className="flex gap-2 ml-auto">
          <Skeleton height="2rem" width="90px" />
          <Skeleton height="2rem" width="90px" />
          <Skeleton height="2rem" width="90px" />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        <SkeletonTable
          columns={databaseColumns}
          rows={12}
          showCheckbox={true}
          showActions={true}
        />
      </div>

      <div className="flex items-center justify-between">
        <Skeleton variant="text" width="200px" height="1rem" />
        <div className="flex gap-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height="2rem" width="2.5rem" />
          ))}
        </div>
      </div>
    </div>
  );
}

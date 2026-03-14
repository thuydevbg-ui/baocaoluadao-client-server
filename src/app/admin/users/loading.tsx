'use client';

import { SkeletonTable } from '@/components/ui/SkeletonTable';
import { Skeleton } from '@/components/ui/Skeleton';

const userColumns = [
  { key: 'checkbox', label: '', width: '40px' },
  { key: 'id', label: 'ID', width: '60px' },
  { key: 'name', label: 'Tên người dùng' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Số điện thoại', width: '130px' },
  { key: 'role', label: 'Vai trò', width: '100px' },
  { key: 'status', label: 'Trạng thái', width: '100px' },
  { key: 'reputation', label: 'Điểm uy tín', width: '100px' },
  { key: 'reports', label: 'Báo cáo', width: '80px' },
  { key: 'joined', label: 'Ngày tham gia', width: '120px' },
  { key: 'actions', label: 'Thao tác', width: '100px' },
];

export default function UsersLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton variant="text" width="200px" height="1.75rem" />
        <Skeleton height="2.5rem" width="140px" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
            <Skeleton variant="text" width="80px" height="0.875rem" className="mb-2" />
            <Skeleton variant="text" width="60px" height="1.5rem" />
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Skeleton height="2.5rem" width="300px" />
        <Skeleton height="2.5rem" width="120px" />
        <Skeleton height="2.5rem" width="120px" />
        <Skeleton height="2.5rem" width="100px" />
      </div>

      {/* Bulk Actions */}
      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
        <Skeleton variant="rectangular" width="20px" height="20px" />
        <Skeleton variant="text" width="150px" height="1rem" />
        <div className="flex gap-2 ml-auto">
          <Skeleton height="2rem" width="80px" />
          <Skeleton height="2rem" width="80px" />
          <Skeleton height="2rem" width="80px" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        <SkeletonTable
          columns={userColumns}
          rows={10}
          showCheckbox={true}
          showActions={true}
        />
      </div>

      {/* Pagination */}
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

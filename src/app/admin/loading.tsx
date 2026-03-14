'use client';

import { SkeletonTable } from '@/components/ui/SkeletonTable';
import { Skeleton } from '@/components/ui/Skeleton';
import { SkeletonStatsCard } from '@/components/ui/SkeletonCard';

const adminColumns = [
  { key: 'id', label: 'ID', width: '80px' },
  { key: 'name', label: 'Tên' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Vai trò', width: '100px' },
  { key: 'status', label: 'Trạng thái', width: '100px' },
  { key: 'created', label: 'Ngày tạo', width: '120px' },
  { key: 'actions', label: 'Thao tác', width: '100px' },
];

export default function AdminLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Skeleton variant="text" width="250px" height="2rem" />
        <div className="flex gap-3">
          <Skeleton height="2.5rem" width="120px" />
          <Skeleton height="2.5rem" width="120px" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SkeletonStatsCard />
        <SkeletonStatsCard />
        <SkeletonStatsCard />
        <SkeletonStatsCard />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Skeleton height="2.5rem" width="200px" />
        <Skeleton height="2.5rem" width="150px" />
        <Skeleton height="2.5rem" width="180px" />
        <Skeleton height="2.5rem" width="100px" />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow">
        <SkeletonTable
          columns={adminColumns}
          rows={8}
          showCheckbox={true}
          showActions={true}
        />
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Skeleton variant="text" width="200px" height="1rem" />
        <div className="flex gap-2">
          <Skeleton height="2rem" width="60px" />
          <Skeleton height="2rem" width="60px" />
          <Skeleton height="2rem" width="60px" />
          <Skeleton height="2rem" width="60px" />
        </div>
      </div>
    </div>
  );
}

'use client';

import { Skeleton } from './Skeleton';

interface Column {
  key: string;
  label: string;
  width?: string;
}

interface SkeletonTableProps {
  columns: Column[];
  rows?: number;
  showCheckbox?: boolean;
  showActions?: boolean;
}

export function SkeletonTable({
  columns,
  rows = 5,
  showCheckbox = false,
  showActions = false,
}: SkeletonTableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            {showCheckbox && (
              <th className="p-3 w-10">
                <Skeleton variant="rectangular" width="20px" height="20px" />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                className="p-3 text-sm font-semibold text-slate-600 dark:text-slate-300"
                style={{ width: column.width }}
              >
                <Skeleton variant="text" width="80px" height="1rem" />
              </th>
            ))}
            {showActions && (
              <th className="p-3 w-24">
                <Skeleton variant="text" width="60px" height="1rem" />
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="border-b border-slate-100 dark:border-slate-800">
              {showCheckbox && (
                <td className="p-3">
                  <Skeleton variant="rectangular" width="20px" height="20px" />
                </td>
              )}
              {columns.map((column) => (
                <td key={column.key} className="p-3 text-sm text-slate-500">
                  <Skeleton variant="text" width="100%" height="1rem" />
                </td>
              ))}
              {showActions && (
                <td className="p-3">
                  <div className="flex gap-2">
                    <Skeleton variant="rectangular" width="24px" height="24px" />
                    <Skeleton variant="rectangular" width="24px" height="24px" />
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

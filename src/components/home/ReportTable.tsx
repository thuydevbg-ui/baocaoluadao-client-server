'use client';

import StatusBadge from '@/components/home/StatusBadge';

export type StatusType = 'safe' | 'warning' | 'danger' | 'investigating';

export type ReportRow = {
  id: string;
  target: string;
  category: string;
  reports: string;
  views: string;
  likes: string;
  comments: string;
  date: string;
  status: StatusType;
};

const statusMap: Record<StatusType, { label: string; color: string; bg: string }> = {
  safe: { label: 'An toàn', color: '#1e8e3e', bg: 'rgba(30,142,62,0.12)' },
  warning: { label: 'Cảnh báo', color: '#f9ab00', bg: 'rgba(249,171,0,0.15)' },
  danger: { label: 'Nguy hiểm', color: '#d93025', bg: 'rgba(217,48,37,0.15)' },
  investigating: { label: 'Đang điều tra', color: '#1a73e8', bg: 'rgba(26,115,232,0.15)' },
};

interface ReportTableProps {
  rows: ReportRow[];
}

export default function ReportTable({ rows }: ReportTableProps) {
  const columns = [
    'Domain / Phone',
    'Category',
    'Reports',
    'Views',
    'Likes',
    'Comments',
    'Date',
    'Status',
  ];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[760px] text-left text-[13px]">
        <thead>
          <tr className="text-[11px] uppercase tracking-[0.18em] text-[#5f6368]">
            {columns.map((column) => (
              <th key={column} className="pb-3 pr-4">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const status = statusMap[row.status];
            return (
              <tr
                key={row.id}
                className={`cursor-pointer border-y border-[#e5e7eb] ${idx === rows.length - 1 ? 'border-b-0' : ''} hover:bg-[#f8f9fa] transition`}
              >
                <td className="py-3 pr-4 font-[600] text-[#202124]">{row.target}</td>
                <td className="py-3 pr-4 text-[#5f6368]">{row.category}</td>
                <td className="py-3 pr-4 text-[#202124]">{row.reports}</td>
                <td className="py-3 pr-4 text-[#202124]">{row.views}</td>
                <td className="py-3 pr-4 text-[#202124]">{row.likes}</td>
                <td className="py-3 pr-4 text-[#202124]">{row.comments}</td>
                <td className="py-3 pr-4 text-[#202124]">{row.date}</td>
                <td className="py-3">
                  <StatusBadge label={status.label} color={status.color} background={status.bg} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

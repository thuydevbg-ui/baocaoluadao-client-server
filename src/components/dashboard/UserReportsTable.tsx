import React from 'react';
import Link from 'next/link';
import { Button, Card, Badge } from '@/components/ui';

export interface UserReportRow {
  id: string;
  type: string;
  target: string;
  riskScore: number;
  risk: string;
  status: string;
  createdAt: string;
}

interface Props {
  reports: UserReportRow[];
  onCreate?: () => void;
  onDelete?: (id: string) => void;
}

export function UserReportsTable({ reports, onCreate, onDelete }: Props) {
  return (
    <Card className="space-y-4 w-full">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Báo cáo</p>
          <h2 className="text-lg font-semibold text-text-main">Báo cáo của bạn</h2>
        </div>
        <Button size="sm" onClick={onCreate}>Gửi báo cáo</Button>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 sm:hidden">
        {reports.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-text-muted">
            Chưa có báo cáo nào.
          </div>
        )}
        {reports.map((r) => {
          const statusVariant = r.status === 'completed' ? 'success' : r.status === 'pending' ? 'warning' : 'primary';
          const created = new Date(r.createdAt).toLocaleDateString('vi-VN');
          const shortId = r.id ? `${r.id.slice(0, 8)}…${r.id.slice(-6)}` : '—';
          return (
            <div key={r.id} className="rounded-2xl border border-slate-200 bg-bg-cardHover/50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-mono text-text-muted">{shortId}</p>
                  <p className="mt-1 text-sm font-semibold text-text-main break-all">{r.target}</p>
                  <p className="mt-1 text-xs text-text-muted">
                    {created} • <span className="capitalize">{r.type}</span> • Rủi ro: <span className="font-semibold text-text-main">{r.riskScore}</span>
                  </p>
                </div>
                <Badge variant={statusVariant}>{r.status}</Badge>
              </div>

              <div className="mt-3 flex items-center justify-end gap-4">
                <Link
                  href={`/detail/${r.type}/${encodeURIComponent(r.target)}`}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  Xem
                </Link>
                <button
                  type="button"
                  className="text-sm font-semibold text-danger hover:underline"
                  onClick={() => onDelete?.(r.id)}
                >
                  Xóa
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table (tablet/desktop) */}
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 sm:block">
        <table className="min-w-[640px] divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-text-secondary">ID</th>
              <th className="px-4 py-2 text-left font-semibold text-text-secondary">Loại</th>
              <th className="px-4 py-2 text-left font-semibold text-text-secondary">Mục tiêu</th>
              <th className="px-4 py-2 text-left font-semibold text-text-secondary">Rủi ro</th>
              <th className="px-4 py-2 text-left font-semibold text-text-secondary">Trạng thái</th>
              <th className="px-4 py-2 text-left font-semibold text-text-secondary">Ngày tạo</th>
              <th className="px-4 py-2 text-right font-semibold text-text-secondary">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {reports.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-text-muted">Chưa có báo cáo nào.</td>
              </tr>
            )}
            {reports.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/70">
                <td className="px-4 py-2 font-mono text-xs text-text-main truncate max-w-[120px]">{r.id}</td>
                <td className="px-4 py-2 capitalize text-text-main">{r.type}</td>
                <td className="px-4 py-2 text-text-secondary truncate max-w-[180px]" title={r.target}>{r.target}</td>
                <td className="px-4 py-2 text-text-main">{r.riskScore}</td>
                <td className="px-4 py-2"><Badge variant={r.status === 'completed' ? 'success' : r.status === 'pending' ? 'warning' : 'primary'}>{r.status}</Badge></td>
                <td className="px-4 py-2 text-text-muted">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</td>
                <td className="px-4 py-2 text-right space-x-2">
                  <Link href={`/detail/${r.type}/${encodeURIComponent(r.target)}`} className="text-primary hover:underline">Xem</Link>
                  <button className="text-danger hover:underline" onClick={() => onDelete?.(r.id)}>Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

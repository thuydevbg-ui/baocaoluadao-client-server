import React from 'react';
import Link from 'next/link';
import { Button, Card, Badge } from '@/components/ui';

export interface UserReportRow {
  id: string;
  type: string;
  target: string;
  riskScore: number;
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
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Báo cáo</p>
          <h2 className="text-lg font-semibold text-text-main">Báo cáo của bạn</h2>
        </div>
        <Button size="sm" onClick={onCreate}>Gửi báo cáo</Button>
      </div>

      <div className="overflow-auto rounded-xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
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


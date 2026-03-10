import React from 'react';
import Link from 'next/link';
import { Button, Card, Badge } from '@/components/ui';
import { BarChart, CheckCircle, Clock3 } from 'lucide-react';

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
  const summary = {
    total: reports.length,
    completed: reports.filter((r) => r.status === 'completed').length,
    pending: reports.filter((r) => r.status === 'pending').length,
  };
  return (
    <Card className="space-y-5 w-full">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.3em] text-text-muted truncate">Báo cáo</p>
          <h2 className="text-lg font-semibold text-text-main truncate">Báo cáo của bạn</h2>
        </div>
        <Button size="sm" onClick={onCreate} className="shrink-0">Gửi báo cáo</Button>
      </div>

      <div className="flex flex-col gap-2 px-1">
        {[
          {
              label: 'Tất cả',
              value: summary.total,
              detail: 'Tất cả báo cáo',
              icon: BarChart,
              color: 'from-white to-slate-50 shadow-[0_15px_35px_rgba(15,23,42,0.08)]',
              iconColor: 'text-slate-500',
            },
            {
              label: 'Hoàn tất',
              value: summary.completed,
              detail: 'Báo cáo đã xử lý',
              icon: CheckCircle,
              color: 'from-emerald-50 to-white shadow-[0_15px_35px_rgba(16,185,129,0.18)]',
              iconColor: 'text-emerald-500',
            },
            {
              label: 'Chờ xử lý',
              value: summary.pending,
              detail: 'Báo cáo mới',
              icon: Clock3,
              color: 'from-orange-50 to-white shadow-[0_15px_35px_rgba(248,113,113,0.18)]',
              iconColor: 'text-amber-500',
            },
          ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
            className={`flex w-full items-center gap-3 rounded-[16px] bg-white/80 px-2 py-2 text-slate-700 shadow-[0_6px_18px_rgba(15,23,42,0.08)] border border-white/70 sm:w-auto sm:min-w-[120px]`}
          >
            <div className="flex items-center gap-3">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-base ${stat.iconColor}`}>
                  <Icon className="h-3 w-3" />
                </span>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">{stat.label}</p>
                  <div className="mt-1 flex items-center gap-2 text-[11px]">
                    <p className="text-2xl font-semibold">{stat.value}</p>
                    <span className="text-xs text-slate-500 whitespace-nowrap">{stat.detail}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        {reports.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-text-muted">
            Bạn chưa gửi báo cáo nào. Hãy chia sẻ thông tin để cộng đồng cảnh giác.
          </div>
        )}
        {reports.map((r) => {
          const statusVariant = r.status === 'completed' ? 'success' : r.status === 'pending' ? 'warning' : 'primary';
          const created = new Date(r.createdAt).toLocaleDateString('vi-VN');
          return (
            <div key={r.id} className="rounded-[30px] border border-white/80 bg-gradient-to-r from-white via-white to-[#eef5ff] p-4 shadow-[0_20px_45px_rgba(15,23,42,0.15)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-text-main">{r.target}</p>
                    <Badge variant={statusVariant}>{r.status}</Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    {created} • <span className="capitalize">{r.type}</span> • Rủi ro: <span className="font-semibold text-text-main">{r.riskScore}</span>
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-4 text-sm font-semibold text-text-secondary">
                  <Link
                    href={`/detail/${r.type}/${encodeURIComponent(r.target)}`}
                    className="text-primary underline decoration-primary/50"
                  >
                    Xem chi tiết
                  </Link>
                  <button
                    type="button"
                    className="text-danger underline decoration-danger/40"
                    onClick={() => onDelete?.(r.id)}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

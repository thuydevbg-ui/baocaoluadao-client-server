import React from 'react';
import { Card, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';

export interface TrustMetric {
  label: string;
  value: string;
  status: 'ok' | 'warn' | 'todo';
}

interface Props {
  score: number;
  metrics: TrustMetric[];
}

export function TrustScoreCard({ score, metrics }: Props) {
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Trust score</p>
          <h2 className="text-lg font-semibold text-text-main">Điểm tin cậy cá nhân</h2>
        </div>
        <Badge variant={score >= 80 ? 'success' : score >= 65 ? 'warning' : 'danger'}>{score}/100</Badge>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-text-main">Chỉ số tổng</p>
          <span className="text-lg font-bold text-primary">{score}%</span>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-success" style={{ width: `${score}%` }} />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {metrics.map((m) => (
          <div key={m.label} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 bg-bg-cardHover/50">
            <div>
              <p className="text-sm font-semibold text-text-main">{m.label}</p>
              <p className="text-xs text-text-muted">{m.value}</p>
            </div>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold border',
                m.status === 'ok' && 'border-success/30 bg-success/10 text-success',
                m.status === 'warn' && 'border-warning/30 bg-warning/10 text-warning',
                m.status === 'todo' && 'border-slate-200 bg-white text-text-muted'
              )}
            >
              {m.status === 'ok' ? 'Tốt' : m.status === 'warn' ? 'Cần xem' : 'Thiết lập'}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}


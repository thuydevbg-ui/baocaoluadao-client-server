import React from 'react';
import { ShieldCheck, ShieldOff, KeyRound, Lock, Link, Clock, Mail } from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';
import { cn } from '@/lib/utils';

export interface SecurityCheck {
  key: string;
  label: string;
  status: 'ok' | 'warn' | 'todo';
  detail?: string;
  actionLabel?: string;
  onAction?: () => void;
  disabled?: boolean;
}

export interface SecurityStatusProps {
  score: number;
  checks: SecurityCheck[];
}

export function SecurityStatusCard({ score, checks }: SecurityStatusProps) {
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Bảo mật</p>
          <h2 className="text-lg font-semibold text-text-main">Tình trạng bảo mật</h2>
        </div>
        <Badge variant={score >= 80 ? 'success' : score >= 60 ? 'warning' : 'danger'}>{score}/100</Badge>
      </div>

      <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <p className="text-sm font-semibold text-text-main">Điểm an toàn</p>
          </div>
          <span className="text-sm font-bold text-primary">{score}%</span>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-success" style={{ width: `${score}%` }} />
        </div>
      </div>

      <div className="space-y-2">
        {checks.map((item) => (
          <div key={item.key} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-xl',
                  item.status === 'ok' && 'bg-success/10 text-success',
                  item.status === 'warn' && 'bg-warning/10 text-warning',
                  item.status === 'todo' && 'bg-slate-100 text-text-muted'
                )}
              >
                {item.key === 'password' && <Lock className="h-4 w-4" />}
                {item.key === 'twofa' && <KeyRound className="h-4 w-4" />}
                {item.key === 'oauth' && <Link className="h-4 w-4" />}
                {item.key === 'login' && <Clock className="h-4 w-4" />}
                {item.key === 'email' && <Mail className="h-4 w-4" />}
                {!['password', 'twofa', 'oauth', 'login', 'email'].includes(item.key) && <ShieldOff className="h-4 w-4" />}
              </span>
              <div>
                <p className="text-sm font-semibold text-text-main">{item.label}</p>
                <p className="text-xs text-text-muted">{item.detail || '—'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={item.status === 'ok' ? 'success' : item.status === 'warn' ? 'warning' : 'default'}>
                {item.status === 'ok' ? 'Ổn định' : item.status === 'warn' ? 'Cần xem' : 'Chưa bật'}
              </Badge>
              {item.onAction && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={item.onAction}
                  disabled={item.disabled}
                >
                  {item.disabled ? 'Đang xử lý...' : item.actionLabel || 'Thiết lập'}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

import React from 'react';
import { Copy, Mail, Shield, User } from 'lucide-react';
import { Badge, Button, Card, Chip } from '@/components/ui';
import SafeImage from '@/components/ui/SafeImage';
import { cn } from '@/lib/utils';

export interface UserOverviewStats {
  reportsSubmitted: number;
  reportsResolved: number;
  activeAlerts: number;
  trustScore: number;
}

export interface UserOverviewProps {
  name: string;
  email: string;
  role: string;
  accountId: string;
  joinDate: string;
  status: string;
  avatar?: string | null;
  onEdit?: () => void;
  onLogout?: () => void;
  onSecurity?: () => void;
  stats: UserOverviewStats;
}

export function UserOverviewCard({
  name,
  email,
  role,
  accountId,
  joinDate,
  status,
  avatar,
  onEdit,
  onLogout,
  onSecurity,
  stats,
}: UserOverviewProps) {
  const statItems = [
    { label: 'Báo cáo đã gửi', value: stats.reportsSubmitted, tone: 'text-primary' },
    { label: 'Đã hoàn tất', value: stats.reportsResolved, tone: 'text-success' },
    { label: 'Cảnh báo đang theo dõi', value: stats.activeAlerts, tone: 'text-warning' },
    { label: 'Trust score', value: `${stats.trustScore}%`, tone: 'text-text-main' },
  ];

  const shortId = accountId ? `${accountId.slice(0, 8)}…${accountId.slice(-6)}` : '—';

  return (
    <Card className="relative overflow-hidden p-4 sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(59,130,246,0.08),transparent_38%),radial-gradient(circle_at_88%_0%,rgba(16,185,129,0.08),transparent_34%)]" />
      <div className="relative flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-primary shadow-inner">
              {avatar ? (
                <SafeImage src={avatar} fallbackSrc="/favicon.ico" alt={name} className="h-full w-full object-cover" />
              ) : (
                <User className="h-7 w-7" />
              )}
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-text-main break-words">{name}</h1>
                <Badge variant={role === 'admin' ? 'warning' : 'success'}>{role === 'admin' ? 'Admin' : 'Thành viên'}</Badge>
                <Badge variant="primary">{status}</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
                <span className="inline-flex min-w-0 items-center gap-1">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="truncate">{email}</span>
                </span>
                <Chip
                  variant="primary"
                  className="max-w-full truncate font-mono"
                  title={`ID: ${accountId || '—'}`}
                >
                  ID: {shortId}
                </Chip>
                {accountId && (
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        navigator.clipboard.writeText(accountId);
                      } catch {
                        // ignore
                      }
                    }}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition',
                      'border-slate-200 bg-white text-text-secondary hover:bg-slate-50 hover:text-text-main'
                    )}
                    title="Sao chép ID"
                    aria-label="Sao chép ID"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Sao chép
                  </button>
                )}
                <Chip variant="default">Tham gia: {joinDate}</Chip>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={onEdit}>Chỉnh sửa hồ sơ</Button>
            <Button size="sm" variant="secondary" onClick={onSecurity} leftIcon={<Shield className="h-4 w-4" />}>Bảo mật</Button>
            <Button size="sm" variant="ghost" onClick={onLogout}>Đăng xuất</Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {statItems.map((item) => (
            <div key={item.label} className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-[11px] uppercase tracking-[0.14em] text-text-muted">{item.label}</p>
              <p className={cn('text-xl font-bold', item.tone)}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

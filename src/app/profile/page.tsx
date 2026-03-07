'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { toast } from '@/components/ui/Toast';
import { Navbar, MobileNav, Footer } from '@/components/layout';
import { Button, Card, Skeleton } from '@/components/ui';
import { UserOverviewCard } from '@/components/dashboard/UserOverviewCard';
import { SecurityStatusCard } from '@/components/dashboard/SecurityStatusCard';
import { RecentActivity, ActivityItem } from '@/components/dashboard/RecentActivity';
import { UserReportsTable, UserReportRow } from '@/components/dashboard/UserReportsTable';
import { WatchlistCard, WatchItem } from '@/components/dashboard/WatchlistCard';
import { NotificationSettings, NotificationPrefs } from '@/components/dashboard/NotificationSettings';
import { TrustScoreCard, TrustMetric } from '@/components/dashboard/TrustScoreCard';
import { FileText, Sparkles } from 'lucide-react';

interface ProfileUser {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  avatar?: string | null;
  securityScore?: number;
}

interface SecurityStatus {
  passwordSet: boolean;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  oauthConnected: boolean;
  recentLogin: string | null;
  securityScore?: number;
}

interface ApiState {
  user?: ProfileUser;
  security?: SecurityStatus;
  activity: ActivityItem[];
  reports: UserReportRow[];
  watchlist: WatchItem[];
  notifications: NotificationPrefs;
}

const defaultPrefs: NotificationPrefs = { emailAlerts: true, pushAlerts: false, weeklySummary: true };

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [state, setState] = useState<ApiState>({ activity: [], reports: [], watchlist: [], notifications: defaultPrefs });
  const [reloadKey, setReloadKey] = useState(0);

  const loadAll = async () => {
    if (status !== 'authenticated') return;
    setLoading(true);
    setError('');
    try {
      const [profileRes, securityRes, activityRes, reportsRes, watchlistRes, notifRes] = await Promise.all([
        fetch('/api/user/profile', { cache: 'no-store' }),
        fetch('/api/user/security-status', { cache: 'no-store' }),
        fetch('/api/user/activity', { cache: 'no-store' }),
        fetch('/api/user/reports', { cache: 'no-store' }),
        fetch('/api/user/watchlist', { cache: 'no-store' }),
        fetch('/api/user/notifications', { cache: 'no-store' }),
      ]);

      const [profile, security, activity, reports, watchlist, notifications] = await Promise.all([
        profileRes.json(),
        securityRes.json(),
        activityRes.json(),
        reportsRes.json(),
        watchlistRes.json(),
        notifRes.json(),
      ]);

      if (!profileRes.ok) throw new Error(profile.error || 'Tải hồ sơ thất bại');
      if (!securityRes.ok) throw new Error(security.error || 'Tải bảo mật thất bại');
      if (!activityRes.ok) throw new Error(activity.error || 'Tải hoạt động thất bại');
      if (!reportsRes.ok) throw new Error(reports.error || 'Tải báo cáo thất bại');
      if (!watchlistRes.ok) throw new Error(watchlist.error || 'Tải watchlist thất bại');
      if (!notifRes.ok) throw new Error(notifications.error || 'Tải thông báo thất bại');

      setState({
        user: profile.user,
        security: security.security,
        activity: activity.items || [],
        reports: reports.items || [],
        watchlist: watchlist.items || [],
        notifications: notifications.settings || defaultPrefs,
      });
    } catch (err: any) {
      setError(err?.message || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, reloadKey]);

  const user = state.user;
  const security = state.security;

  const stats = useMemo(() => ({
    reportsSubmitted: state.reports.length,
    reportsResolved: state.reports.filter((r) => r.status === 'completed').length,
    activeAlerts: state.watchlist.length,
    trustScore: security?.securityScore ?? user?.securityScore ?? 72,
  }), [state.reports, state.watchlist.length, security?.securityScore, user?.securityScore]);

  const checks = useMemo(() => ([
    { key: 'password', label: 'Mật khẩu', status: security?.passwordSet ? 'ok' : 'todo', detail: security?.passwordSet ? 'Đã thiết lập' : 'Chưa đặt mật khẩu' },
    { key: 'twofa', label: 'Xác thực 2 lớp', status: security?.twoFactorEnabled ? 'ok' : 'warn', detail: security?.twoFactorEnabled ? 'Đang bật' : 'Chưa kích hoạt' },
    { key: 'oauth', label: 'Liên kết OAuth', status: security?.oauthConnected ? 'ok' : 'warn', detail: security?.oauthConnected ? 'Đã liên kết' : 'Chưa liên kết' },
    { key: 'login', label: 'Lần đăng nhập gần nhất', status: security?.recentLogin ? 'ok' : 'todo', detail: security?.recentLogin || 'Chưa ghi nhận' },
    { key: 'email', label: 'Email xác minh', status: security?.emailVerified ? 'ok' : 'warn', detail: security?.emailVerified ? 'Đã xác minh' : 'Chưa xác minh' },
  ]), [security]);

  const trustMetrics: TrustMetric[] = [
    { label: 'Mật khẩu', value: security?.passwordSet ? 'Đã thiết lập' : 'Chưa đặt', status: security?.passwordSet ? 'ok' : 'todo' },
    { label: '2FA', value: security?.twoFactorEnabled ? 'Đang bật' : 'Chưa bật', status: security?.twoFactorEnabled ? 'ok' : 'warn' },
    { label: 'Email', value: security?.emailVerified ? 'Đã xác minh' : 'Chưa xác minh', status: security?.emailVerified ? 'ok' : 'warn' },
    { label: 'Báo cáo', value: `${state.reports.length} báo cáo`, status: state.reports.length > 0 ? 'ok' : 'todo' },
  ];

  const handleDeleteReport = async (id: string) => {
    await fetch(`/api/user/reports/${id}`, { method: 'DELETE' });
    toast({ title: 'Đã xóa báo cáo' });
    setReloadKey((k) => k + 1);
  };

  const handleAddWatch = async (target: string, type: string) => {
    await fetch('/api/user/watchlist', { method: 'POST', body: JSON.stringify({ target, type }) });
    toast({ title: 'Đã thêm vào watchlist' });
    setReloadKey((k) => k + 1);
  };

  const handleRemoveWatch = async (id: string) => {
    await fetch(`/api/user/watchlist/${id}`, { method: 'DELETE' });
    toast({ title: 'Đã gỡ watchlist' });
    setReloadKey((k) => k + 1);
  };

  const handleNotifications = async (prefs: NotificationPrefs) => {
    setState((s) => ({ ...s, notifications: prefs }));
    await fetch('/api/user/notifications', { method: 'PATCH', body: JSON.stringify(prefs) });
    toast({ title: 'Đã lưu cài đặt thông báo' });
  };

  const handleCreateReport = () => {
    window.location.href = '/report';
  };

  const isLoading = loading || status === 'loading';

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f8fb]">
      <Navbar />

      <main className="flex-1 pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-6">
          {status === 'unauthenticated' && (
            <Card className="max-w-2xl mx-auto text-center space-y-4">
              <h2 className="text-xl font-semibold text-text-main">Bạn chưa đăng nhập</h2>
              <p className="text-sm text-text-secondary">Đăng nhập để xem dashboard và quản lý cảnh báo.</p>
              <div className="flex justify-center gap-3">
                <Link href="/login"><Button>Đăng nhập</Button></Link>
                <Link href="/register"><Button variant="secondary">Đăng ký</Button></Link>
              </div>
            </Card>
          )}

          {status === 'authenticated' && (
            <>
              <section className="grid gap-4 lg:grid-cols-[2fr_1.1fr]">
                {isLoading || !user ? (
                  <Skeleton variant="rectangular" height={180} />
                ) : (
                  <UserOverviewCard
                    name={user.name}
                    email={user.email}
                    role={user.role}
                    accountId={user.id}
                    joinDate={new Date(user.createdAt).toLocaleDateString('vi-VN')}
                    status={security?.recentLogin ? 'Hoạt động' : 'Mới'}
                    avatar={user.avatar}
                    onEdit={() => toast({ title: 'Chỉnh sửa hồ sơ đang được xây dựng' })}
                    onLogout={() => signOut({ callbackUrl: '/' })}
                    onSecurity={() => toast({ title: 'Đi tới bảo mật', description: 'Tính năng đang hoàn thiện' })}
                    stats={stats}
                  />
                )}

                <SecurityStatusCard score={security?.securityScore ?? stats.trustScore} checks={checks} />
              </section>

              <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                <RecentActivity items={state.activity} />
                <TrustScoreCard score={stats.trustScore} metrics={trustMetrics} />
              </section>

              <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
                <UserReportsTable reports={state.reports} onCreate={handleCreateReport} onDelete={handleDeleteReport} />
                <WatchlistCard items={state.watchlist} onAdd={handleAddWatch} onRemove={handleRemoveWatch} />
              </section>

              <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                <NotificationSettings prefs={state.notifications} onChange={handleNotifications} />
                <Card className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Hướng dẫn</p>
                      <h2 className="text-lg font-semibold text-text-main">Tài nguyên an toàn</h2>
                    </div>
                    <Button size="sm" variant="secondary" leftIcon={<Sparkles className="h-4 w-4" />}>Khám phá</Button>
                  </div>
                  <ul className="space-y-2 text-sm text-text-secondary">
                    <li>• Cách nhận biết website giả mạo</li>
                    <li>• Thiết lập 2FA cho tài khoản</li>
                    <li>• Quy trình gửi báo cáo lừa đảo</li>
                  </ul>
                </Card>
              </section>
            </>
          )}

          {status === 'authenticated' && error && (
            <Card className="border-danger/40 bg-danger/5 text-danger">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Lỗi tải dữ liệu</p>
                  <p className="text-sm">{error}</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => setReloadKey((k) => k + 1)}>Thử lại</Button>
              </div>
            </Card>
          )}
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}

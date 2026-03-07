'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useToast } from '@/components/ui/Toast';
import { Navbar, MobileNav, Footer } from '@/components/layout';
import { Button, Card, Skeleton, Modal, Input } from '@/components/ui';
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
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [state, setState] = useState<ApiState>({ activity: [], reports: [], watchlist: [], notifications: defaultPrefs });
  const [reloadKey, setReloadKey] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [twofaModalOpen, setTwofaModalOpen] = useState(false);
  const [oauthModalOpen, setOauthModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [twofaPassword, setTwofaPassword] = useState('');
  const [oauthPassword, setOauthPassword] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [emailDevCode, setEmailDevCode] = useState<string | null>(null);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);

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

  const handleSubmitPassword = async () => {
    if (!passwordForm.next || passwordForm.next.length < 8) {
      showToast('error', 'Mật khẩu mới tối thiểu 8 ký tự');
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      showToast('error', 'Mật khẩu xác nhận không khớp');
      return;
    }
    try {
      setActionLoading('password');
      const res = await fetch('/api/user/security/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: passwordForm.current, newPassword: passwordForm.next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Đổi mật khẩu thất bại');
      showToast('success', 'Đổi mật khẩu thành công');
      setPasswordModalOpen(false);
      setPasswordForm({ current: '', next: '', confirm: '' });
      setReloadKey((k) => k + 1);
    } catch (err: any) {
      showToast('error', err?.message || 'Không đổi được mật khẩu');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmitTwoFA = async () => {
    try {
      setActionLoading('twofa');
      const res = await fetch('/api/user/security/twofa', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !security?.twoFactorEnabled, password: twofaPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không cập nhật được 2FA');
      showToast('success', data.enabled ? 'Đã bật 2FA' : 'Đã tắt 2FA');
      setTwofaModalOpen(false);
      setTwofaPassword('');
      setReloadKey((k) => k + 1);
    } catch (err: any) {
      showToast('error', err?.message || 'Không thể đổi trạng thái 2FA');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmitOAuth = async () => {
    try {
      setActionLoading('oauth');
      const res = await fetch('/api/user/security/oauth', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connected: !security?.oauthConnected, password: oauthPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không cập nhật được OAuth');
      showToast('success', data.connected ? 'Đã liên kết OAuth' : 'Đã hủy liên kết OAuth');
      setOauthModalOpen(false);
      setOauthPassword('');
      setReloadKey((k) => k + 1);
    } catch (err: any) {
      showToast('error', err?.message || 'Không thể đổi trạng thái OAuth');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendEmailCode = async () => {
    try {
      setSendingCode(true);
      const res = await fetch('/api/user/security/email/send', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không gửi được mã');
      setEmailDevCode(data.devCode || null);
      showToast('success', 'Đã gửi mã xác minh');
    } catch (err: any) {
      showToast('error', err?.message || 'Không gửi được mã');
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyEmailCode = async () => {
    if (!emailCode.trim()) {
      showToast('error', 'Nhập mã xác minh');
      return;
    }
    try {
      setVerifyingCode(true);
      const res = await fetch('/api/user/security/email/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: emailCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không xác minh được');
      showToast('success', 'Email đã xác minh');
      setEmailModalOpen(false);
      setEmailCode('');
      setEmailDevCode(null);
      setReloadKey((k) => k + 1);
    } catch (err: any) {
      showToast('error', err?.message || 'Không xác minh được');
    } finally {
      setVerifyingCode(false);
    }
  };

  const checks = useMemo(() => ([
    {
      key: 'password',
      label: 'Mật khẩu',
      status: security?.passwordSet ? 'ok' : 'todo',
      detail: security?.passwordSet ? 'Đã thiết lập' : 'Chưa đặt mật khẩu',
      actionLabel: security?.passwordSet ? 'Đổi mật khẩu' : 'Thiết lập',
      onAction: () => setPasswordModalOpen(true),
      disabled: actionLoading === 'password',
    },
    {
      key: 'twofa',
      label: 'Xác thực 2 lớp',
      status: security?.twoFactorEnabled ? 'ok' : 'warn',
      detail: security?.twoFactorEnabled ? 'Đang bật' : 'Chưa kích hoạt',
      actionLabel: security?.twoFactorEnabled ? 'Quản lý' : 'Bật 2FA',
      onAction: () => setTwofaModalOpen(true),
      disabled: actionLoading === 'twofa',
    },
    {
      key: 'oauth',
      label: 'Liên kết OAuth',
      status: security?.oauthConnected ? 'ok' : 'warn',
      detail: security?.oauthConnected ? 'Đã liên kết' : 'Chưa liên kết',
      actionLabel: security?.oauthConnected ? 'Quản lý' : 'Liên kết',
      onAction: () => setOauthModalOpen(true),
      disabled: actionLoading === 'oauth',
    },
    {
      key: 'login',
      label: 'Lần đăng nhập gần nhất',
      status: security?.recentLogin ? 'ok' : 'todo',
      detail: security?.recentLogin || 'Chưa ghi nhận',
      actionLabel: 'Làm mới',
      onAction: () => setReloadKey((k) => k + 1),
    },
    {
      key: 'email',
      label: 'Email xác minh',
      status: security?.emailVerified ? 'ok' : 'warn',
      detail: security?.emailVerified ? 'Đã xác minh' : 'Chưa xác minh',
      actionLabel: security?.emailVerified ? 'Xem' : 'Xác minh',
      onAction: () => setEmailModalOpen(true),
    },
  ]), [security, actionLoading]);

  const trustMetrics: TrustMetric[] = [
    { label: 'Mật khẩu', value: security?.passwordSet ? 'Đã thiết lập' : 'Chưa đặt', status: security?.passwordSet ? 'ok' : 'todo' },
    { label: '2FA', value: security?.twoFactorEnabled ? 'Đang bật' : 'Chưa bật', status: security?.twoFactorEnabled ? 'ok' : 'warn' },
    { label: 'Email', value: security?.emailVerified ? 'Đã xác minh' : 'Chưa xác minh', status: security?.emailVerified ? 'ok' : 'warn' },
    { label: 'Báo cáo', value: `${state.reports.length} báo cáo`, status: state.reports.length > 0 ? 'ok' : 'todo' },
  ];

  const handleDeleteReport = async (id: string) => {
    await fetch(`/api/user/reports/${id}`, { method: 'DELETE' });
    showToast('success', 'Đã xóa báo cáo');
    setReloadKey((k) => k + 1);
  };

  const handleAddWatch = async (target: string, type: string) => {
    await fetch('/api/user/watchlist', { method: 'POST', body: JSON.stringify({ target, type }) });
    showToast('success', 'Đã thêm vào watchlist');
    setReloadKey((k) => k + 1);
  };

  const handleRemoveWatch = async (id: string) => {
    await fetch(`/api/user/watchlist/${id}`, { method: 'DELETE' });
    showToast('success', 'Đã gỡ watchlist');
    setReloadKey((k) => k + 1);
  };

  const handleNotifications = async (prefs: NotificationPrefs) => {
    setState((s) => ({ ...s, notifications: prefs }));
    await fetch('/api/user/notifications', { method: 'PATCH', body: JSON.stringify(prefs) });
    showToast('success', 'Đã lưu cài đặt thông báo');
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
          {status === 'authenticated' && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Hồ sơ & bảo mật</p>
                <h1 className="text-2xl font-bold text-text-main">Bảng điều khiển người dùng</h1>
                <p className="text-sm text-text-secondary">Quản lý báo cáo, theo dõi cảnh báo và độ an toàn tài khoản.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/report">
                  <Button size="sm" leftIcon={<FileText className="h-4 w-4" />}>Báo cáo mới</Button>
                </Link>
                <Button size="sm" variant="secondary" onClick={() => setReloadKey((k) => k + 1)}>Làm mới dữ liệu</Button>
              </div>
            </div>
          )}

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
                    onEdit={() => showToast('warning', 'Chỉnh sửa hồ sơ đang được xây dựng')}
                    onLogout={() => signOut({ callbackUrl: '/' })}
                    onSecurity={() => showToast('warning', 'Đi tới bảo mật sẽ có trong bản kế tiếp')}
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

      {/* Modals */}
      <Modal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title="Đổi mật khẩu"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Mật khẩu hiện tại"
            type="password"
            value={passwordForm.current}
            onChange={(e) => setPasswordForm((f) => ({ ...f, current: e.target.value }))}
            placeholder="Nhập mật khẩu hiện tại"
          />
          <Input
            label="Mật khẩu mới"
            type="password"
            value={passwordForm.next}
            onChange={(e) => setPasswordForm((f) => ({ ...f, next: e.target.value }))}
            placeholder="Tối thiểu 8 ký tự"
          />
          <Input
            label="Xác nhận mật khẩu mới"
            type="password"
            value={passwordForm.confirm}
            onChange={(e) => setPasswordForm((f) => ({ ...f, confirm: e.target.value }))}
            placeholder="Nhập lại mật khẩu mới"
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setPasswordModalOpen(false)}>Hủy</Button>
            <Button
              onClick={handleSubmitPassword}
              isLoading={actionLoading === 'password'}
            >
              Lưu mật khẩu
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={twofaModalOpen}
        onClose={() => setTwofaModalOpen(false)}
        title={security?.twoFactorEnabled ? 'Tắt 2FA' : 'Bật 2FA'}
        size="sm"
      >
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">
            Nhập mật khẩu để {security?.twoFactorEnabled ? 'tắt' : 'bật'} xác thực hai lớp.
          </p>
          <Input
            label="Mật khẩu"
            type="password"
            value={twofaPassword}
            onChange={(e) => setTwofaPassword(e.target.value)}
            placeholder="••••••••"
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setTwofaModalOpen(false)}>Hủy</Button>
            <Button
              onClick={handleSubmitTwoFA}
              isLoading={actionLoading === 'twofa'}
            >
              Xác nhận
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={oauthModalOpen}
        onClose={() => setOauthModalOpen(false)}
        title={security?.oauthConnected ? 'Hủy liên kết OAuth' : 'Liên kết OAuth'}
        size="sm"
      >
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">
            Nhập mật khẩu để {security?.oauthConnected ? 'hủy liên kết' : 'liên kết'} tài khoản OAuth.
          </p>
          <Input
            label="Mật khẩu"
            type="password"
            value={oauthPassword}
            onChange={(e) => setOauthPassword(e.target.value)}
            placeholder="••••••••"
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setOauthModalOpen(false)}>Hủy</Button>
            <Button
              onClick={handleSubmitOAuth}
              isLoading={actionLoading === 'oauth'}
            >
              Xác nhận
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        title="Xác minh email"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Gửi mã xác minh tới email của bạn và nhập mã 6 chữ số để hoàn tất.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={handleSendEmailCode}
              isLoading={sendingCode}
            >
              Gửi mã
            </Button>
            {emailDevCode && (
              <span className="text-xs text-warning">Mã dev: {emailDevCode}</span>
            )}
          </div>
          <Input
            label="Mã xác minh"
            value={emailCode}
            onChange={(e) => setEmailCode(e.target.value)}
            placeholder="Nhập mã 6 chữ số"
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setEmailModalOpen(false)}>Đóng</Button>
            <Button
              onClick={handleVerifyEmailCode}
              isLoading={verifyingCode}
              disabled={!emailCode}
            >
              Xác minh
            </Button>
          </div>
        </div>
      </Modal>

      <Footer />
      <MobileNav />
    </div>
  );
}

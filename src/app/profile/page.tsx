'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useToast } from '@/components/ui/Toast';
import { Navbar, MobileNav, Footer } from '@/components/layout';
import { Button, Card, Skeleton, Modal, Input, Badge } from '@/components/ui';
import { UserOverviewCard } from '@/components/dashboard/UserOverviewCard';
import { SecurityStatusCard } from '@/components/dashboard/SecurityStatusCard';
import { RecentActivity, ActivityItem } from '@/components/dashboard/RecentActivity';
import { UserReportsTable, UserReportRow } from '@/components/dashboard/UserReportsTable';
import { WatchlistCard, WatchItem } from '@/components/dashboard/WatchlistCard';
import { NotificationSettings, NotificationPrefs } from '@/components/dashboard/NotificationSettings';
import { TrustScoreCard, TrustMetric } from '@/components/dashboard/TrustScoreCard';
import { FileText, Sparkles, Copy } from 'lucide-react';
import QRCode from 'qrcode.react';

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
  oauthProvider?: string | null;
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
type TwofaInfo = { enabled: boolean; secret?: string; otpauthUrl?: string; backupCodes?: string[] };

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
  const [oauthProvider, setOauthProvider] = useState<'google' | 'facebook' | 'twitter' | 'telegram'>('google');
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [twofaPassword, setTwofaPassword] = useState('');
  const [twofaCode, setTwofaCode] = useState('');
  const [twofaInfo, setTwofaInfo] = useState<TwofaInfo | null>(null);
  const [twofaStep, setTwofaStep] = useState<'loading' | 'overview' | 'verify' | 'enabled'>('overview');
  const [copyMessage, setCopyMessage] = useState('');
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

  useEffect(() => {
    if (oauthModalOpen && security?.oauthProvider) {
      const key = security.oauthProvider.toLowerCase() as 'google' | 'facebook' | 'twitter' | 'telegram';
      setOauthProvider(key);
    }
  }, [oauthModalOpen, security?.oauthProvider]);

  const user = state.user;
  const security = state.security;

  const stats = useMemo(() => ({
    reportsSubmitted: state.reports.length,
    reportsResolved: state.reports.filter((r) => r.status === 'completed').length,
    activeAlerts: state.watchlist.length,
    trustScore: security?.securityScore ?? user?.securityScore ?? 72,
  }), [state.reports, state.watchlist.length, security?.securityScore, user?.securityScore]);
  const oauthLabel = useMemo(() => {
    const key = (security?.oauthProvider || 'google').toLowerCase();
    const map: Record<string, string> = { google: 'Google', facebook: 'Facebook', twitter: 'X (Twitter)', telegram: 'Telegram' };
    return map[key] || 'Google';
  }, [security?.oauthProvider]);

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

  const loadTwofaStatus = async () => {
    if (!twofaModalOpen) return;
    try {
      setTwofaStep('loading');
      const res = await fetch('/api/user/security/twofa/status', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không tải được trạng thái 2FA');
      const info = data.data as TwofaInfo;
      setTwofaInfo(info || null);
      if (info?.enabled) setTwofaStep('enabled');
      else if (info?.secret) setTwofaStep('verify');
      else setTwofaStep('overview');
    } catch (err: any) {
      showToast('error', err?.message || 'Không tải được trạng thái 2FA');
      setTwofaStep('overview');
    }
  };

  useEffect(() => {
    if (twofaModalOpen) {
      setTwofaPassword('');
      setTwofaCode('');
      setCopyMessage('');
      loadTwofaStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [twofaModalOpen]);

  const handleStartTwofaSetup = async () => {
    try {
      setActionLoading('twofaSetup');
      const res = await fetch('/api/user/security/twofa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: twofaPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không khởi tạo 2FA');
      setTwofaInfo({ enabled: false, secret: data.secret, otpauthUrl: data.otpauthUrl, backupCodes: data.backupCodes });
      setTwofaStep('verify');
      showToast('success', 'Đã tạo mã 2FA, hãy quét và nhập mã');
    } catch (err: any) {
      showToast('error', err?.message || 'Không khởi tạo 2FA');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmTwofa = async () => {
    if (!twofaCode.trim()) {
      showToast('error', 'Nhập mã 6 số từ ứng dụng Authenticator');
      return;
    }
    try {
      setActionLoading('twofaConfirm');
      const res = await fetch('/api/user/security/twofa/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: twofaCode.trim(), password: twofaPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không bật được 2FA');
      showToast('success', 'Đã bật xác thực 2 lớp');
      setTwofaStep('enabled');
      setTwofaInfo((info) => info ? { ...info, enabled: true } : { enabled: true });
      setReloadKey((k) => k + 1);
    } catch (err: any) {
      showToast('error', err?.message || 'Không bật được 2FA');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisableTwofa = async () => {
    try {
      setActionLoading('twofaDisable');
      const res = await fetch('/api/user/security/twofa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: twofaPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không tắt được 2FA');
      showToast('success', 'Đã tắt 2FA');
      setTwofaStep('overview');
      setTwofaInfo({ enabled: false });
      setTwofaPassword('');
      setReloadKey((k) => k + 1);
    } catch (err: any) {
      showToast('error', err?.message || 'Không tắt được 2FA');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmitOAuth = async (connect: boolean) => {
    try {
      setActionLoading(connect ? 'oauthConnect' : 'oauthDisconnect');
      const res = await fetch('/api/user/security/oauth', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connected: connect, password: oauthPassword, provider: oauthProvider }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không cập nhật được OAuth');
      showToast('success', connect ? 'Đã liên kết OAuth' : 'Đã hủy liên kết OAuth');
      setOauthPassword('');
      setReloadKey((k) => k + 1);
      if (!connect) setOauthModalOpen(false);
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
      disabled: actionLoading?.startsWith('twofa') ?? false,
    },
    {
      key: 'oauth',
      label: 'Liên kết OAuth',
      status: security?.oauthConnected ? 'ok' : 'warn',
      detail: security?.oauthConnected ? `Đã liên kết ${oauthLabel}` : 'Chưa liên kết',
      actionLabel: security?.oauthConnected ? 'Quản lý' : 'Liên kết',
      onAction: () => setOauthModalOpen(true),
      disabled: actionLoading?.startsWith('oauth') ?? false,
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
        title="Quản lý xác thực 2 lớp"
        size="lg"
      >
        <div className="space-y-4">
          {/* Password */}
          <Input
            label="Nhập mật khẩu để xác thực phiên"
            type="password"
            value={twofaPassword}
            onChange={(e) => setTwofaPassword(e.target.value)}
            placeholder="••••••••"
          />

          {twofaStep === 'loading' && (
            <div className="text-sm text-text-secondary">Đang tải trạng thái 2FA...</div>
          )}

          {twofaStep === 'overview' && (
            <Card className="space-y-3">
              <p className="text-sm text-text-secondary">
                Bật 2FA để bảo vệ tài khoản khỏi truy cập trái phép. Bạn cần cài đặt Google Authenticator/Microsoft Authenticator.
              </p>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold text-text-main">Trạng thái</p>
                  <p className="text-xs text-text-muted">Chưa kích hoạt</p>
                </div>
                <Button
                  onClick={handleStartTwofaSetup}
                  isLoading={actionLoading === 'twofaSetup'}
                  disabled={!twofaPassword}
                >
                  Bắt đầu kích hoạt
                </Button>
              </div>
            </Card>
          )}

          {twofaStep === 'verify' && (
            <div className="grid gap-4 md:grid-cols-[180px_1fr]">
              <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 p-3 bg-white">
                {twofaInfo?.otpauthUrl ? (
                  <QRCode value={twofaInfo.otpauthUrl} size={150} />
                ) : (
                  <div className="text-sm text-text-secondary">Không có QR</div>
                )}
                <p className="text-xs text-text-muted text-center">Quét QR trong ứng dụng Authenticator</p>
              </div>
              <div className="space-y-3">
                <div className="rounded-xl border border-slate-200 p-3 bg-white">
                  <p className="text-xs uppercase tracking-[0.2em] text-text-muted mb-1">Mã bí mật</p>
                  <div className="flex items-center gap-2">
                    <code className="px-2 py-1 rounded bg-slate-100 text-sm">{twofaInfo?.secret || '—'}</code>
                    <Button
                      size="sm"
                      variant="secondary"
                      leftIcon={<Copy className="h-4 w-4" />}
                      onClick={() => {
                        if (twofaInfo?.secret) navigator.clipboard.writeText(twofaInfo.secret);
                        setCopyMessage('Đã copy');
                        setTimeout(() => setCopyMessage(''), 2000);
                      }}
                    >
                      Sao chép
                    </Button>
                    {copyMessage && <span className="text-xs text-success">{copyMessage}</span>}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-3 bg-white">
                  <p className="text-xs uppercase tracking-[0.2em] text-text-muted mb-2">Mã dự phòng</p>
                  <div className="grid grid-cols-2 gap-2">
                    {twofaInfo?.backupCodes?.map((c) => (
                      <code key={c} className="px-2 py-1 rounded bg-slate-100 text-sm">{c}</code>
                    ))}
                  </div>
                  <p className="text-xs text-warning mt-2">Lưu các mã này ở nơi an toàn; dùng khi mất thiết bị.</p>
                </div>

                <div className="grid gap-2 md:grid-cols-[1fr_auto] md:items-end">
                  <Input
                    label="Nhập mã 6 số từ ứng dụng"
                    value={twofaCode}
                    onChange={(e) => setTwofaCode(e.target.value)}
                    placeholder="123456"
                  />
                  <Button
                    onClick={handleConfirmTwofa}
                    isLoading={actionLoading === 'twofaConfirm'}
                    disabled={!twofaPassword || !twofaCode}
                  >
                    Kích hoạt 2FA
                  </Button>
                </div>
              </div>
            </div>
          )}

          {twofaStep === 'enabled' && (
            <div className="space-y-4">
              <Card className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-text-main">2FA đang bật</p>
                    <p className="text-xs text-text-muted">Đăng nhập sẽ yêu cầu mã Authenticator.</p>
                  </div>
                  <span className="rounded-full bg-success/10 text-success px-3 py-1 text-xs font-semibold">Đang bật</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="secondary"
                    onClick={loadTwofaStatus}
                    leftIcon={<Sparkles className="h-4 w-4" />}
                  >
                    Làm mới
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleDisableTwofa}
                    isLoading={actionLoading === 'twofaDisable'}
                    disabled={!twofaPassword}
                  >
                    Tắt 2FA
                  </Button>
                </div>
              </Card>

              {twofaInfo?.secret && (
                <Card className="grid gap-4 md:grid-cols-[180px_1fr]">
                  <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 p-3 bg-white">
                    {twofaInfo?.otpauthUrl ? (
                      <QRCode value={twofaInfo.otpauthUrl} size={150} />
                    ) : (
                      <div className="text-sm text-text-secondary">Không có QR</div>
                    )}
                    <p className="text-xs text-text-muted text-center">Quét QR để thêm thiết bị mới</p>
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-xl border border-slate-200 p-3 bg-white">
                      <p className="text-xs uppercase tracking-[0.2em] text-text-muted mb-1">Mã bí mật</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="px-2 py-1 rounded bg-slate-100 text-sm">{twofaInfo.secret}</code>
                        <Button
                          size="sm"
                          variant="secondary"
                          leftIcon={<Copy className="h-4 w-4" />}
                          onClick={() => {
                            navigator.clipboard.writeText(twofaInfo.secret || '');
                            setCopyMessage('Đã copy');
                            setTimeout(() => setCopyMessage(''), 2000);
                          }}
                        >
                          Sao chép
                        </Button>
                        {copyMessage && <span className="text-xs text-success">{copyMessage}</span>}
                      </div>
                    </div>

                    {twofaInfo.backupCodes && twofaInfo.backupCodes.length > 0 && (
                      <div className="rounded-xl border border-slate-200 p-3 bg-white space-y-2">
                        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Mã dự phòng</p>
                        <div className="grid grid-cols-2 gap-2">
                          {twofaInfo.backupCodes.map((c) => (
                            <code key={c} className="px-2 py-1 rounded bg-slate-100 text-sm">{c}</code>
                          ))}
                        </div>
                        <p className="text-xs text-warning">Lưu mã dự phòng để khôi phục khi mất thiết bị.</p>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="ghost" onClick={() => setTwofaModalOpen(false)}>Đóng</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={oauthModalOpen}
        onClose={() => setOauthModalOpen(false)}
        title="Quản lý liên kết OAuth"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Kết nối tài khoản Google để đăng nhập nhanh và bảo vệ tài khoản. Nhập mật khẩu để xác thực trước khi liên kết / hủy liên kết.
          </p>

          <div className="grid gap-3 md:grid-cols-2">
            {[
              { key: 'google', title: 'Google', desc: 'Đăng nhập bằng Google OAuth', enabled: true },
              { key: 'facebook', title: 'Facebook', desc: 'Đăng nhập bằng Facebook OAuth', enabled: true },
              { key: 'twitter', title: 'X (Twitter)', desc: 'Đăng nhập bằng X OAuth 2.0', enabled: true },
              { key: 'telegram', title: 'Telegram (sắp có)', desc: 'Kết nối bot/Telegram Login', enabled: false },
            ].map((item) => (
              <Card
                key={item.key}
                className={`space-y-2 border ${oauthProvider === item.key ? 'border-primary' : 'border-bg-border'} ${!item.enabled ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-text-main">{item.title}</p>
                    <p className="text-xs text-text-muted">{item.desc}</p>
                  </div>
                  <input
                    type="radio"
                    name="oauth-provider"
                    checked={oauthProvider === item.key}
                    onChange={() => setOauthProvider(item.key as any)}
                    className="h-4 w-4 accent-primary"
                    disabled={!item.enabled}
                  />
                </div>
                {security?.oauthConnected && oauthProvider === item.key ? (
                  <Badge variant="success">Đã liên kết</Badge>
                ) : (
                  <Badge variant={item.enabled ? 'warning' : 'default'}>{item.enabled ? 'Chưa liên kết' : 'Sắp có'}</Badge>
                )}
              </Card>
            ))}
          </div>

          <Input
            label="Mật khẩu"
            type="password"
            value={oauthPassword}
            onChange={(e) => setOauthPassword(e.target.value)}
            placeholder="••••••••"
          />

          <div className="flex flex-wrap gap-3 justify-end">
            <Button variant="ghost" onClick={() => setOauthModalOpen(false)}>Đóng</Button>
            {security?.oauthConnected ? (
              <Button
                variant="ghost"
                onClick={() => handleSubmitOAuth(false)}
                isLoading={actionLoading === 'oauthDisconnect'}
                disabled={!oauthPassword}
              >
                Hủy liên kết
              </Button>
            ) : (
              <Button
                onClick={() => handleSubmitOAuth(true)}
                isLoading={actionLoading === 'oauthConnect'}
                disabled={!oauthPassword || oauthProvider === 'telegram'}
              >
                Liên kết {oauthLabel}
              </Button>
            )}
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

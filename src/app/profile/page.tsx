'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import {
  Bell,
  Calendar,
  CheckCircle2,
  ChevronRight,
  FileText,
  KeyRound,
  Mail,
  MessageSquareText,
  ShieldCheck,
  ShieldOff,
  Sparkles,
  User,
  Users,
} from 'lucide-react';
import { Navbar, MobileNav, Footer } from '@/components/layout';
import { Badge, Button, Card, Skeleton } from '@/components/ui';
import SafeImage from '@/components/ui/SafeImage';
import { cn } from '@/lib/utils';

type ReportStatus = 'pending' | 'processing' | 'completed' | string;

type ReportType = 'website' | 'phone' | 'email' | 'social' | 'sms' | string;

interface ProfileUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  provider: string;
  createdAt: string;
  lastLoginAt: string | null;
  hasPassword: boolean;
  linkedAccounts: number;
}

interface ProfileReports {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  thisWeek: number;
  lastReportAt: string | null;
}

interface RecentReport {
  id: string;
  type: ReportType;
  target: string;
  status: ReportStatus;
  createdAt: string | null;
}

interface ProfileSettings {
  emailNotifications: boolean;
  analyticsEnabled: boolean;
  maintenanceMode: boolean;
}

interface ProfileResponse {
  success: boolean;
  user?: ProfileUser;
  reports?: ProfileReports;
  recentReports?: RecentReport[];
  settings?: ProfileSettings;
  error?: string;
}

const statusLabelMap: Record<string, string> = {
  pending: 'Chờ xử lý',
  processing: 'Đang xử lý',
  completed: 'Hoàn tất',
};

const statusVariantMap: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'primary'> = {
  pending: 'warning',
  processing: 'primary',
  completed: 'success',
};

const typeLabelMap: Record<string, string> = {
  website: 'Website',
  phone: 'Điện thoại',
  email: 'Email',
  social: 'Mạng xã hội',
  sms: 'SMS',
};

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelativeTime(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  if (diffMinutes < 1) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 30) return `${diffDays} ngày trước`;
  const diffMonths = Math.round(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} tháng trước`;
  const diffYears = Math.round(diffMonths / 12);
  return `${diffYears} năm trước`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [profileData, setProfileData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (status !== 'authenticated') return;

    const controller = new AbortController();
    let active = true;

    setLoading(true);
    setError('');

    fetch('/api/users/me', { signal: controller.signal, cache: 'no-store' })
      .then(async (res) => {
        const data = (await res.json()) as ProfileResponse;
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Không thể tải hồ sơ người dùng.');
        }
        return data;
      })
      .then((data) => {
        if (!active) return;
        setProfileData(data);
      })
      .catch((err) => {
        if (!active || err?.name === 'AbortError') return;
        setError(err?.message || 'Không thể tải hồ sơ người dùng.');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [status, reloadKey]);

  const user = profileData?.user;
  const reports = profileData?.reports;
  const recentReports = profileData?.recentReports || [];
  const settings = profileData?.settings;

  const displayName = user?.name || session?.user?.name || 'Người dùng ScamGuard';
  const displayEmail = user?.email || session?.user?.email || '—';
  const displayImage = user?.image || session?.user?.image || null;
  const roleLabel = user?.role === 'admin' ? 'Quản trị viên' : 'Thành viên';
  const providerLabel = user?.provider === 'google' ? 'Google' : 'Email & mật khẩu';

  const totalReports = reports?.total || 0;
  const pendingReports = (reports?.pending || 0) + (reports?.processing || 0);
  const completedReports = reports?.completed || 0;
  const thisWeekReports = reports?.thisWeek || 0;
  const loginChannels = (user?.linkedAccounts || 0) + (user?.hasPassword ? 1 : 0);

  const stats = useMemo(
    () => [
      {
        label: 'Báo cáo đã gửi',
        value: totalReports,
        helper: `+${thisWeekReports} trong 7 ngày`,
        icon: FileText,
        accent: 'text-primary',
      },
      {
        label: 'Đang xử lý',
        value: pendingReports,
        helper: pendingReports > 0 ? 'Cần theo dõi' : 'Không có',
        icon: ShieldOff,
        accent: 'text-warning',
      },
      {
        label: 'Hoàn tất',
        value: completedReports,
        helper: completedReports > 0 ? 'Đã phản hồi' : 'Chưa có',
        icon: CheckCircle2,
        accent: 'text-success',
      },
      {
        label: 'Kênh đăng nhập',
        value: loginChannels,
        helper: user ? 'Đã liên kết' : 'Chưa xác định',
        icon: ShieldCheck,
        accent: 'text-text-main',
      },
    ],
    [completedReports, loginChannels, pendingReports, thisWeekReports, totalReports, user]
  );

  const profileInfo = useMemo(
    () => [
      { label: 'Email', value: displayEmail, icon: Mail },
      { label: 'Vai trò', value: roleLabel, icon: Users },
      { label: 'Đăng nhập', value: providerLabel, icon: Sparkles },
      { label: 'Tham gia', value: formatDate(user?.createdAt), icon: Calendar },
    ],
    [displayEmail, providerLabel, roleLabel, user?.createdAt]
  );

  const securityItems = useMemo(
    () => [
      {
        label: 'Mật khẩu',
        detail: user?.hasPassword ? 'Đã thiết lập' : 'Chưa đặt mật khẩu',
        status: user?.hasPassword ? 'Ổn định' : 'Cần cập nhật',
        icon: KeyRound,
        variant: user?.hasPassword ? 'success' : 'warning',
      },
      {
        label: 'Liên kết OAuth',
        detail: user?.linkedAccounts ? `${user.linkedAccounts} tài khoản liên kết` : 'Chưa liên kết',
        status: user?.linkedAccounts ? 'Đang bật' : 'Chưa bật',
        icon: ShieldCheck,
        variant: user?.linkedAccounts ? 'success' : 'warning',
      },
      {
        label: 'Lần đăng nhập',
        detail: user?.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Chưa ghi nhận',
        status: user?.lastLoginAt ? 'Gần đây' : 'Chưa có',
        icon: Calendar,
        variant: user?.lastLoginAt ? 'success' : 'default',
      },
    ],
    [user?.hasPassword, user?.lastLoginAt, user?.linkedAccounts]
  );

  const recentActivities = useMemo(() => {
    const items: {
      label: string;
      detail: string;
      time: string;
      icon: typeof FileText;
      tone: string;
    }[] = [];

    if (recentReports[0]) {
      items.push({
        label: 'Gửi báo cáo mới',
        detail: recentReports[0].target,
        time: formatRelativeTime(recentReports[0].createdAt),
        icon: FileText,
        tone: 'text-danger',
      });
    }

    if (pendingReports > 0) {
      items.push({
        label: 'Báo cáo đang xử lý',
        detail: `${pendingReports} mục cần theo dõi`,
        time: reports?.lastReportAt ? formatRelativeTime(reports.lastReportAt) : 'Hôm nay',
        icon: Bell,
        tone: 'text-warning',
      });
    }

    if (user?.lastLoginAt) {
      items.push({
        label: 'Đăng nhập gần đây',
        detail: 'Phiên đăng nhập mới nhất',
        time: formatRelativeTime(user.lastLoginAt),
        icon: ShieldCheck,
        tone: 'text-success',
      });
    }

    if (user?.createdAt) {
      items.push({
        label: 'Tạo tài khoản',
        detail: `Gia nhập ${formatDate(user.createdAt)}`,
        time: formatRelativeTime(user.createdAt),
        icon: Sparkles,
        tone: 'text-primary',
      });
    }

    if (!items.length) {
      items.push({
        label: 'Chưa có hoạt động',
        detail: 'Hãy gửi báo cáo đầu tiên để bắt đầu hành trình bảo vệ.',
        time: '—',
        icon: MessageSquareText,
        tone: 'text-text-muted',
      });
    }

    return items.slice(0, 4);
  }, [pendingReports, recentReports, reports?.lastReportAt, user?.createdAt, user?.lastLoginAt]);

  const watchlist = useMemo(() => {
    if (!recentReports.length) return [];
    return recentReports.map((report) => ({
      name: report.target,
      status: statusLabelMap[report.status] || 'Đang theo dõi',
      updated: formatRelativeTime(report.createdAt),
      variant: statusVariantMap[report.status] || 'default',
      type: typeLabelMap[report.type] || report.type,
    }));
  }, [recentReports]);

  const notificationPrefs = useMemo(() => {
    const emailEnabled = settings?.emailNotifications ?? true;
    const analyticsEnabled = settings?.analyticsEnabled ?? true;
    const maintenanceMode = settings?.maintenanceMode ?? false;

    return [
      {
        label: 'Email cảnh báo',
        detail: emailEnabled ? 'Bật theo hệ thống' : 'Đang tắt',
        status: emailEnabled ? 'Bật' : 'Tắt',
        icon: Mail,
        variant: emailEnabled ? 'success' : 'default',
      },
      {
        label: 'Phân tích & gợi ý',
        detail: analyticsEnabled ? 'Đang bật' : 'Đang tắt',
        status: analyticsEnabled ? 'Bật' : 'Tắt',
        icon: Sparkles,
        variant: analyticsEnabled ? 'primary' : 'default',
      },
      {
        label: 'Trạng thái hệ thống',
        detail: maintenanceMode ? 'Đang bảo trì' : 'Ổn định',
        status: maintenanceMode ? 'Bảo trì' : 'Ổn định',
        icon: ShieldCheck,
        variant: maintenanceMode ? 'warning' : 'success',
      },
    ];
  }, [settings?.analyticsEnabled, settings?.emailNotifications, settings?.maintenanceMode]);

  const protectionSignals = useMemo(() => {
    const signals = [
      { label: 'Email liên kết', ok: Boolean(displayEmail && displayEmail !== '—') },
      { label: 'Đăng nhập gần đây', ok: Boolean(user?.lastLoginAt) },
      { label: 'Đã gửi báo cáo', ok: totalReports > 0 },
      { label: 'Liên kết OAuth', ok: (user?.linkedAccounts || 0) > 0 },
      { label: 'Mật khẩu thiết lập', ok: Boolean(user?.hasPassword) },
    ];

    const okCount = signals.filter((signal) => signal.ok).length;
    const score = clamp(58 + okCount * 8, 40, 100);

    return { signals, score };
  }, [displayEmail, totalReports, user?.hasPassword, user?.lastLoginAt, user?.linkedAccounts]);

  const isLoading = loading || (status === 'authenticated' && !profileData && !error);

  return (
    <div className="min-h-screen flex flex-col bg-bg-main">
      <Navbar />

      <main className="flex-1 pt-20 pb-20 md:pb-8">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 space-y-8">
          {status === 'unauthenticated' && (
            <Card className="max-w-2xl mx-auto">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-text-main">Bạn chưa đăng nhập</h1>
                    <p className="text-sm text-text-secondary">
                      Đăng nhập để xem lịch sử báo cáo, theo dõi cảnh báo và quản lý thông tin tài khoản.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href="/login" className="inline-flex">
                    <Button size="sm">Đăng nhập</Button>
                  </Link>
                  <Link href="/register" className="inline-flex">
                    <Button size="sm" variant="secondary">Tạo tài khoản</Button>
                  </Link>
                  <Link href="/" className="inline-flex">
                    <Button size="sm" variant="ghost">Về trang chủ</Button>
                  </Link>
                </div>
              </div>
            </Card>
          )}

          {status === 'authenticated' && error && (
            <Card className="max-w-3xl mx-auto">
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold text-text-main">Không thể tải hồ sơ</h2>
                <p className="text-sm text-text-secondary">{error}</p>
                <div className="flex flex-wrap gap-3">
                  <Button size="sm" onClick={() => setReloadKey((prev) => prev + 1)}>
                    Thử lại
                  </Button>
                  <Link href="/" className="inline-flex">
                    <Button size="sm" variant="secondary">Về trang chủ</Button>
                  </Link>
                </div>
              </div>
            </Card>
          )}

          {status === 'authenticated' && !error && (
            <>
              <section className="grid gap-6 lg:grid-cols-[2.1fr_1fr]">
                <Card className="relative overflow-hidden">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.12),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.14),transparent_45%)]" />
                  <div className="relative flex flex-col gap-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner overflow-hidden">
                          {displayImage ? (
                            <SafeImage
                              src={displayImage}
                              fallbackSrc="/favicon.ico"
                              alt={displayName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <User className="h-6 w-6" />
                          )}
                        </div>
                        <div className="space-y-1">
                          {isLoading ? (
                            <Skeleton variant="text" width={180} />
                          ) : (
                            <h1 className="text-2xl font-bold text-text-main">Hệ thống người dùng</h1>
                          )}
                          <p className="text-sm text-text-secondary">
                            Tài khoản: <span className="font-semibold text-text-main">{displayName}</span>
                          </p>
                          <p className="text-xs text-text-muted">ID: {user?.id || '—'} • Tham gia từ {formatDate(user?.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={user?.role === 'admin' ? 'warning' : 'success'}>{roleLabel}</Badge>
                        <Badge variant="primary">{providerLabel}</Badge>
                        <Badge variant="default">Tình trạng: {user?.lastLoginAt ? 'Hoạt động' : 'Mới'}</Badge>
                        <Button size="sm" variant="ghost" onClick={() => signOut({ callbackUrl: '/' })}>
                          Đăng xuất
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {profileInfo.map((info) => (
                        <div key={info.label} className="flex items-center gap-3 rounded-2xl border border-bg-border bg-bg-cardHover/60 px-3 py-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
                            <info.icon className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.16em] text-text-muted">{info.label}</p>
                            <p className="text-sm font-semibold text-text-main">
                              {isLoading ? <Skeleton variant="text" width={120} /> : info.value}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {stats.map((item) => (
                        <div
                          key={item.label}
                          className="rounded-2xl border border-bg-border bg-white/90 px-4 py-3 shadow-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10', item.accent)}>
                              <item.icon className="h-4 w-4" />
                            </span>
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.16em] text-text-muted">{item.label}</p>
                              <p className={cn('text-lg font-bold', item.accent)}>
                                {isLoading ? '—' : item.value}
                              </p>
                            </div>
                          </div>
                          <p className="mt-2 text-xs text-text-muted">{isLoading ? 'Đang tải...' : item.helper}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link href="/report" className="inline-flex">
                        <Button size="sm" leftIcon={<FileText className="h-4 w-4" />}>Báo cáo mới</Button>
                      </Link>
                      <Link href="/report-lua-dao" className="inline-flex">
                        <Button size="sm" variant="secondary" leftIcon={<ShieldCheck className="h-4 w-4" />}>Theo dõi cảnh báo</Button>
                      </Link>
                      <Link href="/help" className="inline-flex">
                        <Button size="sm" variant="secondary" leftIcon={<MessageSquareText className="h-4 w-4" />}>Trung tâm hỗ trợ</Button>
                      </Link>
                    </div>
                  </div>
                </Card>

                <Card className="flex flex-col gap-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Gợi ý nhanh</p>
                      <h2 className="text-lg font-semibold text-text-main">Tối ưu bảo mật</h2>
                    </div>
                    <Badge variant="primary">Hôm nay</Badge>
                  </div>

                  <div className="space-y-3">
                    {securityItems.map((item) => (
                      <div key={item.label} className="flex items-start gap-3 rounded-2xl border border-bg-border bg-bg-cardHover/60 px-3 py-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
                          <item.icon className="h-4 w-4" />
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-text-main">{item.label}</p>
                          <p className="text-xs text-text-muted">{item.detail}</p>
                        </div>
                        <Badge variant={item.variant as any}>{item.status}</Badge>
                      </div>
                    ))}
                  </div>

                  <Link href="/admin/settings/security" className="inline-flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/15">
                    Mở bảng điều khiển bảo mật
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Card>
              </section>

              <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                <Card className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Hoạt động</p>
                      <h2 className="text-lg font-semibold text-text-main">Dòng thời gian gần đây</h2>
                    </div>
                    <Button size="sm" variant="secondary">Xem toàn bộ</Button>
                  </div>
                  <div className="space-y-3">
                    {recentActivities.map((activity, index) => (
                      <div key={`${activity.detail}-${index}`} className="flex items-start gap-3 rounded-2xl border border-bg-border bg-bg-cardHover/40 px-3 py-3">
                        <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm', activity.tone)}>
                          <activity.icon className="h-4 w-4" />
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-text-main">{activity.label}</p>
                          <p className="text-xs text-text-muted">{activity.detail}</p>
                        </div>
                        <span className="text-xs text-text-muted">{activity.time}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Báo cáo</p>
                      <h2 className="text-lg font-semibold text-text-main">Báo cáo gần đây</h2>
                    </div>
                    <Button size="sm" variant="secondary">Quản lý</Button>
                  </div>

                  <div className="space-y-3">
                    {watchlist.length ? (
                      watchlist.map((item) => (
                        <div key={item.name} className="flex items-center justify-between gap-3 rounded-2xl border border-bg-border bg-bg-cardHover/40 px-3 py-3">
                          <div>
                            <p className="text-sm font-semibold text-text-main">{item.name}</p>
                            <p className="text-xs text-text-muted">{item.type} • {item.updated}</p>
                          </div>
                          <Badge variant={item.variant as any}>{item.status}</Badge>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-bg-border bg-bg-cardHover/40 px-3 py-6 text-center text-sm text-text-muted">
                        Chưa có báo cáo nào được ghi nhận.
                      </div>
                    )}
                  </div>

                  <Link href="/report-lua-dao" className="inline-flex items-center justify-between rounded-2xl border border-bg-border px-4 py-3 text-sm font-semibold text-text-main hover:border-primary/40 hover:text-primary">
                    Thêm mới cảnh báo
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Card>
              </section>

              <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
                <Card className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Thông báo</p>
                      <h2 className="text-lg font-semibold text-text-main">Kênh nhận tin</h2>
                    </div>
                    <Badge variant="primary">Theo hệ thống</Badge>
                  </div>
                  <div className="space-y-3">
                    {notificationPrefs.map((item) => (
                      <div key={item.label} className="flex items-center justify-between gap-3 rounded-2xl border border-bg-border bg-bg-cardHover/40 px-3 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
                            <item.icon className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-text-main">{item.label}</p>
                            <p className="text-xs text-text-muted">{item.detail}</p>
                          </div>
                        </div>
                        <Badge variant={item.variant as any}>{item.status}</Badge>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Mức độ an toàn</p>
                      <h2 className="text-lg font-semibold text-text-main">Điểm bảo vệ cá nhân</h2>
                    </div>
                    <Badge variant="success">{protectionSignals.score >= 80 ? 'Tốt' : protectionSignals.score >= 65 ? 'Khá' : 'Cần cải thiện'}</Badge>
                  </div>
                  <div className="rounded-2xl border border-bg-border bg-bg-cardHover/50 px-4 py-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-text-main">Sức khỏe tài khoản</p>
                      <span className="text-sm font-bold text-success">{protectionSignals.score}/100</span>
                    </div>
                    <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-bg-card">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-success to-primary"
                        style={{ width: `${protectionSignals.score}%` }}
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-text-muted">
                      {protectionSignals.signals.map((signal) => (
                        <span
                          key={signal.label}
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full border px-2 py-1',
                            signal.ok ? 'border-success/30 bg-success/10 text-success' : 'border-warning/30 bg-warning/10 text-warning'
                          )}
                        >
                          {signal.ok ? <CheckCircle2 className="h-3 w-3" /> : <ShieldOff className="h-3 w-3" />}
                          {signal.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link href="/admin/settings/security" className="inline-flex">
                      <Button size="sm" variant="secondary" leftIcon={<ShieldCheck className="h-4 w-4" />}>
                        Kiểm tra bảo mật
                      </Button>
                    </Link>
                    <Link href="/help" className="inline-flex">
                      <Button size="sm" variant="ghost" leftIcon={<MessageSquareText className="h-4 w-4" />}>
                        Trung tâm hỗ trợ
                      </Button>
                    </Link>
                  </div>
                </Card>
              </section>
            </>
          )}

          {status === 'authenticated' && isLoading && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <Skeleton variant="rectangular" height={120} />
              </Card>
              <Card>
                <Skeleton variant="rectangular" height={120} />
              </Card>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType, SVGProps } from 'react';
import Link from 'next/link';
import { useSession, signOut, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { Footer, MobileNav } from '@/components/layout';
import { Button, Card, Skeleton, Modal, Input, Badge } from '@/components/ui';
import type { NotificationPrefs } from '@/components/dashboard/NotificationSettings';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { UserReportsTable } from '@/components/dashboard/UserReportsTable';
import { WatchlistCard } from '@/components/dashboard/WatchlistCard';
import type { ActivityItem } from '@/components/dashboard/RecentActivity';
import type { UserReportRow } from '@/components/dashboard/UserReportsTable';
import type { WatchItem } from '@/components/dashboard/WatchlistCard';
import type { SecurityCheck } from '@/components/dashboard/SecurityStatusCard';
import type { TrustMetric } from '@/components/dashboard/TrustScoreCard';
import {
  FileText,
  Sparkles,
  Copy,
  Chrome,
  Facebook,
  Twitter,
  Send,
  Home,
  ShieldCheck,
  UserCircle,
  Plus,
  ZoomIn,
  Bike,
  Search,
  SlidersHorizontal,
  Briefcase,
  Building,
  Clock3,
  Globe,
  Bookmark,
  AlertTriangle,
  XCircle,
  CheckCircle,
  LogOut,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';

interface ProfileUser {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  avatar?: string | null;
  securityScore?: number;
}

type SummaryCounts = {
  reports: number;
  watchlist: number;
  alerts: number;
};

interface SecurityStatus {
  passwordSet: boolean;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  oauthConnected: boolean;
  oauthProvider?: string | null;
  recentLogin: string | null;
  securityScore?: number;
  summary?: {
    reportsCount: number;
    watchlistCount: number;
    alertCount: number;
  };
}

interface ApiState {
  user?: ProfileUser;
  security?: SecurityStatus;
  activity: ActivityItem[];
  reports: UserReportRow[];
  watchlist: WatchItem[];
  notifications: NotificationPrefs;
  summary: SummaryCounts;
}

const defaultPrefs: NotificationPrefs = { emailAlerts: true, pushAlerts: false, weeklySummary: true };
const defaultSummary: SummaryCounts = { reports: 0, watchlist: 0, alerts: 0 };
type TwofaInfo = { enabled: boolean; secret?: string; otpauthUrl?: string; backupCodes?: string[] };

type BottomNavKey = 'trangchu' | 'baocao' | 'antoan' | 'hoso';

type BottomNavItem = {
  key: BottomNavKey;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  action: () => void;
};

type QuickAction = {
  label: string;
  subLabel: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  accent: string;
};

type DeviceCard = {
  key: string;
  title: string;
  subtitle: string;
  status: string;
  active: boolean;
  accent: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  metadata: string[];
};

type FeatureCategory = {
  key: string;
  label: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  accent: string;
  action: () => void;
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showToast } = useToast();
  const securitySectionRef = useRef<HTMLDivElement | null>(null);
  const watchlistSectionRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [state, setState] = useState<ApiState>({
    activity: [],
    reports: [],
    watchlist: [],
    notifications: defaultPrefs,
    summary: defaultSummary,
  });
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
  const [emailCooldown, setEmailCooldown] = useState(0);
  const [bottomAction, setBottomAction] = useState<BottomNavKey>('trangchu');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', avatar: '' });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [watchTargetInput, setWatchTargetInput] = useState('');
  const [watchTypeInput, setWatchTypeInput] = useState<'website' | 'phone' | 'bank' | 'crypto'>('website');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [modalSearchResults, setModalSearchResults] = useState<any[]>([]);
  const [modalIsSearching, setModalIsSearching] = useState(false);
  const [modalSearched, setModalSearched] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [deviceStates, setDeviceStates] = useState<Record<string, boolean>>({
    myhome: true,
    bicycle: false,
  });

  // Show loading while checking session
  // Note: Must check loading status after all hooks are called
  const isLoading = status === 'loading';

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Show loading spinner while session is being checked
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  const SEARCH_CATEGORIES = ['organizations', 'websites', 'devices', 'systems', 'apps'];
  
  const handleModalSearch = async (query: string) => {
    if (!query || query.trim().length < 2) {
      setModalSearchResults([]);
      setModalSearched(false);
      return;
    }
    
    setModalIsSearching(true);
    setModalSearched(true);
    
    try {
      const settled = await Promise.allSettled(
        SEARCH_CATEGORIES.map(async (categoryKey) => {
          const response = await fetch('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category: categoryKey, page: 1, query: query.trim(), perPage: 20 }),
          });
          return response.ok ? response.json() : null;
        })
      );
      
      const allResults: any[] = [];
      const seenIds = new Set<string>();
      settled.forEach((entry) => {
        if (entry.status === 'fulfilled' && entry.value?.items) {
          entry.value.items.forEach((item: any) => {
            if (item.id && !seenIds.has(item.id)) {
              seenIds.add(item.id);
              allResults.push({ ...item, category: entry.value.category, mode: entry.value.mode });
            } else if (!item.id) {
              allResults.push({ ...item, category: entry.value.category, mode: entry.value.mode });
            }
          });
        }
      });
      
      setModalSearchResults(allResults.slice(0, 20));
    } catch (error) {
      console.error('Search error:', error);
      setModalSearchResults([]);
    } finally {
      setModalIsSearching(false);
    }
  };

  useEffect(() => {
    if (!editModalOpen) return;
    setEditForm({
      name: state.user?.name || '',
      avatar: state.user?.avatar || '',
    });
    setAvatarPreview(state.user?.avatar || '');
    setAvatarFile(null);
  }, [editModalOpen, state.user?.avatar, state.user?.name]);

  const loadPrimary = async () => {
    const [profileRes, securityRes] = await Promise.all([
      fetch('/api/user/profile', { cache: 'no-store' }),
      fetch('/api/user/security-status', { cache: 'no-store' }),
    ]);
    const [profile, securityPayload] = await Promise.all([profileRes.json(), securityRes.json()]);
    if (!profileRes.ok) throw new Error(profile.error || 'Tải hồ sơ thất bại');
    if (!securityRes.ok) throw new Error(securityPayload.error || 'Tải bảo mật thất bại');
    const securityData = securityPayload.security;
    const summaryPayload = securityData?.summary;
    const summaryData = {
      reports: summaryPayload?.reportsCount ?? 0,
      watchlist: summaryPayload?.watchlistCount ?? 0,
      alerts: summaryPayload?.alertCount ?? summaryPayload?.watchlistCount ?? 0,
    };
    setState((prev) => ({
      ...prev,
      user: profile.user,
      security: securityData,
      summary: summaryData,
    }));
  };

  const loadSecondary = async () => {
    const [activityRes, reportsRes, watchlistRes, notifRes] = await Promise.all([
      fetch('/api/user/activity', { cache: 'no-store' }),
      fetch('/api/user/reports', { cache: 'no-store' }),
      fetch('/api/user/watchlist', { cache: 'no-store' }),
      fetch('/api/user/notifications', { cache: 'no-store' }),
    ]);
    const [activity, reports, watchlist, notifications] = await Promise.all([
      activityRes.json(),
      reportsRes.json(),
      watchlistRes.json(),
      notifRes.json(),
    ]);
    if (!activityRes.ok) throw new Error(activity.error || 'Tải hoạt động thất bại');
    if (!reportsRes.ok) throw new Error(reports.error || 'Tải báo cáo thất bại');
    if (!watchlistRes.ok) throw new Error(watchlist.error || 'Tải watchlist thất bại');
    if (!notifRes.ok) throw new Error(notifications.error || 'Tải thông báo thất bại');
    setState((prev) => ({
      ...prev,
      activity: activity.items || [],
      reports: reports.items || [],
      watchlist: watchlist.items || [],
      notifications: notifications.settings || defaultPrefs,
    }));
  };

  useEffect(() => {
    if (status !== 'authenticated') return;
    setLoading(true);
    setError('');
    loadPrimary()
      .then(() => {
        setLoading(false);
        loadSecondary().catch((err: any) => {
          showToast('error', err?.message || 'Không thể tải dữ liệu phụ');
        });
      })
      .catch((err: any) => {
        setLoading(false);
        setError(err?.message || 'Không thể tải dữ liệu');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, reloadKey]);

  const user = state.user;
  const security = state.security;
  const oauthLabelMap: Record<string, string> = {
    google: 'Google',
    facebook: 'Facebook',
    twitter: 'X (Twitter)',
    telegram: 'Telegram',
  };
  const linkedOauthProviderKey = (security?.oauthProvider || '').toLowerCase();
  const linkedOauthLabel = oauthLabelMap[linkedOauthProviderKey] || 'OAuth';
  const selectedOauthLabel = oauthLabelMap[oauthProvider] || 'OAuth';
  const selectedOauthIcon =
    oauthProvider === 'facebook'
      ? <Facebook className="h-4 w-4" />
      : oauthProvider === 'twitter'
        ? <Twitter className="h-4 w-4" />
        : oauthProvider === 'telegram'
          ? <Send className="h-4 w-4" />
          : <Chrome className="h-4 w-4" />;

  useEffect(() => {
    if (!oauthModalOpen) return;
    const key = (security?.oauthProvider || '').toLowerCase();
    if (key === 'google' || key === 'facebook' || key === 'twitter' || key === 'telegram') {
      setOauthProvider(key);
    }
  }, [oauthModalOpen, security?.oauthProvider]);

  const stats = useMemo(() => {
    const summary = state.summary || defaultSummary;
    const reportCount = summary.reports ?? state.reports.length;
    const alertsCount = summary.alerts ?? summary.watchlist ?? state.watchlist.length;
    return {
      reportsSubmitted: reportCount,
      reportsResolved: state.reports.filter((r) => r.status === 'completed').length,
      activeAlerts: alertsCount,
      trustScore: security?.securityScore ?? user?.securityScore ?? 72,
    };
  }, [state.reports, state.watchlist.length, state.summary, security?.securityScore, user?.securityScore]);

  const deviceCards: DeviceCard[] = [
    {
      key: 'myhome',
      title: 'My Home',
      subtitle: '32 thiết bị đang hoạt động',
      status: 'ON',
      active: deviceStates.myhome,
      accent: 'from-cyan-500/80 to-sky-400/70',
      icon: Home,
      metadata: ['32 Active devices'],
    },
    {
      key: 'bicycle',
      title: 'Bicycleev',
      subtitle: '36% pin • 25km',
      status: 'OFF',
      active: deviceStates.bicycle,
      accent: 'from-orange-400/80 to-amber-300/70',
      icon: Bike,
      metadata: ['36% battery', '25km range'],
    },
  ];

  const quickActions: QuickAction[] = [
    { label: 'Security', subLabel: 'Kiểm tra bảo mật', icon: ShieldCheck, accent: 'from-sky-400/80 to-sky-200/60' },
    { label: 'Báo cáo', subLabel: 'Gửi scam nhanh', icon: FileText, accent: 'from-amber-400/80 to-orange-200/60' },
    { label: '2FA', subLabel: 'Bảo vệ 2 lớp', icon: Sparkles, accent: 'from-emerald-400/80 to-lime-200/60' },
    { label: 'Watchlist', subLabel: 'Theo dõi cảnh báo', icon: ZoomIn, accent: 'from-blue-400/80 to-cyan-200/60' },
  ];

  const checks: { key: string; label: string; detail: string; actionLabel: string; onAction: () => void; disabled?: boolean }[] = [
    {
      key: 'password',
      label: 'Mật khẩu',
      detail: security?.passwordSet ? 'Đã thiết lập' : 'Chưa thiết lập',
      actionLabel: security?.passwordSet ? 'Đổi mật khẩu' : 'Thiết lập',
      onAction: () => setPasswordModalOpen(true),
      disabled: actionLoading === 'password',
    },
    {
      key: 'twofa',
      label: 'Xác thực 2 lớp',
      detail: security?.twoFactorEnabled ? 'Đã bật' : 'Chưa bật',
      actionLabel: security?.twoFactorEnabled ? 'Quản lý' : 'Bật 2FA',
      onAction: () => setTwofaModalOpen(true),
      disabled: actionLoading === 'twofaSetup' || actionLoading === 'twofaConfirm' || actionLoading === 'twofaDisable',
    },
    {
      key: 'oauth',
      label: 'Liên kết OAuth',
      detail: security?.oauthConnected ? `Đã liên kết ${linkedOauthLabel}` : 'Chưa liên kết',
      actionLabel: 'Quản lý',
      onAction: () => setOauthModalOpen(true),
    },
    {
      key: 'email',
      label: 'Email xác minh',
      detail: security?.emailVerified ? 'Đã xác minh' : 'Chưa xác minh',
      actionLabel: 'Xác minh',
      onAction: () => setEmailModalOpen(true),
      disabled: security?.emailVerified,
    },
  ];

  const metricHighlights = [
    { label: 'Cảnh báo', value: stats.activeAlerts, icon: 'fi fi-rr-bell', gradient: 'from-white to-[#eef8ff]' },
    { label: 'Điểm tin cậy', value: `${stats.trustScore}%`, icon: 'fi fi-rr-shield-check', gradient: 'from-white to-[#f0fff5]' },
    { label: 'Điểm bảo mật', value: security?.securityScore ?? stats.trustScore, icon: 'fi fi-rr-badge-check', gradient: 'from-white to-[#f8fbff]' },
    { label: 'Danh sách theo dõi', value: state.watchlist.length, icon: 'fi fi-rr-eye', gradient: 'from-white to-[#fdf6ff]' },
  ];

  const handleScrollToSecurity = () => {
    securitySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleScrollToTop = () => {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const bottomNavItems: BottomNavItem[] = [
    { key: 'trangchu', label: 'Trang chủ', icon: Home, action: handleScrollToTop },
    { key: 'baocao', label: 'Báo cáo', icon: FileText, action: () => handleCreateReport() },
    { key: 'antoan', label: 'Bảo mật', icon: ShieldCheck, action: handleScrollToSecurity },
    { key: 'hoso', label: 'Hồ sơ', icon: UserCircle, action: () => setEditModalOpen(true) },
  ];

  const quickActionNavMap: Record<string, BottomNavKey> = {
    Security: 'antoan',
    'Báo cáo': 'baocao',
    '2FA': 'antoan',
    Watchlist: 'trangchu',
  };

  const notificationItems: { key: keyof NotificationPrefs; label: string; desc: string }[] = [
    { key: 'emailAlerts', label: 'Email alerts', desc: 'Nhận cảnh báo qua email' },
    { key: 'pushAlerts', label: 'Push notifications', desc: 'Bật thông báo trình duyệt' },
    { key: 'weeklySummary', label: 'Weekly summary', desc: 'Tổng hợp báo cáo hàng tuần' },
  ];

  const handleCreateReport = async () => {
    showToast('warning', 'Chức năng gửi báo cáo đang được tối ưu hóa.');
  };

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      showToast('error', 'Đăng xuất thất bại');
    }
  };

  const featureCategories: FeatureCategory[] = [
    {
      key: 'reports',
      label: 'Báo cáo',
      description: `${state.reports.length} báo cáo`,
      icon: FileText,
      accent: 'from-sky-400/70 to-cyan-400/70',
      action: () => {
        setBottomAction('baocao');
        handleCreateReport();
      },
    },
    {
      key: 'watchlist',
      label: 'Theo dõi',
      description: `${state.watchlist.length} mục`,
      icon: ZoomIn,
      accent: 'from-emerald-500/70 to-lime-400/70',
      action: () => {
        setBottomAction('trangchu');
        watchlistSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      },
    },
    {
      key: 'alerts',
      label: 'Cảnh báo',
      description: `${stats.activeAlerts} mới`,
      icon: Sparkles,
      accent: 'from-amber-400/70 to-orange-400/70',
      action: () => {
        setBottomAction('antoan');
        handleScrollToSecurity();
      },
    },
    {
      key: 'security',
      label: 'Bảo mật',
      description: `${security?.securityScore ?? stats.trustScore}% điểm`,
      icon: ShieldCheck,
      accent: 'from-indigo-500/70 to-sky-400/70',
      action: () => {
        setBottomAction('antoan');
        handleScrollToSecurity();
      },
    },
  ];

  const filteredReports = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    const sorted = [...state.reports].sort((a, b) => {
      const aDate = new Date(a.createdAt).getTime();
      const bDate = new Date(b.createdAt).getTime();
      return bDate - aDate;
    });
    if (!normalized) return sorted.slice(0, 5);
    return sorted
      .filter(
        (report) =>
          report.target.toLowerCase().includes(normalized) ||
          report.type.toLowerCase().includes(normalized) ||
          report.status.toLowerCase().includes(normalized)
      )
      .slice(0, 5);
  }, [searchTerm, state.reports]);

  const handleDeleteReport = async (id: string) => {
    setState((s) => ({ ...s, reports: s.reports.filter((report) => report.id !== id) }));
    showToast('success', 'Đã xóa báo cáo.');
  };

  const handleAddWatch = (target: string, type: string) => {
    const newItem: WatchItem = {
      id: crypto.randomUUID?.() ?? `${Date.now()}`,
      target,
      type,
      createdAt: new Date().toISOString(),
    };
    setState((s) => ({ ...s, watchlist: [newItem, ...s.watchlist] }));
    showToast('success', 'Đã thêm mục theo dõi.');
  };

  const handleRemoveWatch = (id: string) => {
    setState((s) => ({ ...s, watchlist: s.watchlist.filter((item) => item.id !== id) }));
    showToast('success', 'Đã gỡ mục theo dõi.');
  };

  const handleNotifications = (prefs: NotificationPrefs) => {
    setState((s) => ({ ...s, notifications: prefs }));
    showToast('success', 'Cập nhật cài đặt thông báo.');
  };

  const handleUpdateProfile = async () => {
    const name = editForm.name.trim();
    const avatar = editForm.avatar.trim();

    if (!name) {
      showToast('error', 'Tên không được để trống');
      return;
    }

    try {
      setActionLoading('profile');
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, avatar: avatar || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể cập nhật hồ sơ');
      showToast('success', 'Đã cập nhật hồ sơ');
      setState((s) => ({ ...s, user: data.user }));
      setEditModalOpen(false);
    } catch (err: any) {
      showToast('error', err?.message || 'Không thể cập nhật hồ sơ');
    } finally {
      setActionLoading(null);
    }
  };
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

  const handleStartTwofaSetup = async () => {
    try {
      setActionLoading('twofaSetup');
      const res = await fetch('/api/user/security/twofa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: twofaPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể khởi tạo 2FA');
      setTwofaInfo((prev) => ({ ...prev, secret: data.secret, otpauthUrl: data.otpauthUrl, backupCodes: data.backupCodes, enabled: false }));
      setTwofaStep('verify');
      showToast('success', 'Đã tạo mã QR. Quét và nhập mã xác thực.');
    } catch (err: any) {
      showToast('error', err?.message || 'Không tạo được 2FA');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmTwofa = async () => {
    try {
      setActionLoading('twofaConfirm');
      const res = await fetch('/api/user/security/twofa/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: twofaCode, password: twofaPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không xác thực được 2FA');
      showToast('success', 'Đã bật 2FA.');
      setTwofaStep('enabled');
      setReloadKey((k) => k + 1);
    } catch (err: any) {
      showToast('error', err?.message || 'Không xác thực được 2FA');
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
      showToast('success', 'Đã tắt 2FA.');
      setTwofaStep('overview');
      setReloadKey((k) => k + 1);
    } catch (err: any) {
      showToast('error', err?.message || 'Không tắt được 2FA');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendEmailCode = async () => {
    try {
      setSendingCode(true);
      const res = await fetch('/api/user/security/email/send', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        if (data.retryAfter) {
          setEmailCooldown(data.retryAfter);
        }
        throw new Error(data.error || 'Không gửi được mã');
      }
      showToast('success', data.message || 'Đã gửi mã xác minh');
      setEmailCooldown(60);
    } catch (err: any) {
      showToast('error', err?.message || 'Không gửi được mã');
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyEmailCode = async () => {
    try {
      setVerifyingCode(true);
      const res = await fetch('/api/user/security/email/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: emailCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không xác minh được');
      showToast('success', 'Xác minh email thành công');
      setEmailModalOpen(false);
      setReloadKey((k) => k + 1);
    } catch (err: any) {
      showToast('error', err?.message || 'Không xác minh được');
    } finally {
      setVerifyingCode(false);
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
      if (!res.ok) throw new Error(data.error || 'Không thể cập nhật OAuth');
      showToast('success', connect ? 'Đã liên kết OAuth' : 'Đã hủy liên kết OAuth');
      setOauthModalOpen(false);
      setReloadKey((k) => k + 1);
    } catch (err: any) {
      showToast('error', err?.message || 'Không thể cập nhật OAuth');
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

  useEffect(() => {
    if (emailCooldown <= 0) return;
    const id = window.setInterval(() => {
      setEmailCooldown((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [emailCooldown]);

  return (
    <div className="min-h-screen bg-[#dff5ef]">
      <main className="flex justify-center pb-[calc(7.5rem+env(safe-area-inset-bottom))]">
        <div className="w-full max-w-[420px] space-y-4 px-4 pt-8 pb-10">
          <div className="rounded-[36px] bg-gradient-to-r from-emerald-500/90 to-cyan-500 p-5 text-white shadow-[0_45px_90px_rgba(16,185,129,0.45)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.4em] text-white/70">Profile</p>
                <h1 className="text-2xl font-semibold">ScamGuard</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" className="rounded-full bg-white/20 px-3 text-white shadow-lg">☀️</Button>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-600">9+</span>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-sm font-semibold">Hi, {user?.name?.split(' ')?.[0] ?? 'Bạn'}</p>
                  <p className="text-[12px] text-white/80">Bạn đang được bảo vệ</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/30"
                  title="Đăng xuất"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Đăng xuất</span>
                </button>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-[0.4em] text-white/70">Nhiệt độ</p>
                <p className="text-lg font-semibold">26°C</p>
                <p className="text-[11px] text-white/70">Austin</p>
              </div>
            </div>
          </div>

          <section className="rounded-[32px] bg-white px-4 py-4 shadow-[0_15px_45px_rgba(15,23,42,0.08)]">
            <div className="flex items-center gap-3 rounded-[24px] border border-slate-200 bg-[#f8faff] px-4 py-2 shadow-inner">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Bạn muốn kiểm tra tên miền hoặc báo cáo nào?"
                className="flex-1 border-0 bg-transparent text-sm font-semibold text-slate-600 outline-none placeholder:text-slate-400"
              />
              <button onClick={() => setSearchModalOpen(true)} className="rounded-full bg-blue-500 p-1.5 text-white hover:bg-blue-600">
                <Search className="h-3 w-3" />
              </button>
              <SlidersHorizontal className="h-4 w-4 text-blue-500" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">
              <div className="flex flex-col items-center justify-center gap-1 whitespace-nowrap">
                <p className="text-xl font-bold text-slate-900">{stats.reportsSubmitted}</p>
                <span className="text-[10px] tracking-[0.35em] text-slate-400">BÁO CÁO</span>
              </div>
              <div className="flex flex-col items-center justify-center gap-1 whitespace-nowrap">
                <p className="text-xl font-bold text-slate-900">{stats.activeAlerts}</p>
                <span className="text-[10px] tracking-[0.35em] text-slate-400">CẢNH BÁO</span>
              </div>
              <div className="flex flex-col items-center justify-center gap-1 whitespace-nowrap">
                <p className="text-xl font-bold text-slate-900">{Math.round(stats.trustScore)}</p>
                <span className="text-[10px] tracking-[0.35em] text-slate-400">TRUST SCORE</span>
              </div>
            </div>
          </section>

          <section className="rounded-[32px] bg-gradient-to-r from-emerald-500 to-cyan-500 p-5 text-white shadow-[0_20px_45px_rgba(16,185,129,0.35)]">
            <p className="text-[12px] uppercase tracking-[0.5em] text-white/80">Stay protected</p>
            <h2 className="mt-2 text-2xl font-semibold">Cập nhật tình trạng an toàn của bạn</h2>
            <p className="mt-2 text-sm text-white/80">
              {state.watchlist.length} mục theo dõi, {state.reports.length} báo cáo và {stats.activeAlerts} cảnh báo đang được quét mỗi ngày.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                size="sm"
                className="flex items-center gap-2 whitespace-nowrap rounded-[22px] bg-white px-5 py-2 text-sm font-semibold text-emerald-600 shadow-lg transition hover:-translate-y-0.5"
                onClick={handleCreateReport}
              >
                <FileText className="h-4 w-4 text-emerald-600" />
                Gửi báo cáo mới
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="flex flex-row items-center justify-center gap-2 whitespace-nowrap rounded-[22px] border border-white/70 bg-white/20 px-6 py-2 text-xs font-semibold text-white shadow-[0_10px_30px_rgba(255,255,255,0.3)] transition hover:bg-white/40"
                onClick={handleScrollToSecurity}
              >
                <ShieldCheck className="h-4 w-4 text-white" />
                <span className="leading-none">Xem kết quả bảo mật</span>
              </Button>
            </div>
          </section>

          <section className="rounded-[34px] bg-white px-4 py-4 shadow-[0_25px_60px_rgba(0,0,0,0.08)]">
            <h3 className="mb-3 text-lg font-semibold text-slate-700">Browse By Category</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {featureCategories.map((category) => (
                <button
                  key={category.key}
                  type="button"
                  onClick={category.action}
                  className="group flex flex-col items-center justify-center gap-2 rounded-[18px] border border-slate-200 bg-white p-3 text-center shadow-[0_12px_25px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_15px_35px_rgba(15,23,42,0.15)]"
                >
                  <span className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${category.accent} text-white shadow-lg`}>
                    <category.icon className="h-6 w-6" />
                  </span>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{category.label}</p>
                  <p className="text-[11px] font-semibold text-slate-400">{category.description}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[32px] bg-white px-4 py-4 shadow-[0_20px_45px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-700">Báo cáo nổi bật</h3>
              <Button size="sm" variant="ghost" className="text-xs font-semibold text-slate-500">
                Xem tất cả
              </Button>
            </div>
            <div className="mt-4 space-y-3">
              {filteredReports.length === 0 && (
                <div className="rounded-[26px] border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  Chưa có báo cáo phù hợp với từ khoá.
                </div>
              )}
              {filteredReports.map((report) => {
                const statusVariant = report.status === 'completed' ? 'success' : report.status === 'pending' ? 'warning' : 'primary';
                const createdDate = new Date(report.createdAt).toLocaleDateString('vi-VN');
                return (
                  <div key={report.id} className="flex items-center justify-between gap-4 rounded-[26px] border border-slate-200 bg-gradient-to-br from-white to-[#f6fbff] px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 break-all">{report.target}</p>
                      <p className="text-xs text-slate-500">
                        {report.type} • {createdDate}
                      </p>
                      <p className="text-[11px] text-slate-500">Rủi ro: {report.riskScore}</p>
                    </div>
                    <Badge variant={statusVariant}>{report.status}</Badge>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-[34px] bg-white px-5 py-5 shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-emerald-500 bg-slate-50">
                <img src={user?.avatar || '/favicon.ico'} alt={user?.name} className="h-full w-full object-cover" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-lg font-semibold text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-400">{user?.email}</p>
                <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{user?.role}</span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-600">{security?.recentLogin ? 'Hoạt động' : 'Mới'}</span>
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setEditModalOpen(true)}>✎</Button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-center text-sm font-semibold text-slate-600">
              <div className="rounded-[24px] bg-[#f0f7ff] px-4 py-4 shadow-[0_15px_35px_rgba(59,130,246,0.18)]">
                <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400">Đã gửi</p>
                <p className="text-2xl text-slate-900">{stats.reportsSubmitted}</p>
              </div>
              <div className="rounded-[24px] bg-[#f0f7ff] px-4 py-4 shadow-[0_15px_35px_rgba(59,130,246,0.18)]">
                <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400">Đã xử lý</p>
                <p className="text-2xl text-slate-900">{stats.reportsResolved}</p>
              </div>
            </div>
          </section>

          <section className="rounded-[34px] bg-white px-4 py-5 shadow-[0_20px_40px_rgba(15,23,42,0.12)]">
            <div className="grid grid-cols-2 gap-3">
              {deviceCards.map((card) => (
                <div key={card.key} className="relative rounded-[26px] border border-white/70 bg-gradient-to-b from-white to-[#f3f7ff] p-4 shadow-[0_12px_35px_rgba(15,23,42,0.15)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Smart</p>
                      <h3 className="text-lg font-semibold text-slate-900">{card.title}</h3>
                      <p className="text-[11px] text-slate-500">{card.subtitle}</p>
                    </div>
                    <span className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${card.accent} text-white shadow-[0_10px_25px_rgba(15,23,42,0.25)]`}>
                      <card.icon className="h-5 w-5" />
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm font-semibold text-slate-600">
                    <span>{card.active ? 'ON' : 'OFF'}</span>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={card.active}
                        onChange={() => setDeviceStates((prev) => ({ ...prev, [card.key]: !prev[card.key] }))}
                      />
                      <span className="inline-flex h-5 w-10 items-center rounded-full bg-slate-200 transition peer-checked:bg-emerald-500">
                        <span className="inline-block h-4 w-4 translate-x-1 rounded-full bg-white transition peer-checked:translate-x-5" />
                      </span>
                    </label>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500">
                    {card.metadata.map((line) => (
                      <span key={line} className="rounded-full bg-slate-100 px-2 py-1">{line}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[34px] bg-white px-4 py-4 shadow-[0_30px_70px_rgba(15,23,42,0.12)]">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.4em] text-slate-400">
              <span>Thao tác nhanh</span>
              <span>Vuốt →</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  className="flex items-center gap-3 rounded-[28px] bg-[#f6fbff] px-3 py-3 shadow-[0_4px_20px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.15)]"
                  onClick={() => {
                    const target = quickActionNavMap[action.label] ?? bottomAction;
                    setBottomAction(target);
                    if (action.label === 'Báo cáo') {
                      handleCreateReport();
                    }
                  }}
                >
                  <span className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${action.accent} text-white`}>
                    <action.icon className="h-5 w-5" />
                  </span>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-slate-900">{action.label}</p>
                    <p className="text-[11px] text-slate-500">{action.subLabel}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[34px] bg-white px-4 py-4 shadow-[0_25px_60px_rgba(15,23,42,0.15)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Thông báo</p>
                <h3 className="text-lg font-semibold text-slate-900">Cài đặt thông báo</h3>
              </div>
              <Badge variant="primary">Realtime</Badge>
            </div>
            <div className="mt-4 space-y-3">
              {notificationItems.map((item) => {
                const isEnabled = state.notifications[item.key];
                return (
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-3 rounded-[22px] border border-slate-200 bg-gradient-to-b from-white to-[#f6fbff] px-4 py-3 shadow-[0_10px_25px_rgba(15,23,42,0.1)]"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                      <p className="text-[11px] text-slate-500">{item.desc}</p>
                    </div>
                    <Button
                      size="sm"
                      variant={isEnabled ? 'secondary' : 'ghost'}
                      onClick={() => handleNotifications({ ...state.notifications, [item.key]: !isEnabled })}
                    >
                      {isEnabled ? 'Đang bật' : 'Bật lên'}
                    </Button>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-[34px] bg-white px-4 py-4 shadow-[0_30px_70px_rgba(15,23,42,0.12)]">
            <div className="grid grid-cols-2 gap-3">
              {metricHighlights.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-[26px] bg-gradient-to-br from-white to-[#eaf6ff] px-4 py-4 text-center shadow-[0_10px_35px_rgba(59,130,246,0.18)]"
                >
                  <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400">{metric.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{metric.value}</p>
                </div>
              ))}
            </div>
          </section>

          <RecentActivity items={state.activity} />
          <UserReportsTable reports={state.reports} onCreate={handleCreateReport} onDelete={handleDeleteReport} />
          <div ref={watchlistSectionRef}>
            <WatchlistCard items={state.watchlist} onAdd={handleAddWatch} onRemove={handleRemoveWatch} />
          </div>
          <div ref={securitySectionRef} className="relative rounded-[38px] bg-white px-5 py-5 shadow-[0_30px_80px_rgba(15,23,42,0.15)]">
            <div className="absolute inset-x-4 -top-5 h-24 rounded-[40px] bg-gradient-to-br from-[#e6f7ff] via-white to-white opacity-90 blur-[45px]" aria-hidden="true"></div>
            <div className="relative z-10 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.4em] text-slate-400">Kiểm tra bảo mật</h3>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Realtime</span>
            </div>
            <div className="relative z-10 mt-4 space-y-3">
              {checks.map((check) => (
                <div
                  key={check.key}
                  className="flex items-center justify-between gap-4 rounded-[26px] border border-slate-200 bg-gradient-to-b from-white to-[#f3f7ff] px-4 py-3 text-sm shadow-[0_10px_25px_rgba(15,23,42,0.1)]"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{check.label}</p>
                    <p className="text-[11px] text-slate-500">{check.detail}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-[11px] font-semibold text-slate-500 transition hover:text-slate-700"
                    onClick={check.onAction}
                    disabled={check.disabled}
                  >
                    {check.actionLabel}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <div className="fixed inset-x-4 bottom-4 flex justify-center pointer-events-none">
        <div className="relative w-full max-w-[420px]">
          <div className="flex h-16 items-center justify-between overflow-hidden rounded-[38px] bg-gradient-to-r from-emerald-500 to-teal-600 px-3 py-2 text-white shadow-[0_30px_60px_rgba(16,185,129,0.45)]">
            {bottomNavItems.map((item) => {
              const isActive = bottomAction === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  className={cn(
                    'flex flex-1 flex-col items-center justify-center gap-1 rounded-[28px] px-2 py-1 text-[11px] font-semibold transition duration-200',
                    isActive ? 'pointer-events-auto bg-white text-teal-600' : 'pointer-events-auto text-white/90 hover:text-white/95',
                    'shadow-[0_2px_6px_rgba(15,23,42,0.18)]'
                  )}
                  onClick={() => {
                    setBottomAction(item.key);
                    item.action();
                  }}
                >
                  <span
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-[18px] text-[20px]',
                      isActive ? 'bg-white text-teal-600' : 'bg-white/15 text-white'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => {
              setBottomAction('baocao');
              handleCreateReport();
            }}
            aria-label="Tạo báo cáo mới"
            className="pointer-events-auto absolute -top-8 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full bg-white text-emerald-600 shadow-[0_20px_45px_rgba(16,185,129,0.45)]"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
      </div>
      {/* Modals */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Chỉnh sửa hồ sơ"
        size="md"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-text-secondary">
            Cập nhật tên hiển thị và ảnh đại diện. Thay đổi sẽ áp dụng ngay cho tài khoản của bạn.
          </div>

          <Input
            label="Tên hiển thị"
            value={editForm.name}
            onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Nhập tên của bạn"
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-text-muted">
              <span>Avatar (ảnh mới)</span>
              <span className="text-[11px]">Chấp nhận JPG/PNG up to 3MB</span>
            </div>
            <div className="flex flex-col gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-3 py-4">
              <label
                htmlFor="avatar-upload"
                className="cursor-pointer text-sm font-semibold text-primary"
              >
                {avatarFile ? avatarFile.name : 'Chọn ảnh từ thiết bị'}
              </label>
              <input
                id="avatar-upload"
                type="file"
                className="hidden"
                accept="image/png,image/jpeg"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  if (file) {
                    setAvatarFile(file);
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setAvatarPreview(reader.result as string);
                      setEditForm((f) => ({ ...f, avatar: reader.result as string }));
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <span>Ảnh hiện tại</span>
                {avatarPreview && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-500">xem được</span>
                )}
              </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={async () => {
                          if (!avatarFile) {
                            showToast('error', 'Chọn ảnh trước khi tải lên');
                            return;
                          }
                          setAvatarUploading(true);
                          const reader = new FileReader();
                          reader.onloadend = async () => {
                            try {
                              const base64 = reader.result as string;
                              const res = await fetch('/api/user/profile', {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ avatar: base64 }),
                              });
                              const data = await res.json();
                              if (!res.ok) throw new Error(data.error || 'Không thể cập nhật ảnh');
                              setState((s) => ({ ...s, user: data.user }));
                              showToast('success', 'Ảnh đại diện đã được cập nhật');
                              setAvatarFile(null);
                            } catch (err: any) {
                              showToast('error', err?.message || 'Không cập nhật được ảnh');
                            } finally {
                              setAvatarUploading(false);
                            }
                          };
                          reader.readAsDataURL(avatarFile);
                        }}
                        isLoading={avatarUploading}
                      >
                        Tải lên
                      </Button>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div className="h-12 w-12 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <img
                src={editForm.avatar || '/favicon.ico'}
                alt="Avatar preview"
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/favicon.ico';
                }}
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-main truncate">{editForm.name || '—'}</p>
              <p className="text-xs text-text-muted truncate">{user?.email || '—'}</p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setEditModalOpen(false)}>Hủy</Button>
            <Button onClick={handleUpdateProfile} isLoading={actionLoading === 'profile'}>
              Lưu thay đổi
            </Button>
          </div>
        </div>
      </Modal>

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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[180px_1fr]">
              <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 p-3 bg-white">
                {twofaInfo?.otpauthUrl ? (
                  <QRCodeSVG value={twofaInfo.otpauthUrl} size={150} />
                ) : (
                  <div className="text-sm text-text-secondary">Không có QR</div>
                )}
                <p className="text-xs text-text-muted text-center">Quét QR trong ứng dụng Authenticator</p>
              </div>
              <div className="space-y-3">
                <div className="rounded-xl border border-slate-200 p-3 bg-white">
                  <p className="text-xs uppercase tracking-[0.2em] text-text-muted mb-1">Mã bí mật</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="block max-w-full break-all rounded bg-slate-100 px-2 py-1 text-sm font-mono">
                      {twofaInfo?.secret || '—'}
                    </code>
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

                <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto] md:items-end">
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
                <Card className="grid grid-cols-1 gap-4 md:grid-cols-[180px_1fr]">
                  <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 p-3 bg-white">
                    {twofaInfo?.otpauthUrl ? (
                      <QRCodeSVG value={twofaInfo.otpauthUrl} size={150} />
                    ) : (
                      <div className="text-sm text-text-secondary">Không có QR</div>
                    )}
                    <p className="text-xs text-text-muted text-center">Quét QR để thêm thiết bị mới</p>
                  </div>
                  <div className="space-y-3">
                  <div className="rounded-xl border border-slate-200 p-3 bg-white">
                    <p className="text-xs uppercase tracking-[0.2em] text-text-muted mb-1">Mã bí mật</p>
                    <div className="flex items-center gap-2 flex-wrap">
                        <code className="block max-w-full break-all rounded bg-slate-100 px-2 py-1 text-sm font-mono">
                          {twofaInfo.secret}
                        </code>
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
            Kết nối tài khoản mạng xã hội để đăng nhập nhanh và tăng bảo mật. Nhập mật khẩu để xác thực trước khi liên kết / hủy liên kết.
          </p>
          {security?.oauthConnected && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-text-secondary">
              Đang liên kết: <span className="font-semibold text-text-main">{linkedOauthLabel}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {[
              {
                key: 'google',
                title: 'Google',
                desc: 'Đăng nhập bằng Google OAuth',
                enabled: true,
                icon: <Chrome className="h-5 w-5 text-[#EA4335]" />,
                iconBg: 'bg-[#EA4335]/10',
              },
              {
                key: 'facebook',
                title: 'Facebook',
                desc: 'Đăng nhập bằng Facebook OAuth',
                enabled: true,
                icon: <Facebook className="h-5 w-5 text-[#1877F2]" />,
                iconBg: 'bg-[#1877F2]/10',
              },
              {
                key: 'twitter',
                title: 'X (Twitter)',
                desc: 'Đăng nhập bằng X OAuth 2.0',
                enabled: true,
                icon: <Twitter className="h-5 w-5 text-sky-600" />,
                iconBg: 'bg-sky-500/10',
              },
              {
                key: 'telegram',
                title: 'Telegram (sắp có)',
                desc: 'Kết nối bot/Telegram Login',
                enabled: false,
                icon: <Send className="h-5 w-5 text-cyan-600" />,
                iconBg: 'bg-cyan-500/10',
              },
            ].map((item) => {
              const isLinked = Boolean(security?.oauthConnected) && linkedOauthProviderKey === item.key;
              return (
                <Card
                  key={item.key}
                  className={`space-y-2 border p-4 ${oauthProvider === item.key ? 'border-primary/50 ring-2 ring-primary/10' : 'border-bg-border hover:border-slate-300'} ${!item.enabled ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl ${item.iconBg}`}>
                        {item.icon}
                      </div>
                      <div>
                        <p className="font-semibold text-text-main">{item.title}</p>
                        <p className="text-xs text-text-muted">{item.desc}</p>
                      </div>
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
                  {isLinked ? (
                    <Badge variant="success">Đã liên kết</Badge>
                  ) : (
                    <Badge variant={item.enabled ? 'warning' : 'default'}>
                      {item.enabled ? 'Chưa liên kết' : 'Sắp có'}
                    </Badge>
                  )}
                </Card>
              );
            })}
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
                leftIcon={selectedOauthIcon}
              >
                Liên kết {selectedOauthLabel}
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
        {security?.emailVerified ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-text-secondary">
              Email của bạn đã được xác minh. Nếu bạn thay đổi email trong tương lai, hệ thống sẽ yêu cầu xác minh lại.
            </div>
            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => setEmailModalOpen(false)}>Đóng</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Gửi mã xác minh tới email của bạn và nhập mã 6 chữ số để hoàn tất.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                onClick={handleSendEmailCode}
                isLoading={sendingCode}
                disabled={emailCooldown > 0}
              >
                {emailCooldown > 0 ? `Gửi lại (${emailCooldown}s)` : 'Gửi mã'}
              </Button>
              {emailDevCode && (
                <span className="text-xs text-warning">Mã dev: {emailDevCode}</span>
              )}
              <span className="text-xs text-text-muted">Hiệu lực 10 phút</span>
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
        )}
      </Modal>

      {/* Search Modal */}
      <Modal
        isOpen={searchModalOpen}
        onClose={() => {
          setSearchModalOpen(false);
          setModalSearchTerm('');
          setModalSearchResults([]);
          setModalSearched(false);
        }}
        title="Tìm kiếm nâng cao"
        size="lg"
      >
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Nhập tên miền, email, số điện thoại..."
                value={modalSearchTerm}
                onChange={(e) => setModalSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleModalSearch(modalSearchTerm);
                  }
                }}
                className="flex-1 rounded-full border border-slate-200 bg-slate-50 py-2 text-sm"
              />
              <Button
                onClick={() => handleModalSearch(modalSearchTerm)}
                isLoading={modalIsSearching}
                className="rounded-full px-4"
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
              {['Website', 'Điện thoại', 'Email', 'Ngân hàng'].map((option) => (
                <span key={option} className="rounded-full border border-slate-200 bg-white/60 px-2 py-1 text-[10px] font-medium text-slate-500">
                  {option}
                </span>
              ))}
            </div>
          </div>

          {modalSearched && (
            <div className="space-y-2">
              {modalIsSearching ? (
                <div className="flex justify-center py-4">
                  <Skeleton className="w-full h-20" />
                </div>
              ) : modalSearchResults.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Không tìm thấy kết quả</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {modalSearchResults.slice(0, 5).map((result, index) => (
                    <Card key={result.id || `fallback-${index}`} className={cn(
                      'p-3 border-l-4',
                      result.status === 'safe' ? 'border-l-success bg-success/5' :
                      result.status === 'suspected' ? 'border-l-warning bg-warning/5' :
                      'border-l-danger bg-danger/5'
                    )}>
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {result.icon ? (
                            <img src={result.icon} alt="icon" className="w-10 h-10 rounded-lg object-cover" onError={(e) => { e.currentTarget.src = 'https://tinnhiemmang.vn/img/icon_web2.png'; }} />
                          ) : result.status === 'safe' ? (
                            <ShieldCheck className="w-10 h-10 text-success" />
                          ) : result.status === 'suspected' ? (
                            <AlertTriangle className="w-10 h-10 text-warning" />
                          ) : (
                            <XCircle className="w-10 h-10 text-danger" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Globe className="w-3 h-3 text-text-muted flex-shrink-0" />
                            <span className="font-semibold text-text-main text-sm truncate">{result.name || result.title}</span>
                          </div>
                          {result.description && (
                            <p className="text-xs text-text-secondary truncate">{result.description}</p>
                          )}
                        </div>
                        <div className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 flex-shrink-0',
                          result.status === 'safe' ? 'bg-success text-white' :
                          result.status === 'suspected' ? 'bg-warning text-black' :
                          'bg-danger text-white'
                        )}>
                          {result.status === 'safe' ? <CheckCircle className="w-3 h-3" /> :
                           result.status === 'suspected' ? <Clock3 className="w-3 h-3" /> :
                           <XCircle className="w-3 h-3" />}
                          <span className="hidden sm:inline">
                            {result.status === 'safe' ? 'An toàn' : result.status === 'suspected' ? 'Nghi ngờ' : 'Nguy hiểm'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 gap-2">
                        <div className="text-center flex-1">
                          <p className="text-sm font-bold text-text-main">{result.count_report || 0}</p>
                          <p className="text-[10px] text-text-muted">Báo cáo</p>
                        </div>
                        <div className="text-center flex-1">
                          <p className="text-xs font-bold text-text-main">{result.created_at ? new Date(result.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : 'N/A'}</p>
                          <p className="text-[10px] text-text-muted">Ngày tạo</p>
                        </div>
                        <div className="text-center flex-1">
                          <p className="text-xs font-bold text-text-main capitalize">{result.category || 'N/A'}</p>
                          <p className="text-[10px] text-text-muted">Danh mục</p>
                        </div>
                        <div className="text-center flex-1">
                          <p className="text-xs font-bold text-text-main truncate">{result.source || 'TNM'}</p>
                          <p className="text-[10px] text-text-muted">Nguồn</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      <Footer />
      <MobileNav />
    </div>
  );
}

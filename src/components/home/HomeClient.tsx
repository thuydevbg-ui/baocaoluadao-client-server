'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Shield,
  AlertTriangle,
  CheckCircle,
  Phone,
  Building2,
  Globe,
  ArrowRight,
  Clock,
  Sparkles,
  Mail,
  Zap,
  FileText,
  BarChart3,
  Info,
  Share2,
  ShieldCheck,
} from 'lucide-react';
import { Navbar, MobileNav, Footer } from '@/components/layout';
import { Button, Tooltip } from '@/components/ui';
import { useI18n } from '@/contexts/I18nContext';
import { useToast } from '@/components/ui/Toast';
import { cn, getRiskGradient, type RiskLevel } from '@/lib/utils';
import {
  mockPopularSearches,
  mockTrendingScams,
  mockRecentAlerts,
} from '@/lib/mockData';

interface ScamData {
  id: number;
  name: string;
  domain: string;
  type: string;
  icon?: string;
  reports?: number;
  views?: number;
  comments?: number;
  ratings?: number;
  status: string;
  date: string;
  description: string;
  organization: string;
}

interface HomeClientProps {
  trustedSection: React.ReactNode;
}

interface CategoryData {
  name: string;
  slug: string;
  count: number;
  icon: string;
  description?: string;
}

interface StatsResponse {
  success: boolean;
  data?: {
    total?: number;
    categories?: CategoryData[];
    source?: string;
  };
  total?: number;
  categories?: CategoryData[];
  source?: string;
}

type HeroSearchType = 'phone' | 'bank' | 'website' | 'email';

type SearchInsight = {
  title: string;
  subtitle: string;
  hint: string;
  value: string;
  risk: RiskLevel;
  Icon: React.ComponentType<{ className?: string }>;
};

const categoryVisual: Record<string, { icon: string; color: string }> = {
  website: { icon: '🌐', color: 'from-blue-500 to-blue-600' },
  organizations: { icon: '🏢', color: 'from-purple-500 to-purple-600' },
  devices: { icon: '📱', color: 'from-green-500 to-green-600' },
  systems: { icon: '🔒', color: 'from-red-500 to-red-600' },
  apps: { icon: '📲', color: 'from-orange-500 to-orange-600' },
  organization: { icon: '🏢', color: 'from-purple-500 to-purple-600' },
  device: { icon: '📱', color: 'from-green-500 to-green-600' },
  system: { icon: '🔒', color: 'from-red-500 to-red-600' },
  app: { icon: '📲', color: 'from-orange-500 to-orange-600' },
  phone: { icon: '📞', color: 'from-cyan-500 to-cyan-600' },
  bank: { icon: '🏦', color: 'from-yellow-500 to-yellow-600' },
  email: { icon: '📧', color: 'from-pink-500 to-pink-600' },
  social: { icon: '💬', color: 'from-indigo-500 to-indigo-600' },
  sms: { icon: '💌', color: 'from-amber-500 to-amber-600' },
};

const heroSearchTypes: Array<{ key: HeroSearchType; label: string; Icon: React.ComponentType<{ className?: string }> }> = [
  { key: 'phone', label: 'Số điện thoại', Icon: Phone },
  { key: 'bank', label: 'Ngân hàng', Icon: Building2 },
  { key: 'website', label: 'Domain', Icon: Globe },
  { key: 'email', label: 'Email', Icon: Mail },
];

const heroSearchPlaceholders: Record<HeroSearchType, string> = {
  phone: 'Nhập số điện thoại cần kiểm tra',
  bank: 'Nhập số tài khoản hoặc tên ngân hàng',
  website: 'Nhập domain hoặc URL website',
  email: 'Nhập địa chỉ email nghi ngờ',
};

const heroSearchCategoryMap: Record<HeroSearchType, string> = {
  phone: 'phone',
  bank: 'bank',
  website: 'website',
  email: 'email',
};

const primaryCategorySlugs = new Set([
  'website',
  'organization',
  'device',
  'system',
  'application',
  'websites',
  'organizations',
  'devices',
  'systems',
  'apps',
  'phone',
  'bank',
  'email',
  'social',
  'sms',
]);

const fallbackSearchInsights: SearchInsight[] = [
  {
    title: 'Từ khóa nóng',
    subtitle: 'Phân tích 24h: tăng 32% lượt tìm',
    hint: 'Tốc độ tìm kiếm gia tăng nhanh ở khu vực miền Bắc',
    value: 'scamguard.app',
    risk: 'scam',
    Icon: Sparkles,
  },
  {
    title: 'Chuỗi ngân hàng',
    subtitle: '14 báo cáo mới liên quan tới VCB',
    hint: 'Các thanh toán chuyển khoản có dấu hiệu giả mạo',
    value: 'VCB-Message',
    risk: 'suspicious',
    Icon: Shield,
  },
  {
    title: 'Cảnh báo tổng quan',
    subtitle: '62% báo cáo tuần này thuộc website',
    hint: 'Tỉ lệ gian lận cao đang tập trung trên các miền mới',
    value: '62% nguy cơ',
    risk: 'scam',
    Icon: Zap,
  },
];

const communityTips = [
  {
    title: 'Ghi nhận & lan toả',
    description: 'Chụp ảnh màn hình, chép URL và chia sẻ lên cộng đồng ScamGuard để cảnh báo nhanh.',
    icon: Share2,
  },
  {
    title: 'Định danh SSL & Whois',
    description: 'Kiểm tra chứng chỉ SSL và thông tin chủ thể (RDAP/WHOIS) trước khi chuyển tiền.',
    icon: ShieldCheck,
  },
  {
    title: 'Giám sát liên tục',
    description: 'Lưu lại nhật ký tìm kiếm, bật thông báo lừa đảo và chuyên mục “Lưu trữ” để bảo vệ tài sản.',
    icon: Zap,
  },
];

const featureCards = [
  {
    title: 'Tra cứu tức thì',
    description: 'Kiểm tra số điện thoại, website, tài khoản ngân hàng chỉ trong vài giây.',
    href: '/search',
    icon: Search,
    color: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
  },
  {
    title: 'Báo cáo cộng đồng',
    description: 'Gửi báo cáo kèm bằng chứng để cảnh báo sớm cho cộng đồng.',
    href: '/report',
    icon: FileText,
    color: 'linear-gradient(135deg, #f43f5e 0%, #ef4444 100%)',
  },
  {
    title: 'AI Scanner',
    description: 'Phân tích tin nhắn, website nghi ngờ bằng mô hình AI hỗ trợ.',
    href: '/ai',
    icon: Zap,
    color: 'linear-gradient(135deg, #10b981 0%, #22c55e 100%)',
  },
  {
    title: 'Hướng dẫn an toàn',
    description: 'Quy trình xử lý khi gặp lừa đảo và cách bảo vệ tài khoản.',
    href: '/report-guide',
    icon: BarChart3,
    color: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
  },
];

const heroHighlights = [
  {
    title: 'Kiểm chứng cộng đồng',
    description: 'Nguồn dữ liệu cộng đồng được đối soát liên tục.',
    icon: Shield,
  },
  {
    title: 'Theo dõi thời gian thực',
    description: 'Cảnh báo được cập nhật nhanh theo xu hướng mới.',
    icon: Clock,
  },
  {
    title: 'Mức tin cậy rõ ràng',
    description: 'Phân loại rủi ro theo từng thực thể cụ thể.',
    icon: CheckCircle,
  },
];

function renderRiskBadge(status?: string) {
  const normalized = (status || '').toLowerCase();

  if (normalized === 'confirmed' || normalized === 'blocked' || normalized === 'scam' || normalized === 'high') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-danger/30 bg-danger/10 px-2 py-0.5 text-[11px] font-semibold text-danger">
        <AlertTriangle className="h-3.5 w-3.5" />
        Nguy cơ cao
      </span>
    );
  }

  if (normalized === 'suspected' || normalized === 'warning' || normalized === 'investigating' || normalized === 'processing' || normalized === 'medium') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[11px] font-semibold text-warning">
        <Clock className="h-3.5 w-3.5" />
        Cảnh giác
      </span>
    );
  }

  if (normalized === 'trusted' || normalized === 'safe' || normalized === 'low') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
        <CheckCircle className="h-3.5 w-3.5" />
        An toàn
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-bg-border bg-bg-cardHover px-2 py-0.5 text-[11px] font-semibold text-text-secondary">
      <Info className="h-3.5 w-3.5" />
      Đang theo dõi
    </span>
  );
}

export default function HomeClient({ trustedSection }: HomeClientProps) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const router = useRouter();

  const [activeFilter, setActiveFilter] = useState('all');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [heroSearchType, setHeroSearchType] = useState<HeroSearchType>('phone');
  const [heroSearchValue, setHeroSearchValue] = useState('');

  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [dataSource, setDataSource] = useState<string>('fallback');
  const [statsLoading, setStatsLoading] = useState(true);
  const [scamData, setScamData] = useState<ScamData[]>([]);
  const [scamStats, setScamStats] = useState({ total: 0, websites: 0, phones: 0, banks: 0 });

  const uniqueCategories = useMemo(() => {
    const seen = new Map<string, CategoryData>();
    categories.forEach((category) => {
      if (!seen.has(category.slug)) {
        seen.set(category.slug, category);
      }
    });
    return Array.from(seen.values());
  }, [categories]);

  const primaryCategories = useMemo(
    () => uniqueCategories.filter((category) => primaryCategorySlugs.has(category.slug)),
    [uniqueCategories]
  );

  const statsCategories = useMemo(() => {
    const source = primaryCategories.length > 0 ? primaryCategories : uniqueCategories;
    return source.slice(0, 10);
  }, [primaryCategories, uniqueCategories]);

  const searchInsights = useMemo<SearchInsight[]>(() => {
    if (mockPopularSearches.length) {
      return mockPopularSearches.slice(0, 3).map((item, index) => ({
        title: item.value,
        subtitle: `Phân loại: ${item.risk}`,
        hint: `Đã có ${((index + 1) * 14).toString()} lượt tìm kiếm gần đây`,
        value: `${(index + 1) * 120}+ lượt`,
        risk: item.risk as RiskLevel,
        Icon: [Sparkles, Shield, Zap][index % 3],
      }));
    }
    return fallbackSearchInsights;
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const statsResponse = await fetch('/api/scams?stats=true');
        const statsData = await statsResponse.json();

        if (statsData.success && statsData.data && statsData.data.length > 0) {
          const scamCategories = statsData.data.map((cat: any) => ({
            name: cat.name,
            slug: cat.slug,
            count: cat.count || 0,
            icon: cat.icon || '🛡️',
          }));

          const bySlug = new Map<string, number>(
            statsData.data.map((cat: any) => [String(cat.slug || '').toLowerCase(), Number(cat.count || 0)])
          );
          const total = statsData.data.reduce((sum: number, cat: any) => sum + Number(cat.count || 0), 0);

          setCategories(scamCategories);
          setScamStats({
            total,
            websites: bySlug.get('website') || 0,
            phones: bySlug.get('phone') || 0,
            banks: bySlug.get('bank') || 0,
          });
          setDataSource('tinnhiemmang.vn');
          setStatsLoading(false);
          return;
        }

        const response = await fetch('/api/stats');
        const data: StatsResponse = await response.json();

        const resolvedCategories = Array.isArray(data?.data?.categories)
          ? data.data.categories
          : Array.isArray(data?.categories)
            ? data.categories
            : [];

        const resolvedSource =
          typeof data?.data?.source === 'string'
            ? data.data.source
            : typeof data?.source === 'string'
              ? data.source
              : 'fallback';

        if (data.success) {
          setCategories(resolvedCategories);
          setDataSource(resolvedSource);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setStatsLoading(false);
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
    async function fetchScamData() {
      try {
        const response = await fetch('/api/scams?page=1&limit=100');
        const data = await response.json();

        if (data.success && data.data) {
          setScamData(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch scam data:', error);
      }
    }

    fetchScamData();
  }, []);

  const filteredAlerts =
    activeFilter === 'all'
      ? (scamData.length > 0 ? scamData : mockRecentAlerts)
      : (scamData.length > 0 ? scamData : mockRecentAlerts).filter((alert: any) => {
          const alertType = alert.type === 'web' ? 'website' : alert.type;
          return alertType === activeFilter;
        });

  const dedupedAlerts = useMemo(() => {
    const seen = new Set<string>();
    return filteredAlerts.filter((alert: any) => {
      const key = alert.domain || alert.value;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }, [filteredAlerts]);

  const displayedAlerts = dedupedAlerts.slice(0, 6);
  const fallbackAlerts = mockRecentAlerts.slice(0, 6);
  const alertsToShow = displayedAlerts.length ? displayedAlerts : fallbackAlerts;
  const showEmptyAlerts = alertsToShow.length === 0;

  const alertStats = useMemo(() => {
    const data = scamData.length > 0 ? scamData : mockRecentAlerts;
    const total = scamStats.total > 0 ? scamStats.total : data.length;
    const websites =
      scamStats.websites > 0
        ? scamStats.websites
        : data.filter((alert) => alert.type === 'web' || alert.type === 'website').length;
    const phones = scamStats.phones > 0 ? scamStats.phones : data.filter((alert) => alert.type === 'phone').length;
    const banks = scamStats.banks > 0 ? scamStats.banks : data.filter((alert) => alert.type === 'bank').length;

    return [
      { label: 'Tổng báo cáo', value: total, icon: AlertTriangle, description: 'Các cảnh báo đã tổng hợp' },
      { label: 'Website', value: websites, icon: Globe, description: 'Nguồn phát tán phổ biến' },
      { label: 'Điện thoại', value: phones, icon: Phone, description: 'Số bị phản ánh bởi cộng đồng' },
      { label: 'Ngân hàng', value: banks, icon: Building2, description: 'Tài khoản/đơn vị có dấu hiệu' },
    ];
  }, [scamData, scamStats]);

  const shouldShowCategoryCount = !statsLoading && uniqueCategories.length > 0;

  const handleHeroSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams();
    params.set('category', heroSearchCategoryMap[heroSearchType]);

    const value = heroSearchValue.trim();
    if (value) {
      params.set('q', value);
    }

    router.push(`/search?${params.toString()}`);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) {
      return;
    }

    setIsSubscribed(true);
    showToast('success', t('home.newsletter_success'));
    setNewsletterEmail('');
  };

  const getIconUrl = (alert: any) => {
    if (alert.sourceIcon || alert.icon) return alert.sourceIcon || alert.icon;
    const domain = alert.domain || alert.value || alert.name || '';
    if (domain) {
      return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
    }
    return 'https://tinnhiemmang.vn/img/icon_web2.png';
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg-main">
      <Navbar />

      <main className="flex-1 pt-20 pb-24 md:pb-8">
        <div className="app-shell app-stack">
          <section className="app-card app-card-hero">
            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
                  <Sparkles className="h-4 w-4" />
                  {t('home.ai_powered')}
                </div>

                <h1 className="text-3xl font-bold leading-tight text-text-main md:text-5xl">{t('home.title')}</h1>
                <p className="max-w-2xl text-sm leading-relaxed text-text-secondary md:text-lg">{t('home.subtitle')}</p>

                <div className="grid gap-3 sm:grid-cols-3">
                  {heroHighlights.map((item) => (
                    <div key={item.title} className="rounded-2xl border border-bg-border/70 bg-white/70 p-4 dark:bg-slate-900/40">
                      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <p className="text-sm font-semibold text-text-main">{item.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-text-muted">{item.description}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/report"
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary/30 transition-colors hover:bg-primary-hover"
                  >
                    Báo cáo ngay
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/search"
                    className="inline-flex items-center gap-2 rounded-xl border border-bg-border bg-white px-4 py-2.5 text-sm font-semibold text-text-main transition-colors hover:bg-bg-cardHover dark:bg-bg-card"
                  >
                    Tra cứu dữ liệu
                    <Search className="h-4 w-4 text-text-muted" />
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl border border-bg-border/70 bg-white p-5 shadow-sm dark:bg-[#0f172a]/80">
                <h2 className="text-lg font-semibold text-text-main md:text-xl">Tra cứu tập trung</h2>
                <p className="mt-1 text-sm text-text-secondary">Tìm nhanh theo loại thực thể để kiểm tra rủi ro chính xác hơn.</p>

                <form onSubmit={handleHeroSearchSubmit} className="mt-5 space-y-4">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
                    <input
                      type="text"
                      value={heroSearchValue}
                      onChange={(e) => setHeroSearchValue(e.target.value)}
                      placeholder={heroSearchPlaceholders[heroSearchType]}
                      className="h-14 w-full rounded-2xl border border-bg-border bg-bg-main pl-12 pr-4 text-sm text-text-main outline-none transition focus:border-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {heroSearchTypes.map((type) => (
                      <button
                        key={type.key}
                        type="button"
                        onClick={() => setHeroSearchType(type.key)}
                        className={cn(
                          'inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors',
                          heroSearchType === type.key
                            ? 'border-primary/40 bg-primary/10 text-primary'
                            : 'border-bg-border bg-bg-main text-text-secondary hover:bg-bg-cardHover'
                        )}
                      >
                        <type.Icon className="h-4 w-4" />
                        {type.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="submit"
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-sm shadow-primary/30 transition-colors hover:bg-primary-hover"
                  >
                    {t('home.search_button')}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          </section>

          <section className="app-card app-stack">
            <div>
              <h2 className="text-2xl font-semibold text-text-main">Quick actions</h2>
              <p className="mt-1 text-sm text-text-secondary">Truy cập nhanh các tính năng chính để hành động ngay khi phát hiện dấu hiệu lừa đảo.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {featureCards.map((feature) => (
                <Link key={feature.title} href={feature.href} className="group">
                  <article className="rounded-2xl border border-bg-border/70 bg-bg-main p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm">
                    <div
                      style={{ background: feature.color }}
                      className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm"
                    >
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <p className="text-base font-semibold text-text-main">{feature.title}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-text-muted">{feature.description}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                      Mở
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </article>
                </Link>
              ))}
            </div>
          </section>

          <section className="app-card app-stack">
            <div>
              <h2 className="text-2xl font-semibold text-text-main">Statistics</h2>
              <p className="mt-1 text-sm text-text-secondary">Dữ liệu tổng quan từ nguồn {dataSource} được làm mới theo chu kỳ ngắn.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {alertStats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-bg-border/70 bg-bg-main p-4">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <stat.icon className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-semibold text-text-main">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold text-text-main">{Number(stat.value || 0).toLocaleString('vi-VN')}</p>
                  <p className="mt-1 text-xs text-text-muted">{stat.description}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {statsCategories.map((category) => {
                const visual = categoryVisual[category.slug] || { icon: '🛡️', color: 'from-slate-500 to-slate-600' };
                return (
                  <Link key={category.slug} href={`/search?category=${category.slug}`}>
                    <div className="rounded-2xl border border-bg-border/70 bg-bg-main p-3 transition-colors hover:bg-bg-cardHover">
                      <div className={cn('mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br text-lg text-white', visual.color)}>
                        {visual.icon}
                      </div>
                      <p className="line-clamp-1 text-sm font-semibold text-text-main">{category.name}</p>
                      <p className="mt-0.5 text-lg font-bold text-primary">
                        {shouldShowCategoryCount ? category.count.toLocaleString('vi-VN') : '--'}
                      </p>
                      <p className="line-clamp-2 text-[11px] text-text-muted">{category.description || 'Dữ liệu được cập nhật thường xuyên'}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="home-main-grid">
            <div className="app-stack">
              <div className="app-card app-stack">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold text-text-main">Recent scam reports</h2>
                    <p className="mt-1 text-sm text-text-secondary">Danh sách báo cáo gần nhất theo mô hình table/card để theo dõi nhanh mức rủi ro.</p>
                  </div>
                  <Link
                    href="/report-lua-dao"
                    className="inline-flex items-center gap-1 rounded-xl border border-bg-border bg-bg-main px-3 py-2 text-sm font-semibold text-text-main transition-colors hover:bg-bg-cardHover"
                  >
                    Xem tất cả
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="flex flex-wrap gap-2">
                  {['all', 'phone', 'website', 'bank'].map((filter) => (
                    <Tooltip key={filter} label={`Lọc ${t(`home.filter.${filter}`)} báo cáo`} position="bottom">
                      <button
                        onClick={() => setActiveFilter(filter)}
                        className={cn(
                          'rounded-full border px-4 py-2 text-xs font-semibold transition-colors md:text-sm',
                          activeFilter === filter
                            ? 'border-primary/40 bg-primary/10 text-primary'
                            : 'border-bg-border bg-bg-main text-text-secondary hover:bg-bg-cardHover'
                        )}
                      >
                        {t(`home.filter.${filter}`)}
                      </button>
                    </Tooltip>
                  ))}
                </div>

                {showEmptyAlerts ? (
                  <div className="rounded-2xl border border-dashed border-bg-border bg-bg-main p-6 text-center">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-semibold text-text-main">Chưa có cảnh báo mới</p>
                    <p className="mt-1 text-xs text-text-muted">Hãy gửi báo cáo hoặc tra cứu để góp phần bảo vệ cộng đồng.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alertsToShow.map((alert: any) => {
                      const alertValue = alert.domain || alert.value;
                      const alertIcon = getIconUrl(alert);

                      return (
                        <Link key={alert.id} href={`/detail/${alert.type}/${encodeURIComponent(alertValue)}`}>
                          <article className="rounded-2xl border border-bg-border/70 bg-bg-main p-4 transition-colors hover:bg-bg-cardHover">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-bg-border/70 bg-white">
                                  <img
                                    src={alertIcon}
                                    alt={alertValue}
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      const target = e.currentTarget;
                                      if (target.dataset.fallback) {
                                        target.style.display = 'none';
                                        return;
                                      }
                                      target.dataset.fallback = '1';
                                      target.src = 'https://tinnhiemmang.vn/img/icon_web2.png';
                                    }}
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate font-mono text-sm font-semibold text-text-main md:text-base">{alertValue}</p>
                                  <p className="mt-1 line-clamp-1 text-xs text-text-secondary">{alert.description || 'Báo cáo cộng đồng mới'}</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3 text-xs text-text-muted sm:flex sm:items-center sm:gap-4">
                                <div className="rounded-xl bg-bg-card px-3 py-2 sm:bg-transparent sm:p-0">
                                  <p className="text-[11px] uppercase tracking-wide">Báo cáo</p>
                                  <p className="mt-0.5 text-sm font-semibold text-text-main">{Number(alert.reports || 0).toLocaleString('vi-VN')}</p>
                                </div>
                                <div className="rounded-xl bg-bg-card px-3 py-2 sm:bg-transparent sm:p-0">
                                  <p className="text-[11px] uppercase tracking-wide">Ngày</p>
                                  <p className="mt-0.5 text-sm font-semibold text-text-main">{alert.date || '—'}</p>
                                </div>
                                <div className="col-span-2 sm:col-span-1">{renderRiskBadge(alert.status)}</div>
                              </div>
                            </div>
                          </article>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <aside className="app-stack">
              {trustedSection}

              <div className="app-card app-stack">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-text-main">{t('home.trending_scams')}</h3>
                  <Tooltip label="Bảng xếp hạng các scam nóng" position="bottom">
                    <Info className="h-4 w-4 text-text-muted" />
                  </Tooltip>
                </div>

                {mockTrendingScams.length > 0 ? (
                  <div className="space-y-2">
                    {mockTrendingScams.slice(0, 5).map((scam) => (
                      <Link
                        key={scam.id}
                        href={`/search?q=${encodeURIComponent(scam.name ?? scam.value)}`}
                        className="group flex items-center gap-3 rounded-xl border border-bg-border/70 bg-bg-main p-3 transition-colors hover:bg-bg-cardHover"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg-cardHover text-base">
                          {scam.image}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-sm font-semibold text-text-main group-hover:text-primary">{scam.name}</p>
                          <p className="text-xs text-text-muted">{scam.reports.toLocaleString('vi-VN')} báo cáo</p>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-text-muted group-hover:text-primary" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-bg-border bg-bg-main p-4 text-sm text-text-muted">
                    Chưa có dữ liệu thịnh hành.
                  </p>
                )}
              </div>

              <div className="app-card app-stack">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-text-main">Search trends</h3>
                  <Tooltip label="Thống kê từ khóa, nguồn tìm kiếm" position="bottom">
                    <Info className="h-4 w-4 text-text-muted" />
                  </Tooltip>
                </div>

                <div className="space-y-2">
                  {searchInsights.map((insight) => {
                    const InsightIcon = insight.Icon;
                    return (
                      <Tooltip key={insight.title} label={insight.hint} position="top">
                        <div className="flex items-center justify-between gap-3 rounded-xl border border-bg-border/70 bg-bg-main p-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'flex h-9 w-9 items-center justify-center rounded-xl text-white',
                                `bg-gradient-to-br ${getRiskGradient(insight.risk)}`
                              )}
                            >
                              <InsightIcon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-text-main">{insight.title}</p>
                              <p className="text-xs text-text-muted">{insight.subtitle}</p>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-text-main">{insight.value}</span>
                        </div>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>

              <div className="app-card app-stack">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-text-main">Community tips</h3>
                  <span className="text-[11px] uppercase tracking-[0.18em] text-text-muted">Tips</span>
                </div>

                <div className="space-y-2">
                  {communityTips.map((tip) => (
                    <article key={tip.title} className="flex gap-3 rounded-xl border border-bg-border/70 bg-bg-main p-3">
                      <tip.icon className="mt-0.5 h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-semibold text-text-main">{tip.title}</p>
                        <p className="mt-1 text-xs text-text-secondary">{tip.description}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </aside>
          </section>

          <section className="app-card app-card-gradient">
            <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
              <div className="space-y-2">
                <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Nhận cảnh báo
                </span>
                <h3 className="text-2xl font-bold text-text-main">{t('home.newsletter')}</h3>
                <p className="text-sm text-text-secondary md:text-base">{t('home.newsletter_desc')}</p>
              </div>

              {isSubscribed ? (
                <div className="inline-flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-semibold text-success">
                  <CheckCircle className="h-5 w-5" />
                  {t('home.newsletter_success')}
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="flex w-full flex-col gap-3 sm:w-[340px]">
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                    <input
                      type="email"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder={t('home.newsletter_placeholder')}
                      className="h-12 w-full rounded-xl border border-bg-border bg-white pl-10 pr-3 text-sm text-text-main outline-none transition focus:border-primary dark:bg-bg-main"
                      required
                    />
                  </div>
                  <Button type="submit" variant="primary" size="md" className="w-full">
                    {t('home.newsletter_button')}
                  </Button>
                </form>
              )}
            </div>
          </section>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}

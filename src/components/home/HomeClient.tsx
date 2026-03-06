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
  Share2,
  ShieldCheck,
} from 'lucide-react';
import { Navbar, MobileNav, Footer } from '@/components/layout';
import { Button } from '@/components/ui';
import { useI18n } from '@/contexts/I18nContext';
import { useToast } from '@/components/ui/Toast';
import { cn, type RiskLevel } from '@/lib/utils';
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

const categoryIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  website: Globe,
  websites: Globe,
  organization: Building2,
  organizations: Building2,
  device: Phone,
  devices: Phone,
  phone: Phone,
  system: Shield,
  systems: Shield,
  application: Zap,
  app: Zap,
  apps: Zap,
  bank: Building2,
  email: Mail,
  social: Share2,
  sms: Mail,
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
  },
  {
    title: 'Báo cáo cộng đồng',
    description: 'Gửi báo cáo kèm bằng chứng để cảnh báo sớm cho cộng đồng.',
    href: '/report',
    icon: FileText,
  },
  {
    title: 'AI Scanner',
    description: 'Phân tích tin nhắn, website nghi ngờ bằng mô hình AI hỗ trợ.',
    href: '/ai',
    icon: Zap,
  },
  {
    title: 'Hướng dẫn an toàn',
    description: 'Quy trình xử lý khi gặp lừa đảo và cách bảo vệ tài khoản.',
    href: '/report-guide',
    icon: BarChart3,
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
      <Shield className="h-3.5 w-3.5" />
      Đang theo dõi
    </span>
  );
}

function getCategoryIcon(slug: string) {
  return categoryIconMap[slug] || Shield;
}

function getInsightBadgeClasses(risk: RiskLevel) {
  switch (risk) {
    case 'scam':
      return 'border-danger/20 bg-danger/10 text-danger';
    case 'suspicious':
      return 'border-warning/20 bg-warning/10 text-warning';
    case 'safe':
      return 'border-success/20 bg-success/10 text-success';
    default:
      return 'border-primary/20 bg-primary/10 text-primary';
  }
}

function getInsightLabel(risk: RiskLevel) {
  switch (risk) {
    case 'scam':
      return 'Rủi ro cao';
    case 'suspicious':
      return 'Cần chú ý';
    case 'safe':
      return 'Ổn định';
    default:
      return 'Theo dõi';
  }
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
    <div className="flex min-h-screen flex-col bg-[#f6f8fb] dark:bg-slate-950">
      <Navbar />

      <main className="flex-1 bg-[#f6f8fb] pb-24 pt-20 dark:bg-slate-950 md:pb-8">
        <div className="home-shell home-flow">
          <section className="home-card home-hero">
            <div className="home-hero-grid">
              <div className="card-stack-lg">
                <div className="space-y-4">
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    <Sparkles className="h-3.5 w-3.5" />
                    {t('home.ai_powered')}
                  </span>
                  <h1 className="max-w-xl text-[32px] font-semibold leading-[1.15] text-text-main">
                    {t('home.title')}
                  </h1>
                  <p className="max-w-xl text-sm leading-6 text-text-secondary">{t('home.subtitle')}</p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {heroHighlights.map((item) => (
                    <div key={item.title} className="rounded-2xl border border-bg-border/70 bg-white/80 p-4 dark:bg-slate-900/40">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-primary dark:bg-slate-800">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <p className="text-sm font-semibold text-text-main">{item.title}</p>
                      <p className="mt-1 text-xs leading-5 text-text-muted">{item.description}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <Link
                    href="/report"
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
                  >
                    Báo cáo lừa đảo
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="home-search-panel card-stack-lg">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Hero Search</p>
                  <h2 className="text-[20px] font-semibold text-text-main">Tra cứu nhanh</h2>
                  <p className="text-sm leading-6 text-text-secondary">
                    Tập trung vào một hành động chính: nhập thực thể nghi ngờ và kiểm tra ngay.
                  </p>
                </div>

                <form onSubmit={handleHeroSearchSubmit} className="card-stack">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
                    <input
                      type="text"
                      value={heroSearchValue}
                      onChange={(e) => setHeroSearchValue(e.target.value)}
                      placeholder={heroSearchPlaceholders[heroSearchType]}
                      className="h-14 w-full rounded-2xl border border-bg-border bg-white pl-12 pr-4 text-sm text-text-main outline-none transition focus:border-primary dark:bg-slate-950/50"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {heroSearchTypes.map((type) => (
                      <button
                        key={type.key}
                        type="button"
                        onClick={() => setHeroSearchType(type.key)}
                        className={cn(
                          'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-colors',
                          heroSearchType === type.key
                            ? 'border-primary/30 bg-primary/10 text-primary'
                            : 'border-bg-border bg-white text-text-secondary hover:bg-slate-50 dark:bg-slate-950/50 dark:hover:bg-slate-900'
                        )}
                      >
                        <type.Icon className="h-4 w-4" />
                        {type.label}
                      </button>
                    ))}
                  </div>

                  <Button type="submit" variant="primary" size="md" className="h-12 w-full justify-center rounded-xl">
                    {t('home.search_button')}
                  </Button>
                </form>
              </div>
            </div>
          </section>

          <section className="home-card card-stack-lg">
            <div className="space-y-2">
              <h2 className="text-[20px] font-semibold text-text-main">Quick Actions</h2>
              <p className="text-sm leading-6 text-text-secondary">
                Các điểm vào quan trọng được gom về một hệ card thống nhất, không còn CTA thừa.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {featureCards.map((feature) => (
                <Link key={feature.title} href={feature.href} className="group block h-full">
                  <article className="flex h-full flex-col rounded-2xl border border-bg-border/70 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm dark:bg-slate-950/40">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-primary dark:bg-slate-800">
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-semibold text-text-main">{feature.title}</p>
                    <p className="mt-2 text-sm leading-6 text-text-secondary">{feature.description}</p>
                  </article>
                </Link>
              ))}
            </div>
          </section>

          <section className="home-card card-stack-lg">
            <div className="space-y-2">
              <h2 className="text-[20px] font-semibold text-text-main">Statistics</h2>
              <p className="text-sm leading-6 text-text-secondary">
                Cấu trúc grid chặt hơn để số liệu và danh mục luôn cân bằng trên mọi breakpoint.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {alertStats.map((stat) => (
                <div key={stat.label} className="flex h-full min-h-[156px] flex-col rounded-2xl border border-bg-border/70 bg-white p-4 dark:bg-slate-950/40">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-primary dark:bg-slate-800">
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold text-text-main">{stat.label}</p>
                  <p className="mt-2 text-[28px] font-semibold leading-none text-text-main">
                    {Number(stat.value || 0).toLocaleString('vi-VN')}
                  </p>
                  <p className="mt-auto pt-3 text-xs leading-5 text-text-muted">{stat.description}</p>
                </div>
              ))}
            </div>

            <div className="category-grid">
              {statsCategories.map((category) => {
                const Icon = getCategoryIcon(category.slug);

                return (
                  <Link key={category.slug} href={`/search?category=${category.slug}`} className="block h-full">
                    <article className="flex h-full flex-col rounded-2xl border border-bg-border/70 bg-white p-4 transition-colors hover:bg-slate-50 dark:bg-slate-950/40 dark:hover:bg-slate-900">
                      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-primary dark:bg-slate-800">
                        <Icon className="h-4 w-4" />
                      </div>
                      <p className="line-clamp-1 text-sm font-semibold text-text-main">{category.name}</p>
                      <p className="mt-2 text-xl font-semibold text-text-main">
                        {shouldShowCategoryCount ? category.count.toLocaleString('vi-VN') : '--'}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-text-muted">
                        {category.description || 'Dữ liệu được cập nhật thường xuyên'}
                      </p>
                    </article>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="home-main-grid">
            <div className="home-card card-stack-lg">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <h2 className="text-[20px] font-semibold text-text-main">Recent Scam Reports</h2>
                  <p className="text-sm leading-6 text-text-secondary">
                    Danh sách cảnh báo được làm gọn thành các hàng card rõ ràng, đọc nhanh và ít nhiễu hơn.
                  </p>
                </div>
                <Link
                  href="/report-lua-dao"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
                >
                  Xem tất cả
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="flex flex-wrap gap-2">
                {['all', 'phone', 'website', 'bank'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={cn(
                      'rounded-full border px-4 py-2 text-xs font-semibold transition-colors',
                      activeFilter === filter
                        ? 'border-primary/30 bg-primary/10 text-primary'
                        : 'border-bg-border bg-white text-text-secondary hover:bg-slate-50 dark:bg-slate-950/40 dark:hover:bg-slate-900'
                    )}
                  >
                    {t(`home.filter.${filter}`)}
                  </button>
                ))}
              </div>

              {showEmptyAlerts ? (
                <div className="rounded-2xl border border-dashed border-bg-border bg-white p-6 text-center dark:bg-slate-950/40">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-primary dark:bg-slate-800">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold text-text-main">Chưa có cảnh báo mới</p>
                  <p className="mt-1 text-xs leading-5 text-text-muted">
                    Hãy gửi báo cáo hoặc tra cứu để góp phần bảo vệ cộng đồng.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alertsToShow.map((alert: any) => {
                    const alertValue = alert.domain || alert.value;
                    const alertIcon = getIconUrl(alert);

                    return (
                      <Link key={alert.id} href={`/detail/${alert.type}/${encodeURIComponent(alertValue)}`}>
                        <article className="rounded-2xl border border-bg-border/70 bg-white p-4 transition-colors hover:bg-slate-50 dark:bg-slate-950/40 dark:hover:bg-slate-900">
                          <div className="grid gap-4 md:grid-cols-[minmax(0,1.5fr)_110px_96px_auto] md:items-center">
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
                                <p className="truncate font-mono text-sm font-semibold text-text-main">{alertValue}</p>
                                <p className="mt-1 text-xs leading-5 text-text-muted">
                                  {String(alert.type || 'website').toUpperCase()}
                                </p>
                              </div>
                            </div>

                            <div>
                              <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Báo cáo</p>
                              <p className="mt-1 text-sm font-semibold text-text-main">
                                {Number(alert.reports || 0).toLocaleString('vi-VN')}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Ngày</p>
                              <p className="mt-1 text-sm font-semibold text-text-main">{alert.date || '—'}</p>
                            </div>

                            <div className="md:justify-self-end">{renderRiskBadge(alert.status)}</div>
                          </div>
                        </article>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {trustedSection}
          </section>

          <section className="home-secondary-grid">
            <div className="home-card card-stack-lg">
              <div className="space-y-2">
                <h2 className="text-[20px] font-semibold text-text-main">Trends</h2>
                <p className="text-sm leading-6 text-text-secondary">
                  Gom các tín hiệu đang nổi lên vào một cụm gọn hơn để bố cục giữ được nhịp cân bằng.
                </p>
              </div>

              <div className="card-stack">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Trending scams</p>
                  {mockTrendingScams.length > 0 ? (
                    <div className="space-y-3">
                      {mockTrendingScams.slice(0, 4).map((scam) => (
                        <Link
                          key={scam.id}
                          href={`/search?q=${encodeURIComponent(scam.name ?? scam.value)}`}
                          className="flex items-center gap-3 rounded-2xl border border-bg-border/70 bg-white p-3 transition-colors hover:bg-slate-50 dark:bg-slate-950/40 dark:hover:bg-slate-900"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-base text-primary dark:bg-slate-800">
                            {scam.image}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-1 text-sm font-semibold text-text-main">{scam.name}</p>
                            <p className="mt-1 text-xs leading-5 text-text-muted">
                              {scam.reports.toLocaleString('vi-VN')} báo cáo
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-2xl border border-dashed border-bg-border bg-white p-4 text-sm text-text-muted dark:bg-slate-950/40">
                      Chưa có dữ liệu thịnh hành.
                    </p>
                  )}
                </div>

                <div className="h-px bg-bg-border/70" />

                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Search trends</p>
                  <div className="space-y-3">
                    {searchInsights.map((insight) => {
                      const InsightIcon = insight.Icon;

                      return (
                        <article key={insight.title} className="flex items-center justify-between gap-3 rounded-2xl border border-bg-border/70 bg-white p-3 dark:bg-slate-950/40">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-primary dark:bg-slate-800">
                              <InsightIcon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-text-main">{insight.title}</p>
                              <p className="mt-1 text-xs leading-5 text-text-muted">{insight.subtitle}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={cn('inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold', getInsightBadgeClasses(insight.risk))}>
                              {getInsightLabel(insight.risk)}
                            </span>
                            <p className="mt-2 text-xs font-semibold text-text-main">{insight.value}</p>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="home-card card-stack">
              <div className="space-y-2">
                <h2 className="text-[20px] font-semibold text-text-main">Community Tips</h2>
                <p className="text-sm leading-6 text-text-secondary">
                  Mẹo ngắn, trọng tâm rõ và cùng một ngôn ngữ thẻ để giảm cảm giác rời rạc.
                </p>
              </div>

              <div className="card-stack">
                {communityTips.map((tip) => (
                  <article key={tip.title} className="flex gap-3 rounded-2xl border border-bg-border/70 bg-white p-4 dark:bg-slate-950/40">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-primary dark:bg-slate-800">
                      <tip.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-main">{tip.title}</p>
                      <p className="mt-1 text-xs leading-5 text-text-secondary">{tip.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="home-card home-card-accent">
            <div className="grid gap-6 md:grid-cols-[1fr_360px] md:items-center">
              <div className="space-y-2">
                <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Alert Subscription
                </span>
                <h2 className="text-[20px] font-semibold text-text-main">{t('home.newsletter')}</h2>
                <p className="text-sm leading-6 text-text-secondary">{t('home.newsletter_desc')}</p>
              </div>

              {isSubscribed ? (
                <div className="inline-flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-semibold text-success">
                  <CheckCircle className="h-5 w-5" />
                  {t('home.newsletter_success')}
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="card-stack">
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                    <input
                      type="email"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder={t('home.newsletter_placeholder')}
                      className="h-12 w-full rounded-xl border border-bg-border bg-white pl-10 pr-3 text-sm text-text-main outline-none transition focus:border-primary dark:bg-slate-950/40"
                      required
                    />
                  </div>
                  <Button type="submit" variant="primary" size="md" className="h-12 w-full justify-center rounded-xl">
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

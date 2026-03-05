'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Shield,
  AlertTriangle,
  CheckCircle,
  Phone,
  Building2,
  Globe,
  Wallet,
  ArrowRight,
  Clock,
  MessageCircle,
  Eye,
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
import { Button, Card, Tooltip } from '@/components/ui';
import { useI18n } from '@/contexts/I18nContext';
import { useToast } from '@/components/ui/Toast';
import { cn, getRiskGradient, type RiskLevel } from '@/lib/utils';
import {
  mockPopularSearches,
  mockTrendingScams,
  mockRecentAlerts,
  mockSearchHistory,
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

function SectionHeader({
  label,
  title,
  subtitle,
}: {
  label?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="section-header">
      {label && <span className="section-label">{label}</span>}
      <h2 className="section-title">{title}</h2>
      {subtitle && <p className="section-subtitle max-w-3xl">{subtitle}</p>}
    </div>
  );
}

const categoryVisual: Record<string, { icon: string; color: string }> = {
  website: { icon: '🌐', color: 'from-blue-500 to-blue-600' },
  organizations: { icon: '🏢', color: 'from-purple-500 to-purple-600' },
  devices: { icon: '📱', color: 'from-green-500 to-green-600' },
  systems: { icon: '🔒', color: 'from-red-500 to-red-600' },
  apps: { icon: '📲', color: 'from-orange-500 to-orange-600' },
  // New categories from tinnhiemmang.vn
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

type SearchInsight = {
  title: string;
  subtitle: string;
  hint: string;
  value: string;
  risk: RiskLevel;
  Icon: React.ComponentType<{ className?: string }>;
};

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

export default function HomeClient({ trustedSection }: HomeClientProps) {
  const { t } = useI18n();
  const router = useRouter();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

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
    // New categories from tinnhiemmang.vn
    'phone',
    'bank',
    'email',
    'social',
    'sms',
  ]);

  const primaryCategories = useMemo(
    () => uniqueCategories.filter((category) => primaryCategorySlugs.has(category.slug)),
    [uniqueCategories]
  );

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

  const searchBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Try to fetch from /api/scams?stats=true first (real data from tinnhiemmang.vn)
        const statsResponse = await fetch('/api/scams?stats=true');
        const statsData = await statsResponse.json();
        
        if (statsData.success && statsData.data && statsData.data.length > 0) {
          // Map the scam stats data to category format
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
        
        // Fallback to /api/stats
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

  // Fetch scam data from /api/scams
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setShowSearchHistory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredAlerts =
    activeFilter === 'all'
      ? (scamData.length > 0 ? scamData : mockRecentAlerts)
      : (scamData.length > 0 ? scamData : mockRecentAlerts).filter((alert: any) => {
          // Handle both mock data (type=website/web/phone/bank) and real API data (type=web)
          // Map 'web' to 'website' for consistency
          const alertType = alert.type === 'web' ? 'website' : alert.type;
          return alertType === activeFilter;
        });

  const dedupedAlerts = useMemo(() => {
    const seen = new Set<string>();
    return filteredAlerts.filter((alert: any) => {
      // Use domain for scamData from API, value for mock data
      const key = alert.domain || alert.value;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }, [filteredAlerts]);

  const displayedAlerts = dedupedAlerts.slice(0, 4);
  const fallbackAlerts = mockRecentAlerts.slice(0, 4);
  const alertsToShow = displayedAlerts.length ? displayedAlerts : fallbackAlerts;
  const showEmptyAlerts = alertsToShow.length === 0;
  const alertStats = useMemo(() => {
    // Use real data from /api/scams if available, otherwise use mock
    const data = scamData.length > 0 ? scamData : mockRecentAlerts;
    const total = scamStats.total > 0 ? scamStats.total : data.length;
    const websites = scamStats.websites > 0 ? scamStats.websites : data.filter((alert) => alert.type === 'web' || alert.type === 'website').length;
    const phones = scamStats.phones > 0 ? scamStats.phones : data.filter((alert) => alert.type === 'phone').length;
    const banks = scamStats.banks > 0 ? scamStats.banks : data.filter((alert) => alert.type === 'bank').length;
    return [
      { label: 'Tổng báo cáo', value: total, icon: AlertTriangle },
      { label: 'Website', value: websites, icon: Globe },
      { label: 'Điện thoại', value: phones, icon: Phone },
      { label: 'Ngân hàng', value: banks, icon: Building2 },
    ];
  }, [scamData, scamStats]);

  const shouldShowCategoryCount = !statsLoading && uniqueCategories.length > 0;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      showToast('warning', t('home.search_placeholder'));
      return;
    }

    setIsSearching(true);
    setShowSearchHistory(false);

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleHistoryClick = (term: string) => {
    setSearchQuery(term);
    router.push(`/search?q=${encodeURIComponent(term)}`);
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'phone':
        return Phone;
      case 'bank':
        return Building2;
      case 'website':
      case 'web': // legacy mapping
        return Globe;
      case 'crypto':
        return Wallet;
      default:
        return AlertTriangle;
    }
  };

  const renderStatusBadge = (status?: string) => {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'trusted' || normalized === 'safe') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-success/10 text-success border border-success/30">
          <CheckCircle className="w-3.5 h-3.5" />
          Đã xác minh
        </span>
      );
    }
    if (normalized === 'confirmed' || normalized === 'blocked' || normalized === 'scam' || normalized === 'high') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-danger/10 text-danger border border-danger/30">
          <AlertTriangle className="w-3.5 h-3.5" />
          Đã xác nhận
        </span>
      );
    }
    if (normalized === 'suspected' || normalized === 'warning' || normalized === 'investigating' || normalized === 'processing' || normalized === 'medium') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-warning/10 text-warning border border-warning/30">
          <Clock className="w-3.5 h-3.5" />
          Đang xử lý
        </span>
      );
    }
    return null;
  };

  const getIconUrl = (alert: any) => {
    if (alert.sourceIcon || alert.icon) return alert.sourceIcon || alert.icon;
    const domain = alert.domain || alert.value || alert.name || '';
    if (domain) {
      return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
    }
    return 'https://tinnhiemmang.vn/img/icon_web2.png';
  };

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

  return (
    <div className="min-h-screen flex flex-col bg-bg-main">
      <Navbar />

      <main className="flex-1 pt-16 md:pt-20 pb-20 md:pb-0">
        <section className="mobile-section border-b border-bg-border bg-gradient-to-b from-primary/5 via-bg-main to-bg-main py-6 md:py-14">
          <div className="mobile-container mx-auto max-w-[420px] px-4 md:max-w-7xl md:px-8">
            <div className="grid lg:grid-cols-[1.25fr_1fr] gap-4 md:gap-8 items-stretch">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="space-y-3 md:space-y-6"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
                  <Sparkles className="w-4 h-4" />
                  {t('home.ai_powered')}
                </div>

                <h1 className="text-xl md:text-5xl font-bold text-text-main leading-snug md:leading-tight">
                  {t('home.title')}
                </h1>

                <p className="text-xs md:text-lg text-text-secondary max-w-2xl leading-relaxed">
                  {t('home.subtitle')}
                </p>

                <div ref={searchBoxRef} className="relative">
                  <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowSearchHistory(e.target.value.length === 0);
                      }}
                      onFocus={() => setShowSearchHistory(searchQuery.length === 0)}
                      placeholder={t('home.search_placeholder')}
                      className="w-full h-11 pl-11 pr-24 bg-bg-card border border-bg-border rounded-xl text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary"
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-4 rounded-xl"
                      isLoading={isSearching}
                    >
                      {t('home.search_button')}
                    </Button>
                  </form>

                  <AnimatePresence>
                    {showSearchHistory && mockSearchHistory.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-bg-card border border-bg-border rounded-card shadow-lg overflow-hidden z-30"
                      >
                        <div className="p-3 border-b border-bg-border">
                          <p className="text-sm text-text-muted">{t('home.recent_searches')}</p>
                        </div>
                        {mockSearchHistory.map((term, i) => (
                          <button
                            key={i}
                            onClick={() => handleHistoryClick(term)}
                            className="w-full px-4 py-2 text-left text-text-main hover:bg-bg-cardHover transition-colors flex items-center gap-2"
                          >
                            <Clock className="w-4 h-4 text-text-muted" />
                            {term}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div>
                  <p className="text-sm text-text-muted mb-2">{t('home.popular_searches')}</p>
                  <div className="flex flex-wrap gap-2">
                    {mockPopularSearches.map((item, i) => (
                      <Link
                        key={i}
                        href={`/search?q=${encodeURIComponent(item.value)}`}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                          item.risk === 'scam'
                            ? 'bg-danger/10 text-danger hover:bg-danger/15'
                            : item.risk === 'suspicious'
                              ? 'bg-warning/10 text-warning hover:bg-warning/15'
                              : 'bg-success/10 text-success hover:bg-success/15'
                        )}
                      >
                        {item.value}
                      </Link>
                    ))}
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05 }}
                className="grid grid-cols-2 gap-4"
              >
                {featureCards.map((feature) => (
                  <Link key={feature.title} href={feature.href}>
                    <Card hover className="h-full text-center flex flex-col items-center shadow-none bg-bg-card/70 border border-bg-border/40 p-3 md:p-5 rounded-xl">
                      <p className="w-full text-center font-semibold text-text-main text-xs md:text-base leading-tight min-h-[2.25rem] flex items-end justify-center">
                        {feature.title}
                      </p>
                      <div
                        style={{ background: feature.color }}
                        className="w-[72%] max-w-[7.25rem] h-10 rounded-xl my-2 mx-auto flex items-center justify-center text-white shadow-sm"
                      >
                        <feature.icon className="w-8 h-8" />
                      </div>
                    </Card>
                  </Link>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.35 }}
          className="mobile-section py-6 md:py-12"
        >
          <div className="mobile-container mx-auto max-w-[420px] px-4 md:max-w-7xl md:px-8">
            <div className="section-stack">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
                {uniqueCategories.map((category) => {
                  const visual = categoryVisual[category.slug] || { icon: '🛡️', color: 'from-slate-500 to-slate-600' };
                  return (
                    <Link key={category.slug} href={`/search?category=${category.slug}`}>
                      <Card hover className="h-full text-center p-3 md:p-5 rounded-xl border border-bg-border/50 bg-bg-card/70">
                        <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br mx-auto mb-3 flex items-center justify-center text-xl shadow-sm', visual.color)}>
                          {visual.icon}
                        </div>
                        <p className="font-semibold text-text-main text-sm">{category.name}</p>
                        <p className="text-lg font-mono font-bold text-primary mt-1">
                          {shouldShowCategoryCount ? category.count.toLocaleString('vi-VN') : '--'}
                        </p>
                        <p className="text-[0.7rem] text-text-muted mt-1 line-clamp-2">
                          {category.description || 'Dữ liệu được cập nhật thường xuyên'}
                        </p>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.35 }}
          className="mobile-section bg-bg-card/45 border-y border-bg-border py-6 md:py-12"
        >
          <div className="mobile-container mx-auto max-w-[420px] px-4 md:max-w-7xl md:px-8 md:py-12">
            <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-4 md:gap-6 lg:gap-10">
              <div className="section-stack">
                <Card className="p-4 md:p-7 space-y-3 md:space-y-4 bg-white/80 dark:bg-[#0c1221]/70">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                    {alertStats.map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-xl border border-bg-border/60 bg-bg-card/70 p-3 flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                          <stat.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs text-text-muted">{stat.label}</p>
                          <p className="text-base font-semibold text-text-main">{stat.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2 md:gap-3 md:flex-nowrap md:overflow-x-auto md:pb-1 md:scrollbar-hide">
                    {['all', 'phone', 'website', 'bank'].map((filter) => (
                      <Tooltip
                        key={filter}
                        label={`Lọc ${t(`home.filter.${filter}`)} báo cáo`}
                        position="bottom"
                      >
                        <button
                          onClick={() => setActiveFilter(filter)}
                          className={cn(
                            'px-4 py-2 rounded-full text-xs md:text-sm font-medium whitespace-nowrap border transition-colors duration-200',
                            activeFilter === filter
                              ? 'bg-primary/15 text-primary border-primary/30'
                              : 'bg-bg-card/70 text-text-secondary border-subtle hover:bg-bg-cardHover'
                          )}
                        >
                          {t(`home.filter.${filter}`)}
                        </button>
                      </Tooltip>
                    ))}
                  </div>

                  {showEmptyAlerts ? (
                    <div className="rounded-xl border border-dashed border-bg-border/80 bg-bg-card/60 p-6 text-center space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text-main">Chưa có cảnh báo mới</p>
                        <p className="text-xs text-text-muted mt-1">
                          Hãy gửi báo cáo hoặc tra cứu để góp phần bảo vệ cộng đồng.
                        </p>
                      </div>
                      <div className="flex flex-wrap justify-center gap-2">
                        <Link
                          href="/report"
                          className="px-4 py-2 rounded-full bg-primary text-white text-xs font-semibold shadow-sm"
                        >
                          Tạo báo cáo
                        </Link>
                        <Link
                          href="/search"
                          className="px-4 py-2 rounded-full border border-bg-border text-xs font-semibold text-text-main hover:bg-bg-cardHover"
                        >
                          Tra cứu ngay
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {alertsToShow.map((alert: any) => {
                        const TypeIcon = getTypeIcon(alert.type);
                        const alertValue = alert.domain || alert.value;
                        const alertIcon = getIconUrl(alert);
                        return (
                          <Link key={alert.id} href={`/detail/${alert.type}/${encodeURIComponent(alertValue)}`}>
                            <Card hover className="p-3 md:p-4 bg-bg-card/70 rounded-xl">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 overflow-hidden">
                                    <img
                                      src={alertIcon}
                                      alt={alertValue}
                                      className="w-full h-full object-cover"
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
                                    <p className="font-mono font-semibold text-text-main truncate">{alertValue}</p>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {renderStatusBadge(alert.status)}
                                      <p className="text-sm text-text-secondary line-clamp-1">{alert.description}</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 text-[0.7rem] md:text-xs text-text-muted shrink-0">
                                  <Tooltip label="Số lượt xem" position="top">
                                    <span className="flex items-center gap-1">
                                      <Eye className="w-3.5 h-3.5" />
                                      {(alert.views ?? alert.reports ?? 0).toLocaleString('vi-VN')}
                                    </span>
                                  </Tooltip>
                                  <Tooltip label="Bình luận cộng đồng" position="top">
                                    <span className="flex items-center gap-1">
                                      <MessageCircle className="w-3.5 h-3.5" />
                                      {alert.comments ?? (alert.reports != null ? Math.floor(alert.reports / 10) : 0)}
                                    </span>
                                  </Tooltip>
                                  <Tooltip label="Thời gian cập nhật" position="top">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3.5 h-3.5" />
                                      {alert.date ?? '—'}
                                    </span>
                                  </Tooltip>
                                </div>
                              </div>
                            </Card>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </div>

              <div className="space-y-4">
                {trustedSection}

                <Card className="space-y-4 p-4 md:p-5 rounded-xl border border-bg-border/60 bg-bg-card/70 shadow-none md:shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base md:text-lg font-semibold text-text-main">{t('home.trending_scams')}</h3>
                    <Tooltip label="Bảng xếp hạng các scam nóng" position="bottom">
                      <Info className="w-4 h-4 text-text-muted" />
                    </Tooltip>
                  </div>
                  <div className="space-y-3">
                    {mockTrendingScams.slice(0, 5).map((scam) => (
                      <Tooltip
                        key={scam.id}
                        label={`${scam.reports.toLocaleString('vi-VN')} báo cáo`}
                        position="top"
                      >
                        <Link
                          href={`/search?q=${encodeURIComponent(scam.name ?? scam.value)}`}
                          className="card-feed flex items-center gap-3 rounded-xl border border-bg-border/60 bg-bg-card/60 p-3 transition-colors hover:bg-bg-cardHover group"
                        >
                          <div className="w-9 h-9 rounded-xl bg-bg-cardHover flex items-center justify-center text-lg shrink-0">
                            {scam.image}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-text-main font-medium line-clamp-1 group-hover:text-primary transition-colors">
                              {scam.name}
                            </p>
                            <p className="text-[0.7rem] md:text-xs text-text-muted mt-1">
                              {scam.reports.toLocaleString('vi-VN')} báo cáo
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-primary shrink-0" />
                        </Link>
                      </Tooltip>
                    ))}
                  </div>
                </Card>

                <Card className="space-y-4 p-4 md:p-5 rounded-xl border border-bg-border/60 bg-bg-card/70 shadow-none md:shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base md:text-lg font-semibold text-text-main">Dữ liệu tìm kiếm</h3>
                    <Tooltip label="Thống kê từ khóa, nguồn tìm kiếm" position="bottom">
                      <Info className="w-5 h-5 text-text-muted" />
                    </Tooltip>
                  </div>
                  <div className="grid gap-3">
                    {searchInsights.map((insight) => {
                      const InsightIcon = insight.Icon;
                      return (
                        <Tooltip key={insight.title} label={insight.hint} position="top">
                          <div className="card-feed flex items-center justify-between gap-3 rounded-xl border border-bg-border/60 bg-bg-card/60 p-3">
                            <div className="flex items-center gap-4">
                              <div
                                className={cn(
                                  'w-9 h-9 rounded-xl text-white flex items-center justify-center shadow-inner',
                                  `bg-gradient-to-br ${getRiskGradient(insight.risk)}`
                                )}
                              >
                                <InsightIcon className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-text-main">{insight.title}</p>
                                <p className="text-[0.7rem] md:text-xs text-text-muted mt-1">{insight.subtitle}</p>
                              </div>
                            </div>
                            <span className="text-sm font-bold text-text-main">{insight.value}</span>
                          </div>
                        </Tooltip>
                      );
                    })}
                  </div>
                </Card>

                <Card className="space-y-4 p-4 md:p-5 rounded-xl border border-bg-border/60 bg-bg-card/70 shadow-none md:shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base md:text-lg font-semibold text-text-main">Góc cộng đồng</h3>
                    <span className="text-[0.65rem] md:text-xs uppercase tracking-wider text-text-muted">Tips tiện ích</span>
                  </div>
                  <div className="space-y-3">
                    {communityTips.map((tip) => (
                      <div key={tip.title} className="card-feed flex gap-3 rounded-xl border border-bg-border/60 bg-bg-card/60 p-3 text-sm text-text-main">
                        <tip.icon className="w-4 h-4 text-primary mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold">{tip.title}</p>
                          <p className="text-[0.7rem] md:text-xs text-text-secondary mt-1">{tip.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.35 }}
          className="mobile-section"
        >
          <div className="mobile-container max-w-7xl mx-auto md:px-8 md:py-12">
            <Card className="p-6 md:p-8 bg-gradient-to-br from-primary/10 via-bg-card/90 to-blue-500/10 border border-subtle">
              <div className="grid md:grid-cols-[1fr_auto] gap-6 items-center">
                <div className="space-y-3">
                  <span className="section-label">Nhận cảnh báo</span>
                  <h3 className="text-xl md:text-2xl font-bold text-text-main">{t('home.newsletter')}</h3>
                  <p className="text-text-secondary">{t('home.newsletter_desc')}</p>
                </div>

                <AnimatePresence mode="wait">
                  {isSubscribed ? (
                    <motion.div
                      key="subscribed"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="inline-flex items-center gap-2 text-success font-medium"
                    >
                      <CheckCircle className="w-5 h-5" />
                      {t('home.newsletter_success')}
                    </motion.div>
                  ) : (
                    <motion.form
                      key="form"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      onSubmit={handleNewsletterSubmit}
                      className="flex flex-col gap-3 w-full md:w-auto"
                    >
                      <div className="relative w-full sm:w-[320px]">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input
                          type="email"
                          value={newsletterEmail}
                          onChange={(e) => setNewsletterEmail(e.target.value)}
                          placeholder={t('home.newsletter_placeholder')}
                          className="w-full h-12 pl-10 pr-3 rounded-button border border-subtle bg-bg-card text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary"
                          required
                        />
                      </div>
                      <Button type="submit" variant="primary" size="md" className="w-full sm:w-auto">
                        {t('home.newsletter_button')}
                      </Button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </Card>
          </div>
        </motion.section>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}

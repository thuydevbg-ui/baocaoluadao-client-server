'use client';

import React, { useEffect, useRef, useState } from 'react';
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
} from 'lucide-react';
import { Navbar, MobileNav, Footer } from '@/components/layout';
import { Button, Card } from '@/components/ui';
import { useI18n } from '@/contexts/I18nContext';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import {
  mockPopularSearches,
  mockTrendingScams,
  mockSafetyTips,
  mockRecentAlerts,
  mockSearchHistory,
} from '@/lib/mockData';

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

function AnimatedCounter({ value }: { value: string }) {
  const [displayValue, setDisplayValue] = useState('0');
  const numericValue = parseFloat(value.replace(/[^0-9.]/g, ''));
  const isFormatted = value.includes('K') || value.includes('M') || value.includes('$');

  useEffect(() => {
    if (isFormatted) {
      setDisplayValue(value);
      return;
    }

    let start = 0;
    const duration = 1200;
    const increment = numericValue / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= numericValue) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start).toLocaleString('vi-VN'));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value, numericValue, isFormatted]);

  return <span>{displayValue}</span>;
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6 md:mb-8">
      <h2 className="text-2xl md:text-3xl font-bold text-text-main">{title}</h2>
      {subtitle && <p className="text-text-secondary mt-2 max-w-3xl">{subtitle}</p>}
    </div>
  );
}

const categoryVisual: Record<string, { icon: string; color: string }> = {
  websites: { icon: '🌐', color: 'from-blue-500 to-blue-600' },
  organizations: { icon: '🏢', color: 'from-purple-500 to-purple-600' },
  devices: { icon: '📱', color: 'from-green-500 to-green-600' },
  systems: { icon: '🔒', color: 'from-red-500 to-red-600' },
  apps: { icon: '📲', color: 'from-orange-500 to-orange-600' },
};

export default function HomePage() {
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

  const searchBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchData() {
      try {
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
      ? mockRecentAlerts
      : mockRecentAlerts.filter((alert) => alert.type === activeFilter);

  const getCategoryCount = (slug: string) => categories.find((category) => category.slug === slug)?.count ?? 0;
  const shouldShowCategoryCount = !statsLoading && categories.length > 0;

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
        return Globe;
      case 'crypto':
        return Wallet;
      default:
        return AlertTriangle;
    }
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

  const overviewCards = [
    { slug: 'websites', label: 'Website', icon: Globe, tone: 'bg-blue-500/10 text-blue-600' },
    { slug: 'organizations', label: 'Tổ chức', icon: Building2, tone: 'bg-green-500/10 text-green-600' },
    { slug: 'devices', label: 'Thiết bị', icon: Phone, tone: 'bg-purple-500/10 text-purple-600' },
    { slug: 'systems', label: 'Hệ thống', icon: Shield, tone: 'bg-amber-500/10 text-amber-600' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-bg-main">
      <Navbar />

      <main className="flex-1 pt-16 md:pt-20 pb-20 md:pb-0">
        <section className="border-b border-bg-border bg-gradient-to-b from-primary/10 via-bg-main to-bg-main">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-14">
            <div className="grid lg:grid-cols-[1.25fr_1fr] gap-6 md:gap-8 items-stretch">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="space-y-5"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
                  <Sparkles className="w-4 h-4" />
                  {t('home.ai_powered')}
                </div>

                <h1 className="text-3xl md:text-5xl font-bold text-text-main leading-tight">
                  {t('home.title')}
                </h1>

                <p className="text-base md:text-lg text-text-secondary max-w-2xl">
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
                      className="w-full h-14 pl-12 pr-32 bg-bg-card border border-bg-border rounded-card text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary"
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
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
                className="grid grid-cols-2 gap-3"
              >
                {featureCards.map((feature) => (
                  <Link key={feature.title} href={feature.href}>
                    <Card hover className="h-full p-4 text-center flex flex-col items-center">
                      <p className="w-full text-center font-semibold text-text-main text-sm md:text-base leading-tight min-h-[2.5rem] flex items-end justify-center">
                        {feature.title}
                      </p>
                      <div
                        style={{ background: feature.color }}
                        className="w-[72%] max-w-[7.25rem] h-14 rounded-2xl my-2 mx-auto flex items-center justify-center text-white shadow-lg"
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

        <section className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-12">
          <SectionHeader
            title="Kho dữ liệu cảnh báo"
            subtitle={`Nguồn dữ liệu: ${dataSource}. Các danh mục được đồng bộ để bạn lọc và tra cứu nhanh.`}
          />

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((category) => {
              const visual = categoryVisual[category.slug] || { icon: '🛡️', color: 'from-slate-500 to-slate-600' };
              return (
                <Link key={category.slug} href={`/search?category=${category.slug}`}>
                  <Card hover className="h-full text-center p-4">
                    <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br mx-auto mb-3 flex items-center justify-center text-2xl shadow-lg', visual.color)}>
                      {visual.icon}
                    </div>
                    <p className="font-semibold text-text-main">{category.name}</p>
                    <p className="text-2xl font-mono font-bold text-primary mt-1">
                      {shouldShowCategoryCount ? category.count.toLocaleString('vi-VN') : '--'}
                    </p>
                    <p className="text-xs text-text-muted mt-1 line-clamp-2">
                      {category.description || 'Dữ liệu được cập nhật thường xuyên'}
                    </p>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="bg-bg-card/45 border-y border-bg-border">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-12">
            <div className="grid lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <div className="flex items-end justify-between gap-4 mb-4">
                  <h2 className="text-2xl md:text-3xl font-bold text-text-main">{t('home.recent_alerts')}</h2>
                  <Link href="/report" className="text-sm text-primary hover:underline flex items-center gap-1 shrink-0">
                    {t('home.view_all')} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
                  {['all', 'phone', 'website', 'bank'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                        activeFilter === filter ? 'bg-primary text-white' : 'bg-bg-card text-text-secondary hover:bg-bg-cardHover'
                      )}
                    >
                      {t(`home.filter.${filter}`)}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  {filteredAlerts.slice(0, 4).map((alert) => {
                    const TypeIcon = getTypeIcon(alert.type);
                    return (
                      <Link key={alert.id} href={`/detail/${alert.type}/${encodeURIComponent(alert.value)}`}>
                        <Card hover className="p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <TypeIcon className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-mono font-semibold text-text-main truncate">{alert.value}</p>
                                <p className="text-sm text-text-secondary line-clamp-1">{alert.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-text-muted shrink-0">
                              <span className="flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5" />
                                {alert.views ? alert.views.toLocaleString('vi-VN') : '0'}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageCircle className="w-3.5 h-3.5" />
                                {alert.comments ?? 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {alert.time ?? '—'}
                              </span>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="lg:col-span-5 space-y-4">
                <Card className="p-5">
                  <h3 className="text-lg font-semibold text-text-main mb-3">{t('home.trending_scams')}</h3>
                  <div className="space-y-3">
                    {mockTrendingScams.slice(0, 5).map((scam) => (
                      <Link
                        key={scam.id}
                        href={`/search?q=${encodeURIComponent(scam.name ?? scam.value)}`}
                        className="flex items-start gap-3 group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-bg-cardHover flex items-center justify-center text-lg shrink-0">
                          {scam.image}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-text-main font-medium line-clamp-1 group-hover:text-primary transition-colors">
                            {scam.name}
                          </p>
                          <p className="text-xs text-text-muted mt-0.5">
                            {scam.reports.toLocaleString('vi-VN')} báo cáo
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-primary shrink-0" />
                      </Link>
                    ))}
                  </div>
                </Card>

                <Card className="p-5">
                  <h3 className="text-lg font-semibold text-text-main mb-3">{t('home.safety_tips')}</h3>
                  <div className="space-y-3">
                    {mockSafetyTips.slice(0, 3).map((tip) => (
                      <div key={tip.id} className="p-3 rounded-xl bg-bg-cardHover/80 border border-bg-border/70">
                        <p className="text-sm font-medium text-text-main">{tip.title}</p>
                        <p className="text-xs text-text-secondary mt-1 line-clamp-2">{tip.description}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-12">
          <Card className="p-6 md:p-8 bg-gradient-to-r from-primary/10 to-blue-500/10 border-primary/30">
            <div className="grid md:grid-cols-[1fr_auto] gap-4 items-center">
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-text-main">{t('home.newsletter')}</h3>
                <p className="text-text-secondary mt-1">{t('home.newsletter_desc')}</p>
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
                    className="flex flex-col sm:flex-row gap-2 w-full md:w-auto"
                  >
                    <div className="relative w-full sm:w-[280px]">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input
                        type="email"
                        value={newsletterEmail}
                        onChange={(e) => setNewsletterEmail(e.target.value)}
                        placeholder={t('home.newsletter_placeholder')}
                        className="w-full h-11 pl-10 pr-3 rounded-button border border-bg-border bg-bg-card text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary"
                        required
                      />
                    </div>
                    <Button type="submit" variant="primary" size="sm">
                      {t('home.newsletter_button')}
                    </Button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </Card>
        </section>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}

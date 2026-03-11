'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, CheckCircle, Clock, Eye, Flag, MessageSquare, Shield, Star, Activity, ShieldAlert, BellRing, EyeOff } from 'lucide-react';
import { Navbar, MobileNav, Footer } from '@/components/layout';
import { cn } from '@/lib/utils';
import { useI18n } from '@/contexts/I18nContext';
import { mockRecentAlerts } from '@/lib/mockData';

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
  initialScams?: ScamData[];
  initialStats?: {
    total?: number;
    high?: number;
    watch?: number;
    views?: number;
  };
}

function renderRiskBadge(status?: string) {
  const normalized = (status || '').toLowerCase();

  if (normalized === 'confirmed' || normalized === 'blocked' || normalized === 'scam' || normalized === 'high') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-danger/25 bg-gradient-to-r from-danger/10 via-danger/5 to-transparent px-2.5 py-1 text-[11px] font-semibold text-danger shadow-[0_1px_6px_rgba(244,63,94,0.15)]">
        <AlertTriangle className="h-3.5 w-3.5" />
        Nguy cơ cao
      </span>
    );
  }

  if (normalized === 'suspected' || normalized === 'warning' || normalized === 'investigating' || normalized === 'processing' || normalized === 'medium') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-warning/25 bg-gradient-to-r from-warning/10 via-warning/5 to-transparent px-2.5 py-1 text-[11px] font-semibold text-warning shadow-[0_1px_6px_rgba(245,158,11,0.15)]">
        <Clock className="h-3.5 w-3.5" />
        Cảnh giác
      </span>
    );
  }

  if (normalized === 'trusted' || normalized === 'safe' || normalized === 'low') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-success/25 bg-gradient-to-r from-success/10 via-success/5 to-transparent px-2.5 py-1 text-[11px] font-semibold text-success shadow-[0_1px_6px_rgba(52,211,153,0.18)]">
        <CheckCircle className="h-3.5 w-3.5" />
        An toàn
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-bg-border bg-gradient-to-r from-slate-100 to-transparent px-2.5 py-1 text-[11px] font-semibold text-text-secondary shadow-[0_1px_4px_rgba(0,0,0,0.06)] dark:from-slate-800/60">
      <Shield className="h-3.5 w-3.5" />
      Đang theo dõi
    </span>
  );
}

function getWatermark(status?: string) {
  const normalized = (status || '').toLowerCase();
  if (['safe', 'trusted', 'low', 'clean', 'verified'].includes(normalized)) return null;

  if (['scam', 'high', 'blocked', 'confirmed'].includes(normalized)) {
    return { label: 'Nguy hiểm', className: 'bg-danger/15 border-danger/40 text-danger rotate-[-10deg]' };
  }

  return { label: 'Nghi vấn', className: 'bg-warning/20 border-warning/40 text-warning rotate-[-10deg]' };
}

function getIconUrl(alert: any) {
  if (alert.sourceIcon || alert.icon) return alert.sourceIcon || alert.icon;
  const domain = alert.domain || alert.value || alert.name || '';
  if (domain) {
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
  }
  return 'https://tinnhiemmang.vn/img/icon_web2.png';
}

function formatCompactNumber(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(abs >= 10_000_000_000 ? 0 : 1)}B`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}k`;
  return value.toString();
}

export default function HomeClient({ trustedSection, initialScams = [], initialStats }: HomeClientProps) {
  const { t } = useI18n();
  const [activeFilter, setActiveFilter] = useState('all');
  const [scamData, setScamData] = useState<ScamData[]>(initialScams);
  const PAGE_SIZE = 6;
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });

  useEffect(() => {
    if (initialScams.length > 0) return; // đã có dữ liệu server cung cấp, không fetch lại
    let cancelled = false;
    async function fetchScamData() {
      try {
        const normalizedType =
          activeFilter === 'all' ? '' : activeFilter === 'web' ? 'website' : activeFilter;
        const typeParam = normalizedType ? `&type=${encodeURIComponent(normalizedType)}` : '';
        const response = await fetch(`/api/scams?page=${page}&limit=${PAGE_SIZE}${typeParam}`, {
          cache: 'no-store',
        });
        const data = await response.json();
        if (!cancelled && data.success && data.data) {
          setScamData(data.data);
          if (data.pagination) {
            setPagination({
              page: data.pagination.page ?? page,
              limit: data.pagination.limit ?? PAGE_SIZE,
              total: data.pagination.total ?? 0,
              totalPages: data.pagination.totalPages ?? 1,
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch scam data:', error);
      }
    }
    fetchScamData();
    return () => {
      cancelled = true;
    };
  }, [initialScams.length, activeFilter, page]);

  const baseAlerts = scamData.length > 0 ? scamData : mockRecentAlerts;
  const filteredAlerts =
    activeFilter === 'all'
      ? baseAlerts
      : baseAlerts.filter((alert: any) => {
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

  const alertsSource = dedupedAlerts.length ? dedupedAlerts : mockRecentAlerts;
  const totalPages = Math.max(1, pagination.totalPages || 1);
  const safePage = Math.min(page, totalPages);
  const alertsToShow = alertsSource;
  const showEmptyAlerts = alertsSource.length === 0;
  const dataset = scamData.length > 0 ? scamData : initialScams.length > 0 ? initialScams : mockRecentAlerts;
  const totalCount = initialStats?.total ?? (pagination.total || dataset.length);
  const highCount =
    initialStats?.high ??
    dataset.filter((a: any) =>
      ['scam', 'high', 'blocked', 'confirmed'].includes(String(a.status || '').toLowerCase())
    ).length;
  const watchCount =
    initialStats?.watch ??
    dataset.filter((a: any) =>
      ['suspected', 'warning', 'investigating', 'processing'].includes(String(a.status || '').toLowerCase())
    ).length;
  const viewTotal =
    initialStats?.views ?? dataset.reduce((sum: number, a: any) => sum + Number(a.views || a.viewCount || 0), 0);
  const commentTotal = dataset.reduce((sum: number, a: any) => sum + Number(a.comments || a.commentCount || 0), 0);

  useEffect(() => {
    setPage(1);
  }, [activeFilter]);

  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
    }
  }, [page, safePage]);

  return (
    <div className="flex min-h-screen flex-col bg-[#f6f8fb] dark:bg-slate-950">
      <Navbar />

      <main className="flex-1 bg-[#f6f8fb] pb-24 pt-20 dark:bg-slate-950 md:pb-8">
        <div className="home-shell home-flow">
          <section className="home-main-grid">
            <div className="home-card card-stack-lg">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-[20px] font-semibold text-text-main">Recent Scam Reports</h2>
                <Link href="/report-lua-dao" className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary-hover">
                  Xem tất cả
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
                {[
                  { label: 'Cảnh báo', value: totalCount, accent: 'text-primary', bg: 'from-primary/10 via-white to-primary/5', Icon: Activity },
                  { label: 'Nguy hiểm', value: highCount, accent: 'text-danger', bg: 'from-danger/10 via-white to-danger/5', Icon: ShieldAlert },
                  { label: 'Theo dõi', value: watchCount, accent: 'text-warning', bg: 'from-warning/10 via-white to-warning/5', Icon: BellRing },
                  { label: 'Lượt xem', value: viewTotal, accent: 'text-text-main', bg: 'from-slate-100 via-white to-slate-50', Icon: EyeOff },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-bg-border/60 bg-gradient-to-br px-3 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/70"
                    style={{ backgroundImage: undefined }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/70 text-primary dark:bg-slate-800/60">
                        <item.Icon className="h-4 w-4" />
                      </span>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">{item.label}</p>
                      <p className={`text-lg font-bold ${item.accent}`}>{formatCompactNumber(item.value)}</p>
                    </div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-bg-border/60">
                      <div className="h-full rounded-full bg-primary/70" style={{ width: `${Math.min(100, Math.max(18, (Number(item.value) / Math.max(1, totalCount || 1)) * 100))}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-primary/15 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/80 text-primary shadow-sm dark:bg-slate-900/70">
                  <AlertTriangle className="h-4 w-4" />
                </span>
                <p className="text-[12px] leading-5 text-primary">
                  Mẹo: Luôn kiểm tra tên miền thật kỹ trước khi giao dịch.
                </p>
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
                    const reportsCount = Number(alert.reports || 0);
                    const viewsCount = Number(alert.views || alert.viewCount || 0);
                    const commentsCount = Number(alert.comments || alert.commentCount || 0);
                    const ratingValueRaw = Number(alert.rating ?? alert.ratings ?? 0);
                    const hasRating = Number.isFinite(ratingValueRaw) && ratingValueRaw > 0;
                    const ratingValue = hasRating ? Math.min(5, Math.max(0, ratingValueRaw)) : 0;
                    const ratingPercent = hasRating ? Math.round((ratingValue / 5) * 100) : null;
                    const watermark = getWatermark(alert.status);

                    return (
                      <Link key={alert.id} href={`/detail/${alert.type}/${encodeURIComponent(alertValue)}`}>
                        <article className="relative w-full overflow-hidden rounded-2xl border border-bg-border/60 bg-white/95 p-4 shadow-[0_4px_18px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:bg-slate-950/50">
                          <div className="grid grid-cols-[auto_1fr] items-start gap-3 md:grid-cols-[auto_1fr_auto]">
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
                              <div className="flex items-center gap-2">
                                <p className="truncate font-mono text-sm font-semibold text-text-main">{alertValue}</p>
                                <span className="flex items-center gap-1 text-amber-500 text-xs font-semibold flex-shrink-0">
                                  <Star className="h-4 w-4 text-amber-400" />
                                  <span className="text-text-main text-[12px]">{hasRating ? ratingValue.toFixed(1) : '—'}</span>
                                </span>
                              </div>
                              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                                {String(alert.type || 'website').toUpperCase()}
                                {alert.date ? ` • ${alert.date}` : ''}
                              </p>
                            </div>

                            <div className="col-span-2 flex items-center gap-2 md:col-span-1 md:row-span-2 md:justify-self-end">
                              {watermark ? (
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] shadow-sm ${watermark.className}`}
                                  style={{ transform: 'rotate(-10deg)' }}
                                >
                                  {watermark.label}
                                </span>
                              ) : null}
                              {renderRiskBadge(alert.status)}
                            </div>
                          </div>

                          <div className="mt-3 flex w-full flex-wrap items-center gap-2 rounded-xl border border-bg-border/60 bg-slate-50/80 px-3 py-2 text-[11px] font-semibold text-text-muted dark:bg-slate-900/60 sm:flex-nowrap">
                            <div className="group flex items-center gap-2 rounded-lg bg-white/80 px-2 py-1 shadow-sm dark:bg-slate-800/60">
                              <span className="text-[10px] uppercase tracking-[0.14em] text-text-muted">Điểm</span>
                              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-900 md:w-28">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-[width]"
                                  style={{ width: ratingPercent !== null ? `${ratingPercent}%` : '0%' }}
                                />
                              </div>
                              <span className="text-text-main">{ratingPercent !== null ? `${ratingPercent}%` : '—%'}</span>
                            </div>

                            <div
                              className="group flex items-center gap-1 rounded-lg bg-white/80 px-2 py-1 shadow-sm dark:bg-slate-800/60 sm:ml-auto"
                              title={`${viewsCount.toLocaleString('vi-VN')} lượt xem`}
                            >
                              <Eye className="h-4 w-4 text-text-muted" />
                              <span className="text-text-main">{formatCompactNumber(viewsCount)}</span>
                            </div>

                            <div
                              className="group flex items-center gap-1 rounded-lg bg-white/80 px-2 py-1 shadow-sm dark:bg-slate-800/60"
                              title={`${commentsCount.toLocaleString('vi-VN')} bình luận`}
                            >
                              <MessageSquare className="h-4 w-4 text-text-muted" />
                              <span className="text-text-main">{formatCompactNumber(commentsCount)}</span>
                            </div>
                          </div>
                        </article>
                      </Link>
                    );
                  })}
                </div>
              )}

              {!showEmptyAlerts && totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    className="px-4 py-2 rounded-button bg-bg-card border border-bg-border text-text-main disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Trang trước
                  </button>

                  <span className="px-3 py-2 text-sm text-text-secondary">
                    Trang {safePage}/{totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    className="px-4 py-2 rounded-button bg-bg-card border border-bg-border text-text-main disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Trang sau
                  </button>
                </div>
              )}
            </div>

            {trustedSection}
          </section>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}

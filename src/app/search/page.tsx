'use client';

import React, { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Phone, Building2, Globe, Wallet, AlertTriangle, Clock } from 'lucide-react';
import { Navbar, MobileNav, Footer } from '@/components/layout';
import { Card, SearchResultSkeleton, RiskBadge } from '@/components/ui';
import { useI18n } from '@/contexts/I18nContext';
import { cn, type SearchResult } from '@/lib/utils';

interface CategoryApiItem {
  id: string;
  name: string;
  type: string;
  description: string;
  count_report?: string;
  status?: string;
  created_at?: string;
  organization?: string;
  organization_icon?: string;
  icon?: string;
  link?: string;
}

interface CategoryApiResponse {
  success: boolean;
  items: CategoryApiItem[];
  source?: string;
  mode?: string;
  category?: string;
}

interface SearchResultView extends SearchResult {
  sourceStatus?: string;
  sourceDescription?: string;
  sourceOrganization?: string;
  sourceOrganizationIcon?: string;
  sourceLink?: string;
  sourceIcon?: string;
  sourceCategory?: string;
  sourceMode?: string;
}

type CategoryKey = 'organizations' | 'websites' | 'devices' | 'systems' | 'apps';

const SEARCH_CATEGORIES: CategoryKey[] = ['organizations', 'websites', 'devices', 'systems', 'apps'];

function repairMojibake(value: string): string {
  if (!value) return '';
  if (!/[ÃÂÄÅ]/.test(value)) return value;
  try {
    return decodeURIComponent(escape(value));
  } catch {
    return value;
  }
}

function normalizeSearchKey(input: string): string {
  return repairMojibake(input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugifySearchKey(input: string): string {
  return normalizeSearchKey(input)
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function getMatchScore(queryKey: string, querySlug: string, item: CategoryApiItem): number {
  const nameKey = normalizeSearchKey(item.name || '');
  const link = (item.link || '').toLowerCase();
  let score = 0;

  if (!queryKey) return 0;
  if (nameKey === queryKey) score = Math.max(score, 120);
  if (nameKey.startsWith(queryKey) || queryKey.startsWith(nameKey)) score = Math.max(score, 100);
  if (nameKey.includes(queryKey) || queryKey.includes(nameKey)) score = Math.max(score, 80);
  if (querySlug && link.includes(`/${querySlug}`)) score = Math.max(score, 130);
  if (querySlug && link.includes(querySlug)) score = Math.max(score, 110);

  return score;
}

function SearchPageContent() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResultView[]>([]);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const mapCategoryType = (key: string): SearchResult['type'] => {
    switch (key) {
      case 'websites': return 'website';
      case 'organizations': return 'bank';
      case 'devices': return 'phone';
      case 'systems': return 'website';
      case 'apps': return 'crypto';
      default: return 'website';
    }
  };

  const mapCategoryRisk = (status?: string): SearchResult['risk'] => {
    if (!status) return 'safe';
    const lowered = status.toLowerCase();
    if (lowered === 'confirmed' || lowered === 'scam') return 'scam';
    if (lowered === 'suspected' || lowered === 'warning') return 'suspicious';
    return 'safe';
  };

  const mapApiItemToResult = (
    item: CategoryApiItem,
    index: number,
    categoryKey: string,
    mode?: string
  ): SearchResultView => {
    const reports = Number.parseInt(item.count_report || '0', 10) || 0;
    const firstSeen = item.created_at || 'Không rõ';

    return {
      id: item.id || `${categoryKey}-${index}`,
      type: mapCategoryType(categoryKey),
      value: item.name,
      risk: mapCategoryRisk(item.status),
      reports,
      firstSeen,
      lastReported: firstSeen,
      sourceStatus: item.status,
      sourceDescription: item.description,
      sourceOrganization: item.organization,
      sourceOrganizationIcon: item.organization_icon,
      sourceLink: item.link,
      sourceIcon: item.icon,
      sourceCategory: categoryKey,
      sourceMode: mode,
    };
  };

  const buildDetailHref = (result: SearchResultView): string => {
    const params = new URLSearchParams();
    params.set('reports', String(result.reports || 0));
    if (result.firstSeen) params.set('firstSeen', result.firstSeen);
    if (result.lastReported) params.set('lastReported', result.lastReported);
    if (result.sourceStatus) params.set('status', result.sourceStatus);
    if (result.sourceDescription) params.set('description', result.sourceDescription);
    if (result.sourceOrganization) params.set('organization', result.sourceOrganization);
    if (result.sourceOrganizationIcon) params.set('organizationIcon', result.sourceOrganizationIcon);
    if (result.sourceLink) params.set('sourceLink', result.sourceLink);
    if (result.sourceCategory) params.set('sourceCategory', result.sourceCategory);
    if (result.sourceMode) params.set('sourceMode', result.sourceMode);
    if (result.sourceIcon) params.set('sourceIcon', result.sourceIcon);

    const queryString = params.toString();
    const base = `/detail/${result.type}/${encodeURIComponent(result.value)}`;
    return queryString ? `${base}?${queryString}` : base;
  };

  useEffect(() => {
    const fetchResults = async () => {
      setIsLoading(true);
      setError(null);

      try {
        await new Promise(resolve => setTimeout(resolve, 400));

        if (query) {
          const queryKey = normalizeSearchKey(query);
          const querySlug = slugifySearchKey(query);

          if (!queryKey) {
            setResults([]);
            return;
          }

          const settled = await Promise.allSettled(
            SEARCH_CATEGORIES.map(async (categoryKey) => {
              const response = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category: categoryKey, page: 1 }),
              });

              if (!response.ok) {
                throw new Error(`Fetch failed for category ${categoryKey}`);
              }

              const data: CategoryApiResponse = await response.json();
              return { categoryKey, data };
            })
          );

          const scored: Array<{ item: SearchResultView; score: number }> = [];

          settled.forEach((entry) => {
            if (entry.status !== 'fulfilled') return;
            const { categoryKey, data } = entry.value;

            (data.items || []).forEach((item, index) => {
              const score = getMatchScore(queryKey, querySlug, item);
              if (score <= 0) return;
              scored.push({
                item: mapApiItemToResult(item, index, categoryKey, data.mode),
                score,
              });
            });
          });

          const deduped = new Map<string, { item: SearchResultView; score: number }>();
          scored.forEach((entry) => {
            const key = normalizeSearchKey(entry.item.value);
            const existing = deduped.get(key);
            if (!existing || entry.score > existing.score) {
              deduped.set(key, entry);
            }
          });

          const mapped = Array.from(deduped.values())
            .sort((a, b) => b.score - a.score || b.item.reports - a.item.reports)
            .slice(0, 30)
            .map((entry) => entry.item);

          setResults(mapped);
        } else if (category) {
          const response = await fetch('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category, page: 1 }),
          });

          if (!response.ok) {
            throw new Error('Failed to fetch category data');
          }

          const data: CategoryApiResponse = await response.json();
          const mapped: SearchResultView[] = (data.items || [])
            .slice(0, 30)
            .map((item, index) => mapApiItemToResult(item, index, category, data.mode));

          setResults(mapped);
        } else {
          setResults([]);
        }
      } catch (err) {
        setError('Failed to fetch results. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (query || category) {
      timeoutRef.current = setTimeout(fetchResults, 300);
    } else {
      setResults([]);
      setIsLoading(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query, category]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'phone': return Phone;
      case 'bank': return Building2;
      case 'website': return Globe;
      case 'crypto': return Wallet;
      default: return AlertTriangle;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-20 pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-text-main mb-4">{t('nav.search')}</h1>
            {query && (
              <p className="text-text-secondary">
                {t('search.results_for')}: "<span className="text-primary font-medium">{query}</span>"
              </p>
            )}
            {!query && category && (
              <p className="text-text-secondary">
                Danh mục: <span className="text-primary font-medium">{category}</span>
              </p>
            )}
          </div>

          {error && (
            <Card className="mb-4 border-danger/30 bg-danger/10 text-danger">
              <p>{error}</p>
            </Card>
          )}

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <SearchResultSkeleton key={i} />
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-4">
              {results.map((result, i) => {
                const Icon = getIcon(result.type);
                return (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Link href={buildDetailHref(result)}>
                      <Card hover className="flex items-center gap-4">
                        <div className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden',
                          result.risk === 'scam' ? 'bg-danger/10 text-danger' :
                          result.risk === 'suspicious' ? 'bg-warning/10 text-warning' :
                          'bg-success/10 text-success'
                        )}>
                          {result.sourceIcon ? (
                            <img
                              src={result.sourceIcon}
                              alt={result.value}
                              className="w-10 h-10 rounded-lg object-cover"
                              onError={(e) => {
                                e.currentTarget.src = 'https://tinnhiemmang.vn/img/icon_web2.png';
                              }}
                            />
                          ) : (
                            <Icon className="w-6 h-6" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-text-main text-lg">{result.value}</p>
                          {result.sourceOrganization && (
                            <p className="text-warning text-sm mt-1 inline-flex items-center gap-1.5">
                              {result.sourceOrganizationIcon ? (
                                <img
                                  src={result.sourceOrganizationIcon}
                                  alt={result.sourceOrganization}
                                  className="w-4 h-4 rounded-full object-cover border border-white/20"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <Building2 className="w-4 h-4" />
                              )}
                              <span className="truncate">{result.sourceOrganization}</span>
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-text-muted mt-1">
                            <span className="flex items-center gap-1">
                              <AlertTriangle className="w-4 h-4" />
                              {result.reports} reports
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              First seen: {result.firstSeen}
                            </span>
                          </div>
                        </div>
                        <RiskBadge
                          risk={result.risk}
                          label={t(`risk.${result.risk}`)}
                        />
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <Card className="text-center py-12">
              <Search className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-secondary mb-2">{t('home.no_results')}</p>
              <p className="text-text-muted text-sm">
                Be the first to report this!
              </p>
            </Card>
          )}
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg-main" />}>
      <SearchPageContent />
    </Suspense>
  );
}

'use client';

import React, { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Search,
  Phone,
  Building2,
  Globe,
  Wallet,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  ShieldCheck,
  AlertOctagon,
  ExternalLink,
  Copy,
  FileWarning,
} from 'lucide-react';
import { Navbar, MobileNav, Footer } from '@/components/layout';
import { Card, SearchResultSkeleton, RiskBadge, MobileSearchResult, SearchProgressBar } from '@/components/ui';
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

// Category name mapping to Vietnamese
const CATEGORY_NAMES: Record<string, { title: string; description: string }> = {
  website: { title: 'Website lừa đảo', description: 'Danh sách các website được xác minh là lừa đảo hoặc đáng ngờ' },
  websites: { title: 'Website lừa đảo', description: 'Danh sách các website được xác minh là lừa đảo hoặc đáng ngờ' },
  organization: { title: 'Tổ chức/Doanh nghiệp', description: 'Danh sách tổ chức và doanh nghiệp uy tín hoặc cần cảnh báo' },
  organizations: { title: 'Tổ chức/Doanh nghiệp', description: 'Danh sách tổ chức và doanh nghiệp uy tín hoặc cần cảnh báo' },
  phone: { title: 'Số điện thoại lừa đảo', description: 'Danh sách số điện thoại được báo cáo lừa đảo' },
  device: { title: 'Thiết bị điện tử', description: 'Danh sách thiết bị điện tử cần cảnh báo' },
  devices: { title: 'Thiết bị điện tử', description: 'Danh sách thiết bị điện tử cần cảnh báo' },
  bank: { title: 'Ngân hàng', description: 'Danh sách ngân hàng và thông tin bảo mật' },
  email: { title: 'Email lừa đảo', description: 'Danh sách email được báo cáo lừa đảo' },
  social: { title: 'Mạng xã hội', description: 'Danh sách tài khoản mạng xã hội lừa đảo' },
  sms: { title: 'Tin nhắn SMS', description: 'Danh sách tin nhắn SMS lừa đảo' },
  app: { title: 'Ứng dụng', description: 'Danh sách ứng dụng cần cảnh báo' },
  apps: { title: 'Ứng dụng', description: 'Danh sách ứng dụng cần cảnh báo' },
  system: { title: 'Hệ thống', description: 'Danh sách hệ thống cần cảnh báo' },
  systems: { title: 'Hệ thống', description: 'Danh sách hệ thống cần cảnh báo' },
};

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

// Enhanced fuzzy matching for Vietnamese
function levenshteinDistance(a: string, b: string): number {
  if (!a || !b) return Math.max(a.length, b.length);
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// Calculate similarity ratio (0-100)
function similarityRatio(a: string, b: string): number {
  if (!a || !b) return 0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 100;
  const distance = levenshteinDistance(a, b);
  return Math.round((1 - distance / maxLen) * 100);
}

// Check if query is a substring with potential typos
function isFuzzyMatch(text: string, query: string, maxDistance: number = 2): boolean {
  const normalizedText = normalizeSearchKey(text);
  const normalizedQuery = normalizeSearchKey(query);
  
  // Direct substring
  if (normalizedText.includes(normalizedQuery)) return true;
  
  // Word-by-word matching
  const queryWords = normalizedQuery.split(' ').filter(w => w.length > 0);
  const textWords = normalizedText.split(' ').filter(w => w.length > 0);
  
  for (const qw of queryWords) {
    for (const tw of textWords) {
      if (qw.length < 2 || tw.length < 2) continue;
      const distance = levenshteinDistance(qw, tw);
      if (distance <= maxDistance) return true;
    }
  }
  
  return false;
}

function isTrustedSource(mode?: string, status?: string): boolean {
  const normalizedMode = (mode || '').trim().toLowerCase();
  const normalizedStatus = (status || '').trim().toLowerCase();
  return normalizedMode === 'trusted' || normalizedStatus === 'trusted';
}

function getMatchScore(queryKey: string, querySlug: string, item: CategoryApiItem): number {
  const nameKey = normalizeSearchKey(item.name || '');
  const nameNormalized = repairMojibake(item.name || '').toLowerCase();
  const link = (item.link || '').toLowerCase();
  const reportCount = Number(item.count_report) || 0;
  
  let score = 0;
  const queryWords = queryKey.split(' ').filter(w => w.length > 0);
  const nameWords = nameKey.split(' ').filter(w => w.length > 0);

  if (!queryKey) return 0;

  // === Exact Match (Highest Priority) ===
  if (nameKey === queryKey) score = Math.max(score, 150);
  
  // === Starts With / Prefix Match ===
  if (nameKey.startsWith(queryKey)) score = Math.max(score, 130);
  if (queryKey.startsWith(nameKey) && queryKey.length > nameKey.length) score = Math.max(score, 120);
  
  // === Contains / Substring Match ===
  if (nameKey.includes(queryKey)) score = Math.max(score, 110);
  if (queryKey.includes(nameKey)) score = Math.max(score, 100);
  
  // === Word Boundary Match (for multi-word queries) ===
  const allWordsMatch = queryWords.every(qw => 
    nameWords.some(nw => nw.includes(qw) || qw.includes(nw))
  );
  if (allWordsMatch && queryWords.length > 1) score = Math.max(score, 105);

  // === Fuzzy Match (typo tolerance) ===
  const fuzzyThreshold = queryKey.length >= 4 ? 0 : 1;
  if (isFuzzyMatch(nameKey, queryKey, fuzzyThreshold) && score < 80) {
    score = Math.max(score, 70);
  }

  // === Similarity Score ===
  const simRatio = similarityRatio(nameKey, queryKey);
  if (simRatio >= 80) score = Math.max(score, 90);
  else if (simRatio >= 60) score = Math.max(score, 60);

  // === URL/Domain Match ===
  if (querySlug && link) {
    if (link.includes(`/${querySlug}`) || link.includes(`?${querySlug}`)) score = Math.max(score, 140);
    else if (link.includes(querySlug)) score = Math.max(score, 115);
    
    // Check domain without TLD
    const domainMatch = link.match(/([a-z0-9-]+)\./);
    if (domainMatch && domainMatch[1].includes(querySlug.replace(/-/g, ''))) {
      score = Math.max(score, 100);
    }
  }

  // === Report Count Boost ===
  const isTrusted = isTrustedSource(item.status);
  if (reportCount > 0) {
    const reportBoost = Math.min(Math.log10(reportCount + 1) * 5, 25);
    score += isTrusted ? reportBoost * 1.5 : reportBoost;
  }

  // === Trusted Source Boost ===
  if (isTrusted) score = Math.max(score, 85);

  // === Status Priority ===
  const statusLower = (item.status || '').toLowerCase();
  if (statusLower === 'confirmed' || statusLower === 'scam') score = Math.max(score, 95);
  else if (statusLower === 'suspected' || statusLower === 'warning') score = Math.max(score, 75);

  return Math.round(score);
}

function SearchPageContent() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = (searchParams.get('q') || '').trim();
  const category = searchParams.get('category') || '';

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResultView[]>([]);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [searchValue, setSearchValue] = useState(query);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isIdle = !query && !category;

  useEffect(() => {
    setSearchValue(query);
  }, [query]);

  const mapCategoryType = (key: string): SearchResult['type'] => {
    switch (key) {
      case 'websites': return 'website';
      case 'organizations': return 'bank'; // keep legacy for risk icon
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
      sourceIcon: item.organization_icon || item.icon,
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
                body: JSON.stringify({ category: categoryKey, page: 1, query, perPage: 200 }),
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
              scored.push({
                item: mapApiItemToResult(item, index, categoryKey, data.mode),
                score: score > 0 ? score : 60,
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
          setSelectedIndex(-1);
        } else if (category) {
          const response = await fetch('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category, page: 1, query, perPage: 200 }),
          });

          if (!response.ok) {
            throw new Error('Failed to fetch category data');
          }

          const data: CategoryApiResponse = await response.json();
          const mapped: SearchResultView[] = (data.items || [])
            .slice(0, 30)
            .map((item, index) => mapApiItemToResult(item, index, category, data.mode));

          setResults(mapped);
          setSelectedIndex(-1);
        } else {
          setResults([]);
          setSelectedIndex(-1);
        }
      } catch (err) {
        setError('Failed to fetch results. Please try again.');
        setScanResult(null);
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

  useEffect(() => {
    const runScan = async () => {
      if (!query) return;
      let cleanUrl = query.trim();

      // Only scan nếu trông giống domain/URL
      const looksLikeDomain = /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(cleanUrl.replace(/^https?:\/\//, '').split('/')[0]);
      const isFullUrl = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(cleanUrl);
      if (!looksLikeDomain) return; // tránh gửi chuỗi không phải URL (ví/telegram...) gây 400
      if (!isFullUrl) cleanUrl = 'https://' + cleanUrl;

      setIsScanning(true);
      setScanError(null);
      setScanResult(null);
      try {
        const response = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: cleanUrl }),
        });
        if (!response.ok) throw new Error('Scan failed');
        const data = await response.json();
        const riskScore = data.risk_score || data.riskScore || data.score || 0;
        const verdictRaw = typeof data.verdict === 'string' ? data.verdict.trim().toLowerCase() : '';
        const verdict: 'scam' | 'safe' | 'unknown' | 'policy' = verdictRaw === 'scam' || verdictRaw === 'safe' || verdictRaw === 'unknown' || verdictRaw === 'policy'
          ? verdictRaw
          : (riskScore > 50 ? 'scam' : 'safe');
        const trustScoreRaw = typeof data.trust_score === 'number' ? data.trust_score : (data.trustScore || null);
        const trustScore = trustScoreRaw !== null && trustScoreRaw !== undefined
          ? Math.max(0, Math.min(100, Math.round(trustScoreRaw)))
          : verdict === 'unknown'
            ? 50
            : Math.max(0, 100 - Math.round(riskScore));
        setScanResult({
          domain: data.domain || cleanUrl.replace(/^https?:\/\//, ''),
          verdict,
          riskScore,
          trustScore,
          status: data.status || data.mode || verdict,
          reports: data.reports || 0,
          organization: data.organization || '',
          description: data.description || '',
          source: data.source || 'scan',
          policyViolation: Boolean(data.policy_violation),
          policySourceUrl: typeof data.policy_source_url === 'string' ? data.policy_source_url : '',
          policySourceTitle: typeof data.policy_source_title === 'string' ? data.policy_source_title : '',
        });
      } catch (e: any) {
        setScanError(e?.message || 'Scan failed');
      } finally {
        setIsScanning(false);
      }
    };

    if (!isLoading && results.length === 0 && query) {
      runScan();
    }
  }, [isLoading, results.length, query]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'phone': return Phone;
      case 'bank': return Building2;
      case 'website': return Globe;
      case 'crypto': return Wallet;
      default: return AlertTriangle;
    }
  };

  const getRiskLabel = (risk: SearchResult['risk']) => {
    if (risk === 'scam') return 'Lừa đảo';
    if (risk === 'suspicious') return 'Nghi ngờ';
    return 'An toàn';
  };

  const quickHints = [
    { label: 'Website', value: 'shop-sale-xyz.com', icon: Globe },
    { label: 'SĐT', value: '0900 000 000', icon: Phone },
    { label: 'Tài khoản', value: 'VCB 0123456789', icon: Building2 },
    { label: 'Ví crypto', value: '0x1234...abcd', icon: Wallet },
  ];

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = searchValue.trim();
    if (!next) return;
    router.push(`/search?q=${encodeURIComponent(next)}`);
  };

  const handleCategory = (key: string) => {
    router.push(`/search?category=${encodeURIComponent(key)}`);
  };

  // Keyboard navigation handler
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return;
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case 'Enter':
        if (selectedIndex >= 0 && results[selectedIndex]) {
          event.preventDefault();
          const selected = results[selectedIndex];
          router.push(buildDetailHref(selected));
        }
        break;
      case 'Escape':
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle result click to update selected index
  const handleResultClick = (index: number) => {
    setSelectedIndex(index);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-20 pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
          <div className="rounded-[28px] border border-bg-border bg-white/80 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-text-main">Tra cứu cảnh báo</h1>
                <p className="text-text-secondary text-sm mt-1">
                  Nhập website, số điện thoại, tài khoản ngân hàng hoặc ví crypto để kiểm tra ngay.
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-bg-border bg-bg-cardHover px-3 py-1 text-xs font-semibold text-text-secondary">
                <ShieldCheck className="w-4 h-4 text-success" /> Nguồn cộng đồng + quét AI
              </span>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
                <input
                  ref={(el) => {
                    if (el && query) {
                      el.focus();
                      // Move cursor to end
                      const length = el.value.length;
                      el.setSelectionRange(length, length);
                    }
                  }}
                  value={searchValue}
                  onChange={(event) => {
                    setSearchValue(event.target.value);
                    setSelectedIndex(-1);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ví dụ: shopee-sale.com, 0908xxxxxx, VCB 0123..."
                  className="w-full rounded-full border border-bg-border bg-white py-3 pl-12 pr-4 text-sm text-text-main shadow-[0_6px_16px_rgba(15,23,42,0.08)] outline-none transition focus:border-primary/60"
                />
              </div>
              <button
                type="submit"
                disabled={!searchValue.trim()}
                className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(59,130,246,0.25)] transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Tra cứu ngay
              </button>
            </form>

            <div className="mt-4 flex flex-wrap gap-2">
              {quickHints.map((hint) => {
                const Icon = hint.icon;
                return (
                  <button
                    type="button"
                    key={hint.label}
                    onClick={() => setSearchValue(hint.value)}
                    className="inline-flex items-center gap-2 rounded-full border border-bg-border bg-white px-3 py-1 text-xs font-semibold text-text-secondary transition hover:border-primary/40 hover:text-primary"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {hint.label}: {hint.value}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {SEARCH_CATEGORIES.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleCategory(key)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-semibold transition',
                    category === key
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-bg-border bg-bg-cardHover text-text-secondary hover:border-primary/30 hover:text-primary'
                  )}
                >
                  {CATEGORY_NAMES[key]?.title || key}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8">
            {category && CATEGORY_NAMES[category] ? (
              <>
                <h1 className="text-2xl font-bold text-text-main mb-2">{CATEGORY_NAMES[category].title}</h1>
                <p className="text-text-secondary">{CATEGORY_NAMES[category].description}</p>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>

          {error && (
            <Card className="mb-4 border-danger/30 bg-danger/10 text-danger">
              <p>{error}</p>
            </Card>
          )}

          {isIdle ? (
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="p-4">
                <div className="flex items-center gap-2 text-text-main font-semibold">
                  <Search className="w-4 h-4 text-primary" /> 3 bước tra cứu
                </div>
                <ol className="mt-2 space-y-2 text-sm text-text-secondary">
                  <li>1. Nhập website/số điện thoại.</li>
                  <li>2. Đối chiếu cảnh báo cộng đồng.</li>
                  <li>3. Xem đánh giá kỹ thuật & nguồn.</li>
                </ol>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2 text-text-main font-semibold">
                  <AlertTriangle className="w-4 h-4 text-warning" /> Lưu ý nhanh
                </div>
                <ul className="mt-2 space-y-2 text-sm text-text-secondary">
                  <li>• Domain mới đăng ký thường rủi ro cao.</li>
                  <li>• Cẩn thận ưu đãi quá lớn, yêu cầu OTP.</li>
                  <li>• Kiểm tra link chính thức trước khi giao dịch.</li>
                </ul>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2 text-text-main font-semibold">
                  <ShieldCheck className="w-4 h-4 text-success" /> Cam kết
                </div>
                <p className="mt-2 text-sm text-text-secondary">
                  Dữ liệu tổng hợp từ báo cáo cộng đồng, danh sách pháp lý và quét kỹ thuật AI.
                </p>
              </Card>
            </div>
          ) : isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <SearchResultSkeleton key={i} />
              ))}
            </div>
          ) : results.length > 0 ? (
            <>
              {/* Progress bar during search */}
              <SearchProgressBar 
                isSearching={isLoading} 
                message="Đang tra cứu cơ sở dữ liệu..."
                className="mb-4"
              />

              <div className="mb-4 flex items-center justify-between">
                <p className="text-text-secondary">
                  Tìm thấy <span className="font-semibold text-primary">{results.length}</span> kết quả
                  {query && (
                    <> cho "<span className="text-primary font-medium">{query}</span>"
                    </>
                  )}
                </p>
                {results.length > 0 && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs text-text-muted">
                    <kbd className="px-1.5 py-0.5 rounded bg-bg-border text-text-secondary font-mono">↑</kbd>
                    <kbd className="px-1.5 py-0.5 rounded bg-bg-border text-text-secondary font-mono">↓</kbd>
                    <span className="ml-1">điều hướng</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-bg-border text-text-secondary font-mono ml-2">Enter</kbd>
                    <span className="ml-1">chọn</span>
                  </span>
                )}
              </div>

              {/* Mobile Layout - Compact */}
              <div className="sm:hidden space-y-2" data-mobile-card-list>
                {results.map((result, index) => (
                  <MobileSearchResult
                    key={String(result.id)}
                    id={String(result.id)}
                    value={result.value}
                    type={result.type}
                    risk={result.risk}
                    reports={Number(result.reports || 0)}
                    sourceIcon={result.sourceIcon}
                    sourceOrganization={result.sourceOrganization}
                    href={buildDetailHref(result)}
                    selected={selectedIndex === index}
                  />
                ))}
              </div>

              {/* Desktop Layout - Full Details */}
              <div className="hidden sm:block space-y-4">
                {results.map((result, i) => {
                  const Icon = getIcon(result.type);
                  const trustedSource = result.risk === 'safe' && isTrustedSource(result.sourceMode, result.sourceStatus);
                  return (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Link href={buildDetailHref(result)}>
                        <Card hover className={cn(
                          "flex items-center gap-4",
                          selectedIndex === i && "ring-2 ring-primary ring-offset-2 bg-primary/5"
                        )}>
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
                            <p className="font-medium text-text-main text-lg inline-flex items-center gap-1.5">
                              <span>{result.value}</span>
                              {trustedSource && (
                                <i className="fi fi-ss-badge-check text-primary text-[1em] leading-none align-middle shrink-0" />
                              )}
                            </p>
                            {result.sourceOrganization && (
                              <p className="text-warning text-sm mt-1">
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
                            label={getRiskLabel(result.risk)}
                          />
                        </Card>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </>
          ) : scanResult ? (
            <Card
          className={cn(
            'relative p-4 border-2 overflow-hidden',
            scanResult.verdict === 'scam'
              ? 'border-danger/50 bg-danger/5'
              : scanResult.verdict === 'policy'
                ? 'border-warning/40 bg-warning/5'
              : scanResult.verdict === 'unknown'
                ? 'border-warning/40 bg-warning/5'
                : 'border-success/40 bg-success/5'
          )}
        >
              <div className="flex items-start gap-3 relative z-10">
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    scanResult.verdict === 'scam'
                      ? 'bg-danger/15 text-danger'
                      : scanResult.verdict === 'policy'
                        ? 'bg-warning/15 text-warning'
                      : scanResult.verdict === 'unknown'
                        ? 'bg-warning/15 text-warning'
                        : 'bg-success/15 text-success'
                  )}
                >
                  {scanResult.verdict === 'scam'
                    ? <AlertOctagon className="w-5 h-5" />
                    : scanResult.verdict === 'policy'
                      ? <FileWarning className="w-5 h-5" />
                    : scanResult.verdict === 'unknown'
                      ? <AlertTriangle className="w-5 h-5" />
                      : <ShieldCheck className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-text-main text-lg truncate">{scanResult.domain}</p>
                      {scanResult.verdict === 'scam' && (
                        <span className="inline-flex items-center gap-1 border-[1.5px] border-danger/85 text-danger/90 font-bold uppercase tracking-[0.1em] text-[11px] px-2.5 py-0.5 rounded-md bg-white/90 shadow-[0_2px_6px_rgba(229,57,53,0.18)]">
                          <XCircle className="w-3.5 h-3.5" /> Nguy hiểm
                        </span>
                      )}
                      {scanResult.verdict === 'policy' && (
                        <span className="inline-flex items-center gap-1 border-[1.5px] border-warning/85 text-warning/95 font-bold uppercase tracking-[0.1em] text-[11px] px-2.5 py-0.5 rounded-md bg-white/90 shadow-[0_2px_6px_rgba(245,158,11,0.18)]">
                          <FileWarning className="w-3.5 h-3.5" /> Cảnh báo pháp lý
                        </span>
                      )}
                      {scanResult.verdict === 'safe' && (
                        <span className="inline-flex items-center gap-1 text-success text-xs font-bold uppercase">
                          <CheckCircle className="w-4 h-4" /> An toàn
                        </span>
                      )}
                      {scanResult.verdict === 'unknown' && (
                        <span className="inline-flex items-center gap-1 text-warning text-xs font-bold uppercase">
                          <AlertTriangle className="w-4 h-4" /> Chưa đủ dữ liệu
                        </span>
                      )}
                    </div>
                  <p className="text-text-secondary text-sm mt-1">
                    {scanResult.description ||
                      (scanResult.verdict === 'scam'
                        ? 'Hệ thống AI phát hiện rủi ro cao, cần thận trọng.'
                        : scanResult.verdict === 'policy'
                          ? 'Website có cảnh báo pháp lý từ nguồn công bố chính thức.'
                        : scanResult.verdict === 'unknown'
                          ? 'Không đủ dữ liệu từ các nguồn kiểm tra để kết luận.'
                          : 'Không phát hiện rủi ro rõ ràng.')}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-sm">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-bg-cardHover border border-bg-border">
                      <AlertOctagon className="w-4 h-4 text-danger" /> Điểm rủi ro: <strong className="text-danger">{scanResult.riskScore}%</strong>
                    </span>
                    {scanResult.verdict === 'policy' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-bg-cardHover border border-bg-border">
                        <FileWarning className="w-4 h-4 text-warning" /> Nhãn: <strong className="text-warning">Cảnh báo pháp lý</strong>
                      </span>
                    ) : scanResult.verdict === 'unknown' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-bg-cardHover border border-bg-border">
                        <AlertTriangle className="w-4 h-4 text-warning" /> Trạng thái: <strong className="text-warning">Chưa đủ dữ liệu</strong>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-bg-cardHover border border-bg-border">
                        <XCircle className="w-4 h-4 text-danger" /> Lừa đảo: <strong className="text-danger">{Math.min(100, Math.max(0, Math.round(scanResult.riskScore)))}%</strong>
                      </span>
                    )}
                    {scanResult.verdict !== 'scam' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-bg-cardHover border border-bg-border">
                        <ShieldCheck className={cn('w-4 h-4', scanResult.verdict === 'unknown' ? 'text-warning' : 'text-success')} />
                        Uy tín: <strong className={scanResult.verdict === 'unknown' ? 'text-warning' : 'text-success'}>{scanResult.trustScore}%</strong>
                      </span>
                    )}
                    {scanResult.organization && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-bg-cardHover border border-bg-border">
                        <Building2 className="w-4 h-4 text-warning" /> Mạo danh: {scanResult.organization}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-bg-cardHover border border-bg-border">
                      <Copy className="w-3.5 h-3.5 text-text-muted" /> Báo cáo: {scanResult.reports}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-bg-cardHover border border-bg-border">
                      <ExternalLink className="w-3.5 h-3.5 text-text-muted" /> Nguồn: {scanResult.source}
                    </span>
                  </div>
                  <div className="mt-3">
                    <a
                      href={`/detail/website/${encodeURIComponent(scanResult.domain)}?status=${scanResult.status || scanResult.verdict}&reports=${scanResult.reports || 0}&sourceCategory=websites&source=${encodeURIComponent(scanResult.source || 'scan')}&description=${encodeURIComponent(scanResult.description || '')}&risk=${encodeURIComponent(String(scanResult.riskScore ?? ''))}${scanResult.policyViolation ? `&policy=1&policySourceUrl=${encodeURIComponent(scanResult.policySourceUrl || '')}&policySourceTitle=${encodeURIComponent(scanResult.policySourceTitle || '')}` : ''}`}
                      className="inline-flex items-center gap-1 rounded-full bg-primary text-white px-3 py-1 text-xs font-semibold hover:bg-primary/90 transition-colors"
                    >
                      Xem chi tiết <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </Card>
          ) : isScanning ? (
            <Card className="text-center py-8 text-text-secondary">Đang quét AI...</Card>
          ) : scanError ? (
            <Card className="text-center py-8 text-danger">{scanError}</Card>
          ) : (
            <Card className="text-center py-12">
              <Search className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-secondary mb-2">Không tìm thấy kết quả nào</p>
              <p className="text-text-muted text-sm mb-4">
                Hãy là người đầu tiên báo cáo "{query}" nếu đây là trang lừa đảo!
              </p>
              <Link
                href="/report"
                className="inline-flex items-center gap-2 rounded-full bg-danger px-4 py-2 text-sm font-semibold text-white hover:bg-danger/90 transition"
              >
                <AlertTriangle className="w-4 h-4" />
                Báo cáo ngay
              </Link>
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

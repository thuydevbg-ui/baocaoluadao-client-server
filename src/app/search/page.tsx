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

function SearchPageContent() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      setIsLoading(true);
      setError(null);

      try {
        await new Promise(resolve => setTimeout(resolve, 1500));

        if (query) {
          setResults([
            { id: 1, type: 'phone', value: query, risk: 'scam', reports: 23, firstSeen: '2024-01-15', lastReported: '2024-02-20' },
            { id: 2, type: 'bank', value: `VCB ${query.slice(-6)}`, risk: 'suspicious', reports: 5, firstSeen: '2024-02-01', lastReported: '2024-02-18' },
          ]);
        } else if (category) {
          const categoryMap: Record<string, SearchResult[]> = {
            websites: [
              { id: 101, type: 'website', value: 'fakestore-vn.com', risk: 'scam', reports: 156, firstSeen: '2024-01-10', lastReported: '2024-02-20' },
              { id: 102, type: 'website', value: 'shop-sale-0dong.net', risk: 'suspicious', reports: 48, firstSeen: '2024-02-01', lastReported: '2024-02-18' },
            ],
            organizations: [
              { id: 201, type: 'bank', value: 'To chuc tai chinh gia mao A', risk: 'scam', reports: 89, firstSeen: '2024-01-12', lastReported: '2024-02-21' },
              { id: 202, type: 'bank', value: 'Don vi mao danh B', risk: 'suspicious', reports: 34, firstSeen: '2024-01-30', lastReported: '2024-02-17' },
            ],
            devices: [
              { id: 301, type: 'phone', value: 'Thiet bi Android nhiem ma doc', risk: 'scam', reports: 27, firstSeen: '2024-01-25', lastReported: '2024-02-19' },
              { id: 302, type: 'phone', value: 'Thiet bi truy cap trai phep', risk: 'suspicious', reports: 12, firstSeen: '2024-02-05', lastReported: '2024-02-16' },
            ],
            systems: [
              { id: 401, type: 'website', value: 'He thong bi canh bao tan cong', risk: 'scam', reports: 19, firstSeen: '2024-01-18', lastReported: '2024-02-20' },
              { id: 402, type: 'website', value: 'Cong dich vu co dau hieu gia mao', risk: 'suspicious', reports: 9, firstSeen: '2024-02-08', lastReported: '2024-02-18' },
            ],
            apps: [
              { id: 501, type: 'crypto', value: 'Ung dung vi gia mao', risk: 'scam', reports: 73, firstSeen: '2024-01-20', lastReported: '2024-02-21' },
              { id: 502, type: 'crypto', value: 'App dau tu lai suat cao bat thuong', risk: 'suspicious', reports: 41, firstSeen: '2024-02-03', lastReported: '2024-02-19' },
            ],
          };

          setResults(categoryMap[category] || []);
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
                Danh muc: <span className="text-primary font-medium">{category}</span>
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
                    <Link href={`/detail/${result.type}/${encodeURIComponent(result.value)}`}>
                      <Card hover className="flex items-center gap-4">
                        <div className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center',
                          result.risk === 'scam' ? 'bg-danger/10 text-danger' :
                          result.risk === 'suspicious' ? 'bg-warning/10 text-warning' :
                          'bg-success/10 text-success'
                        )}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-text-main text-lg">{result.value}</p>
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

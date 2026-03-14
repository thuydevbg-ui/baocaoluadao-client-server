'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Globe, Phone, Mail, Building2, Eye, MessageSquare, ThumbsUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { Navbar, Footer } from '@/components/layout';
import { cn } from '@/lib/utils';

type ScamItem = {
  id: number;
  name?: string;
  domain?: string;
  type: string;
  reports: number;
  ratings: number;
  comments: number;
  views: number;
  date: string;
  is_scam: boolean;
};

const TYPE_META: Record<string, { label: string; Icon: typeof Globe }> = {
  website: { label: 'Website', Icon: Globe },
  phone: { label: 'Điện thoại', Icon: Phone },
  email: { label: 'Email', Icon: Mail },
  bank: { label: 'Ngân hàng', Icon: Building2 },
  organization: { label: 'Tổ chức', Icon: Building2 },
  social: { label: 'Mạng xã hội', Icon: Globe },
  sms: { label: 'SMS', Icon: Phone },
  device: { label: 'Thiết bị', Icon: AlertTriangle },
  system: { label: 'Hệ thống', Icon: AlertTriangle },
  application: { label: 'Ứng dụng', Icon: AlertTriangle },
};

const LIMIT = 12;

function formatCount(value: number) {
  if (!Number.isFinite(value)) return '0';
  return value.toLocaleString('vi-VN');
}

export default function ReportLuaDaoPage() {
  const [items, setItems] = useState<ScamItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    fetch(`/api/scams?page=${page}&limit=${LIMIT}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (!data?.success) {
          throw new Error(data?.error || 'Không thể tải dữ liệu');
        }
        setItems(data?.data || []);
        setTotalPages(data?.pagination?.totalPages || 1);
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.message || 'Không thể tải dữ liệu');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page]);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-24">
        <div className="mb-8 space-y-2">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Danh sách lừa đảo</h1>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Tổng hợp các báo cáo mới nhất từ cộng đồng và hệ thống.
          </p>
        </div>

        <div className="grid gap-4">
          {loading && (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              Đang tải dữ liệu...
            </div>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-center text-red-600 shadow-sm">
              {error}
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              Chưa có dữ liệu.
            </div>
          )}

          {!loading && !error && items.map((item) => {
            const meta = TYPE_META[item.type] || { label: 'Khác', Icon: AlertTriangle };
            const label = item.is_scam ? 'Lừa đảo' : 'Uy tín';
            const target = item.domain || item.name || String(item.id);
            const detailType = item.type || 'website';
            return (
              <Link
                key={`${item.id}-${target}`}
                href={`/detail/${detailType}/${encodeURIComponent(target)}`}
                className={cn(
                  'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition',
                  'hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg',
                  'dark:border-slate-800 dark:bg-slate-900'
                )}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                      <meta.Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-semibold text-slate-900 dark:text-white">{target}</span>
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase',
                            item.is_scam
                              ? 'bg-red-500 text-white'
                              : 'bg-emerald-500 text-white'
                          )}
                        >
                          {label}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {meta.label}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Cập nhật: {item.date}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4 text-slate-400" />
                      {formatCount(item.views)}
                    </div>
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-4 w-4 text-slate-400" />
                      {formatCount(item.ratings)}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4 text-slate-400" />
                      {formatCount(item.comments)}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <ChevronLeft className="h-4 w-4" />
            Trang trước
          </button>
          <div className="text-sm text-slate-600 dark:text-slate-300">
            Trang {page} / {totalPages}
          </div>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            Trang sau
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}

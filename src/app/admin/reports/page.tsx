'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import InlineSvg from '@/components/ui/InlineSvg';

interface ReportItem {
  id: string;
  title: string;
  type: 'website' | 'phone' | 'email' | 'social' | 'sms';
  status: 'pending' | 'verified' | 'rejected';
  riskLevel: 'low' | 'medium' | 'high';
  description: string;
  createdAt: string;
  updatedAt: string;
  reporter: {
    id: string;
    name: string;
    email: string;
  };
  target: {
    type: 'website' | 'phone' | 'email' | 'social' | 'sms';
    value: string;
    ip?: string;
    platform?: string;
  };
  source: string;
  adminNotes: string;
  history: Array<{
    action: string;
    user: string;
    date: string;
    note?: string;
  }>;
}

interface ReportListResponse {
  success: boolean;
  error?: string;
  items?: ReportItem[];
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  summary?: {
    pending: number;
    verified: number;
    rejected: number;
  };
}

const PAGE_SIZE = 10;

function formatDateTime(input: string): string {
  const t = new Date(input).getTime();
  if (!Number.isFinite(t)) return 'Không rõ';
  return new Date(t).toLocaleString('vi-VN');
}

export default function ReportsPage() {
  const { theme } = useAdminTheme();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'website' | 'phone' | 'email' | 'social' | 'sms'>('all');
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadReports = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError('');

    try {
      const query = new URLSearchParams({
        q: searchQuery,
        status: statusFilter,
        type: typeFilter,
        page: String(currentPage),
        pageSize: String(PAGE_SIZE),
      });

      const response = await fetch(`/api/admin/reports?${query.toString()}`, {
        cache: 'no-store',
        signal,
      });
      const payload: ReportListResponse = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Không thể tải danh sách báo cáo.');
      }

      setReports(payload.items || []);
      setTotal(payload.total || 0);
      setTotalPages(payload.totalPages || 1);

      if (payload.page && payload.page !== currentPage) {
        setCurrentPage(payload.page);
      }
    } catch (loadError) {
      if (loadError instanceof Error && loadError.name === 'AbortError') return;
      const message = loadError instanceof Error ? loadError.message : 'Không thể tải danh sách báo cáo.';
      setError(message);
      setReports([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, typeFilter, currentPage]);

  useEffect(() => {
    const controller = new AbortController();
    loadReports(controller.signal);
    return () => controller.abort();
  }, [loadReports]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, typeFilter]);

  const getStatusBadge = (status: ReportItem['status']) => {
    const config: Record<ReportItem['status'], { label: string; file: string; alt: string; className: string }> = {
      pending: { label: 'Chờ duyệt', file: 'exclamation-circle.svg', alt: 'Chờ duyệt', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      verified: { label: 'Đã xác minh', file: 'check-circle.svg', alt: 'Đã xác minh', className: 'bg-green-100 text-green-800 border-green-300' },
      rejected: { label: 'Từ chối', file: 'x-circle.svg', alt: 'Từ chối', className: 'bg-red-100 text-red-800 border-red-300' },
    };
    const { label, file, alt, className } = config[status];
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${className}`}>
        <InlineSvg src={`/lineicons/${file}`} ariaLabel={alt} className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="whitespace-nowrap">{label}</span>
      </span>
    );
  };

  const getRiskBadge = (risk: ReportItem['riskLevel']) => {
    const config: Record<ReportItem['riskLevel'], { label: string; className: string }> = {
      low: { label: 'Thấp', className: 'bg-green-100 text-green-800' },
      medium: { label: 'Trung bình', className: 'bg-yellow-100 text-yellow-800' },
      high: { label: 'Cao', className: 'bg-red-100 text-red-800' },
    };
    const { label, className } = config[risk];
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded ${className}`}>
        {label}
      </span>
    );
  };

  const getTypeIcon = (type: ReportItem['type']) => {
    // Custom SVGs should be copied to public/lineicons and named accordingly.
    const map: Record<ReportItem['type'], { file: string; alt: string }> = {
      website: { file: 'globe.svg', alt: 'Website' },
      phone: { file: 'smartphone.svg', alt: 'Phone' },
      email: { file: 'mail.svg', alt: 'Email' },
      social: { file: 'facebook.svg', alt: 'Social' },
      sms: { file: 'chat-bubble-2.svg', alt: 'SMS' },
    };

    const entry = map[type];
    if (!entry) return '📋';

    // Use the public folder so Next serves static assets from /lineicons/*
    const src = `/lineicons/${entry.file}`;
    // Use inline SVG to allow inheriting currentColor and sizing via CSS
    return (
      <InlineSvg src={src} ariaLabel={entry.alt} className="w-5 h-5 inline-block text-text-main" />
    );
  };

  const handleUpdateStatus = async (id: string, status: 'verified' | 'rejected') => {
    if (isUpdatingId) return;
    setIsUpdatingId(id);
    setError('');

    try {
      const response = await fetch(`/api/admin/reports/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Không thể cập nhật trạng thái báo cáo.');
      }

      setReports((prev) => prev.map((item) => (item.id === id ? payload.item : item)));
      setSelectedReport((prev) => (prev?.id === id ? payload.item : prev));
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : 'Không thể cập nhật trạng thái báo cáo.';
      setError(message);
    } finally {
      setIsUpdatingId(null);
    }
  };

  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const pageRange = useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }, [totalPages]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Quản lý báo cáo</h2>
          <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Quản lý và xử lý báo cáo lừa đảo</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => loadReports()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              theme === 'dark' 
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
          <button className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              theme === 'dark' 
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}>
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Xuất</span>
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`border rounded-2xl p-3 ${
          theme === 'dark' 
            ? 'bg-gray-900/50 border-gray-800' 
            : 'bg-white border-gray-200'
        }`}
      >
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg transition-colors focus:outline-none focus:border-blue-500 ${
                theme === 'dark'
                  ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-500'
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
              }`}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className={`w-full md:w-36 px-3 py-2 text-sm border rounded-lg transition-colors focus:outline-none focus:border-blue-500 ${
              theme === 'dark'
                ? 'bg-gray-800/50 border-gray-700 text-white'
                : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}
          >
            <option value="all">Trạng thái</option>
            <option value="pending">Chờ duyệt</option>
            <option value="verified">Đã xác minh</option>
            <option value="rejected">Từ chối</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
            className={`w-full md:w-36 px-3 py-2 text-sm border rounded-lg transition-colors focus:outline-none focus:border-blue-500 ${
              theme === 'dark'
                ? 'bg-gray-800/50 border-gray-700 text-white'
                : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}
          >
            <option value="all">Loại</option>
            <option value="website">Website</option>
            <option value="phone">Điện thoại</option>
            <option value="email">Email</option>
            <option value="social">Mạng xã hội</option>
            <option value="sms">SMS</option>
          </select>
        </div>
      </motion.div>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 text-red-300 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`border rounded-2xl overflow-hidden ${
          theme === 'dark'
            ? 'bg-gray-900/50 border-gray-800'
            : 'bg-white border-gray-200'
        }`}
      >
        {/* Mobile: stacked cards */}
        <div className="sm:hidden p-3 space-y-3">
          {isLoading && (
            <div className={`p-4 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Đang tải dữ liệu...</div>
          )}

          {!isLoading && reports.length === 0 && (
            <div className={`p-4 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Không có báo cáo phù hợp bộ lọc.</div>
          )}

          {!isLoading && reports.map((report) => (
            <div
              key={report.id}
              className={`report-card p-3 border rounded-lg flex items-start gap-3 ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
            >
              <div className={`flex-shrink-0 w-12 h-12 rounded-md flex items-center justify-center ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                {getTypeIcon(report.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className={`text-sm font-semibold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{report.title}</div>
                    <div className={`text-xs mt-1 truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{report.reporter.name} • {formatDateTime(report.createdAt)}</div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div>{getRiskBadge(report.riskLevel)}</div>
                    <div>{getStatusBadge(report.status)}</div>
                  </div>
                </div>

                <div className={`mt-3 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} line-clamp-3 break-words`}>{report.description}</div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <button
                      onClick={() => setSelectedReport(report)}
                      className={`flex items-center gap-2 px-2 py-1 rounded-md transition-colors ${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                      title="Xem chi tiết"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Chi tiết</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {report.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(report.id, 'verified')}
                          disabled={isUpdatingId === report.id}
                          className="px-3 py-1 rounded-md text-green-600 bg-green-50 hover:bg-green-100 text-sm"
                        >
                          Duyệt
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(report.id, 'rejected')}
                          disabled={isUpdatingId === report.id}
                          className="px-3 py-1 rounded-md text-red-600 bg-red-50 hover:bg-red-100 text-sm"
                        >
                          Từ chối
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop/table view */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className={theme === 'dark' ? 'border-b border-gray-800' : 'border-b border-gray-200'}>
                <th className={`text-left px-3 py-3 text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>ID</th>
                <th className={`text-left px-3 py-3 text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Tiêu đề</th>
                <th className={`text-left px-3 py-3 text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Loại</th>
                <th className={`text-left px-3 py-3 text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Mức độ</th>
                <th className={`text-left px-3 py-3 text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Trạng thái</th>
                <th className={`text-left px-3 py-3 text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Người báo cáo</th>
                <th className={`text-left px-3 py-3 text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Ngày tạo</th>
                <th className={`text-center px-3 py-3 text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={8} className={`p-8 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang tải dữ liệu...
                    </span>
                  </td>
                </tr>
              )}

              {!isLoading && reports.length === 0 && (
                <tr>
                  <td colSpan={8} className={`p-8 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Không có báo cáo phù hợp bộ lọc.
                  </td>
                </tr>
              )}

              {!isLoading && reports.map((report) => (
                <tr key={report.id} className={`border-b transition-colors ${theme === 'dark' ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-100 hover:bg-gray-50'}`}>
                  <td className="px-3 py-3">
                    <span className="text-xs font-medium text-blue-500">#{report.id}</span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="max-w-xs">
                      <span className={`text-sm font-medium block truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{report.title}</span>
                      <span className={`text-xs block truncate ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>{report.description}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{getTypeIcon(report.type)}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">{getRiskBadge(report.riskLevel)}</td>
                  <td className="px-3 py-3">{getStatusBadge(report.status)}</td>
                  <td className="px-3 py-3">
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{report.reporter.name}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>{formatDateTime(report.createdAt)}</span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className={`p-1.5 rounded-lg transition-colors ${theme === 'dark' ? 'text-gray-500 hover:text-blue-400 hover:bg-gray-700' : 'text-gray-400 hover:text-blue-600 hover:bg-gray-100'}`}
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {report.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(report.id, 'verified')}
                            disabled={isUpdatingId === report.id}
                            className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Duyệt báo cáo"
                          >
                            {isUpdatingId === report.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <InlineSvg src="/lineicons/check-circle.svg" ariaLabel="Duyệt" className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(report.id, 'rejected')}
                            disabled={isUpdatingId === report.id}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Từ chối"
                          >
                            {isUpdatingId === report.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <InlineSvg src="/lineicons/x-circle.svg" ariaLabel="Từ chối" className="w-4 h-4" />}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!isLoading && totalPages > 1 && (
          <div className={`flex items-center justify-between p-4 border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
            <span className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
              Hiển thị {(currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, total)} của {total} báo cáo
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={!canGoPrev}
                className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  theme === 'dark' 
                    ? 'text-gray-500 hover:text-white hover:bg-gray-800' 
                    : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {pageRange.map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={!canGoNext}
                className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {selectedReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedReport(null)}
          >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className={`w-full max-w-2xl rounded-2xl overflow-hidden ${theme === 'dark' ? 'bg-gray-900 border border-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-900'}`}
              >
              <div className={`flex items-center justify-between p-6 border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
                <div>
                  <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Chi tiết báo cáo</h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-1`}>ID: {selectedReport.id}</p>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'text-gray-500 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

                <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Loại</p>
                    <p className="text-white">{getTypeIcon(selectedReport.type)} {selectedReport.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Mức độ rủi ro</p>
                    {getRiskBadge(selectedReport.riskLevel)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Trạng thái</p>
                    {getStatusBadge(selectedReport.status)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Ngày tạo</p>
                    <p className="text-white">{formatDateTime(selectedReport.createdAt)}</p>
                  </div>
                </div>

                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'} mb-1`}>Tiêu đề</p>
                    <p className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-medium`}>{selectedReport.title}</p>
                  </div>

                <div>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'} mb-1`}>Mô tả chi tiết</p>
                  <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{selectedReport.description}</p>
                </div>

                <div>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'} mb-1`}>Đối tượng</p>
                  <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} break-all`}>{selectedReport.target.value}</p>
                </div>

                <div>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'} mb-1`}>Người báo cáo</p>
                  <p className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{selectedReport.reporter.name} ({selectedReport.reporter.email})</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-800">
                {selectedReport.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(selectedReport.id, 'rejected')}
                      disabled={isUpdatingId === selectedReport.id}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors disabled:opacity-50"
                    >
                      Từ chối
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedReport.id, 'verified')}
                      disabled={isUpdatingId === selectedReport.id}
                      className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-xl transition-colors disabled:opacity-50"
                    >
                      Duyệt báo cáo
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

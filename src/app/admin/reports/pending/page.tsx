'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Globe,
  Phone,
  Mail,
  MessageSquare,
  Eye,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface PendingReport {
  id: string;
  title: string;
  type: 'website' | 'phone' | 'email' | 'social' | 'sms';
  riskLevel: 'low' | 'medium' | 'high';
  reporter: {
    name: string;
  };
  createdAt: string;
  status: 'pending' | 'verified' | 'rejected';
}

interface PendingResponse {
  success: boolean;
  error?: string;
  items?: PendingReport[];
}

const typeIcons: Record<string, React.ElementType> = {
  website: Globe,
  phone: Phone,
  email: Mail,
  sms: MessageSquare,
  social: MessageSquare,
};

const riskColors: Record<string, string> = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800',
};

function formatDateTime(input: string): string {
  const t = new Date(input).getTime();
  if (!Number.isFinite(t)) return 'Không rõ';
  return new Date(t).toLocaleString('vi-VN');
}

export default function PendingReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<PendingReport[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'website' | 'phone' | 'email' | 'sms' | 'social'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadPendingReports = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const query = new URLSearchParams({
        q: searchTerm,
        status: 'pending',
        type: filterType,
        page: '1',
        pageSize: '100',
      });

      const response = await fetch(`/api/admin/reports?${query.toString()}`, {
        cache: 'no-store',
      });
      const payload: PendingResponse = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Không thể tải báo cáo chờ duyệt.');
      }

      setReports((payload.items || []).filter((item) => item.status === 'pending'));
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Không thể tải báo cáo chờ duyệt.';
      setError(message);
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, filterType]);

  useEffect(() => {
    loadPendingReports();
  }, [loadPendingReports]);

  const handleUpdate = async (id: string, status: 'verified' | 'rejected') => {
    if (updatingId) return;
    setUpdatingId(id);

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
        throw new Error(payload.error || 'Không thể cập nhật trạng thái.');
      }

      setReports((prev) => prev.filter((item) => item.id !== id));
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : 'Không thể cập nhật trạng thái.';
      setError(message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Báo cáo chờ duyệt</h2>
          <p className="text-gray-400 mt-1">Danh sách báo cáo cần được xử lý ngay</p>
        </div>
        <button
          onClick={loadPendingReports}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm báo cáo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as typeof filterType)}
            className="px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả loại</option>
            <option value="website">Website</option>
            <option value="phone">Số điện thoại</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="social">Mạng xã hội</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 text-red-300 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Loại</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Tiêu đề</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Người báo cáo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Mức độ</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Ngày</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Đang tải dữ liệu...
                  </span>
                </td>
              </tr>
            )}

            {!isLoading && reports.map((report) => {
              const TypeIcon = typeIcons[report.type] || Globe;
              return (
                <tr key={report.id} className="hover:bg-gray-800/40">
                  <td className="px-6 py-4 text-sm font-medium text-blue-400">{report.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <TypeIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-300 capitalize">{report.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-white">{report.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">{report.reporter.name}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${riskColors[report.riskLevel]}`}>
                      {report.riskLevel === 'high' && <AlertTriangle className="w-3 h-3 mr-1" />}
                      {report.riskLevel === 'medium' && <Clock className="w-3 h-3 mr-1" />}
                      {report.riskLevel.charAt(0).toUpperCase() + report.riskLevel.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">{formatDateTime(report.createdAt)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => router.push(`/admin/reports/${report.id}`)}
                        className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleUpdate(report.id, 'verified')}
                        disabled={updatingId === report.id}
                        className="p-1.5 text-green-400 hover:bg-green-500/10 rounded disabled:opacity-50"
                        title="Xác minh"
                      >
                        {updatingId === report.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleUpdate(report.id, 'rejected')}
                        disabled={updatingId === report.id}
                        className="p-1.5 text-red-400 hover:bg-red-500/10 rounded disabled:opacity-50"
                        title="Từ chối"
                      >
                        {updatingId === report.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!isLoading && reports.length === 0 && (
        <div className="text-center py-10 border border-gray-800 rounded-2xl bg-gray-900/40">
          <Clock className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">Không có báo cáo nào chờ duyệt</p>
        </div>
      )}
    </div>
  );
}

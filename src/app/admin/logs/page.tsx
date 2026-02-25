'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  RefreshCcw,
  Search,
  User,
  XCircle,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

type LogStatus = 'success' | 'failed' | 'warning';

interface LogItem {
  id: string;
  action: string;
  user: string;
  ip: string;
  target: string;
  status: LogStatus;
  timestamp: string;
}

interface LogsResponse {
  success: boolean;
  error?: string;
  items: LogItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const statusOptions: { value: 'all' | LogStatus; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'success', label: 'Thành công' },
  { value: 'failed', label: 'Thất bại' },
  { value: 'warning', label: 'Cảnh báo' },
];

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Không rõ';
  return date.toLocaleString('vi-VN');
}

export default function LogsPage() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | LogStatus>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        status: statusFilter,
        page: String(currentPage),
        pageSize: '20',
      });

      const response = await fetch(`/api/admin/logs?${params.toString()}`, { cache: 'no-store' });
      const data = (await response.json()) as LogsResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Không thể tải nhật ký hoạt động');
      }

      setLogs(data.items);
      setTotalPages(data.totalPages);
      setTotalLogs(data.total);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Lỗi tải nhật ký';
      showToast('error', message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, showToast, statusFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const getStatusIcon = (status: LogStatus) => {
    if (status === 'success') return <CheckCircle className="w-4 h-4 text-green-400" />;
    if (status === 'failed') return <XCircle className="w-4 h-4 text-red-400" />;
    return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
  };

  const getStatusBadge = (status: LogStatus) => {
    if (status === 'success') {
      return <span className="px-2 py-0.5 text-xs font-medium rounded bg-green-500/20 text-green-300">Thành công</span>;
    }
    if (status === 'failed') {
      return <span className="px-2 py-0.5 text-xs font-medium rounded bg-red-500/20 text-red-300">Thất bại</span>;
    }
    return <span className="px-2 py-0.5 text-xs font-medium rounded bg-yellow-500/20 text-yellow-300">Cảnh báo</span>;
  };

  const stats = useMemo(() => {
    const success = logs.filter((item) => item.status === 'success').length;
    const failed = logs.filter((item) => item.status === 'failed').length;
    const warning = logs.filter((item) => item.status === 'warning').length;
    return [
      { label: 'Trong trang hiện tại', value: logs.length, tone: 'text-blue-400' },
      { label: 'Thành công', value: success, tone: 'text-green-400' },
      { label: 'Thất bại', value: failed, tone: 'text-red-400' },
      { label: 'Cảnh báo', value: warning, tone: 'text-yellow-400' },
    ];
  }, [logs]);

  const rangeStart = logs.length === 0 ? 0 : (currentPage - 1) * 20 + 1;
  const rangeEnd = logs.length === 0 ? 0 : rangeStart + logs.length - 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Nhật ký hoạt động</h2>
          <p className="text-gray-400 mt-1">Theo dõi đầy đủ các thao tác quản trị</p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl"
        >
          <RefreshCcw className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {stats.map((item) => (
          <div key={item.label} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4">
            <p className="text-sm text-gray-400">{item.label}</p>
            <p className={`text-2xl font-bold mt-1 ${item.tone}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tìm kiếm theo hành động, người dùng, IP, đối tượng..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'all' | LogStatus)}
            className="px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white"
          >
            {statusOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left p-4 text-sm font-medium text-gray-400">Thời gian</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Hành động</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Người dùng</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">IP</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Đối tượng</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-400">
                    Đang tải nhật ký...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-400">
                    Không có bản ghi phù hợp bộ lọc.
                  </td>
                </tr>
              ) : (
                logs.map((item) => (
                  <tr key={item.id} className="border-b border-gray-800 hover:bg-gray-800/40">
                    <td className="p-4 text-sm text-gray-300">
                      <span className="inline-flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        {formatDateTime(item.timestamp)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-2 text-white">
                        <Activity className="w-4 h-4 text-gray-500" />
                        {item.action}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-white">
                      <span className="inline-flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        {item.user}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-400">{item.ip}</td>
                    <td className="p-4 text-sm text-gray-400">{item.target}</td>
                    <td className="p-4">
                      <div className="inline-flex items-center gap-2">
                        {getStatusIcon(item.status)}
                        {getStatusBadge(item.status)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-gray-800">
          <span className="text-sm text-gray-500">
            Hiển thị {rangeStart}-{rangeEnd} / {totalLogs}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 text-gray-500 hover:text-white disabled:opacity-40"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-400">
              Trang {currentPage}/{totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
              className="p-2 text-gray-500 hover:text-white disabled:opacity-40"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

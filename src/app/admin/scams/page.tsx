'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  Globe,
  Mail,
  Phone,
  Plus,
  RefreshCcw,
  Search,
  Shield,
  Trash2,
  X,
  Building,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

type ScamType = 'website' | 'phone' | 'email' | 'bank';
type ScamRisk = 'low' | 'medium' | 'high';
type ScamStatus = 'active' | 'investigating' | 'blocked';

interface ScamItem {
  id: string;
  type: ScamType;
  value: string;
  description: string;
  reportCount: number;
  riskLevel: ScamRisk;
  status: ScamStatus;
  source: string;
  createdAt: string;
  updatedAt: string;
}

interface ScamsResponse {
  success: boolean;
  error?: string;
  items: ScamItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: {
    total: number;
    active: number;
    investigating: number;
    blocked: number;
  };
}

interface ScamDetailResponse {
  success: boolean;
  error?: string;
  item: ScamItem;
}

const typeOptions: { value: 'all' | ScamType; label: string }[] = [
  { value: 'all', label: 'Tất cả loại' },
  { value: 'website', label: 'Website' },
  { value: 'phone', label: 'Điện thoại' },
  { value: 'email', label: 'Email' },
  { value: 'bank', label: 'Ngân hàng' },
];

const statusOptions: { value: 'all' | ScamStatus; label: string }[] = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Hoạt động' },
  { value: 'investigating', label: 'Điều tra' },
  { value: 'blocked', label: 'Đã chặn' },
];

const riskOptions: { value: 'all' | ScamRisk; label: string }[] = [
  { value: 'all', label: 'Tất cả mức độ' },
  { value: 'low', label: 'Thấp' },
  { value: 'medium', label: 'Trung bình' },
  { value: 'high', label: 'Cao' },
];

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Không rõ';
  return date.toLocaleDateString('vi-VN');
}

function getTypeIcon(type: ScamType) {
  if (type === 'website') return Globe;
  if (type === 'phone') return Phone;
  if (type === 'email') return Mail;
  return Building;
}

export default function ScamsPage() {
  const { showToast } = useToast();
  const [scams, setScams] = useState<ScamItem[]>([]);
  const [summary, setSummary] = useState<ScamsResponse['summary']>({
    total: 0,
    active: 0,
    investigating: 0,
    blocked: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | ScamType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ScamStatus>('all');
  const [riskFilter, setRiskFilter] = useState<'all' | ScamRisk>('all');
  const [selectedScam, setSelectedScam] = useState<ScamItem | null>(null);
  const [editingDescription, setEditingDescription] = useState('');
  const [editingStatus, setEditingStatus] = useState<ScamStatus>('investigating');
  const [editingRisk, setEditingRisk] = useState<ScamRisk>('medium');
  const [editingReportCount, setEditingReportCount] = useState(0);
  const [editingSource, setEditingSource] = useState('community');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    type: 'website' as ScamType,
    value: '',
    description: '',
    riskLevel: 'medium' as ScamRisk,
    status: 'investigating' as ScamStatus,
    source: 'admin_manual',
  });

  useEffect(() => {
    if (!selectedScam) return;
    setEditingDescription(selectedScam.description);
    setEditingStatus(selectedScam.status);
    setEditingRisk(selectedScam.riskLevel);
    setEditingReportCount(selectedScam.reportCount);
    setEditingSource(selectedScam.source);
  }, [selectedScam]);

  const fetchScams = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        type: typeFilter,
        status: statusFilter,
        riskLevel: riskFilter,
        page: String(currentPage),
        pageSize: '10',
      });

      const response = await fetch(`/api/admin/scams?${params.toString()}`, { cache: 'no-store' });
      const data = (await response.json()) as ScamsResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Không thể tải dữ liệu scams');
      }

      setScams(data.items);
      setSummary(data.summary);
      setTotalPages(data.totalPages);
      setTotalItems(data.total);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Lỗi tải danh sách scam';
      showToast('error', message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, riskFilter, searchQuery, showToast, statusFilter, typeFilter]);

  useEffect(() => {
    fetchScams();
  }, [fetchScams]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, statusFilter, riskFilter]);

  const updateScam = useCallback(
    async (id: string, payload: Partial<Pick<ScamItem, 'description' | 'status' | 'riskLevel' | 'reportCount' | 'source'>>, successMessage: string) => {
      setActionId(id);
      try {
        const response = await fetch(`/api/admin/scams/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = (await response.json()) as ScamDetailResponse;
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Không thể cập nhật dữ liệu scam');
        }

        if (selectedScam?.id === id) {
          setSelectedScam(data.item);
        }

        showToast('success', successMessage);
        await fetchScams();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Cập nhật scam thất bại';
        showToast('error', message);
      } finally {
        setActionId(null);
      }
    },
    [fetchScams, selectedScam?.id, showToast]
  );

  const deleteScam = useCallback(
    async (id: string) => {
      if (!window.confirm('Bạn chắc chắn muốn xóa mục scam này?')) return;

      setActionId(id);
      try {
        const response = await fetch(`/api/admin/scams/${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
        const data = (await response.json()) as { success: boolean; error?: string };

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Không thể xóa mục scam');
        }

        if (selectedScam?.id === id) {
          setSelectedScam(null);
        }

        showToast('success', 'Đã xóa mục scam');
        await fetchScams();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Xóa mục scam thất bại';
        showToast('error', message);
      } finally {
        setActionId(null);
      }
    },
    [fetchScams, selectedScam?.id, showToast]
  );

  const createScam = useCallback(async () => {
    if (!createForm.value.trim() || !createForm.description.trim()) {
      showToast('warning', 'Vui lòng nhập đầy đủ dữ liệu và mô tả');
      return;
    }

    try {
      const response = await fetch('/api/admin/scams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      const data = (await response.json()) as ScamDetailResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Không thể tạo mục scam mới');
      }

      setCreateOpen(false);
      setCreateForm({
        type: 'website',
        value: '',
        description: '',
        riskLevel: 'medium',
        status: 'investigating',
        source: 'admin_manual',
      });

      showToast('success', 'Đã thêm mục scam mới');
      await fetchScams();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Tạo mục scam thất bại';
      showToast('error', message);
    }
  }, [createForm, fetchScams, showToast]);

  const summaryCards = useMemo(
    () => [
      { label: 'Tổng mục scam', value: summary.total, tone: 'text-blue-400' },
      { label: 'Đang theo dõi', value: summary.active, tone: 'text-green-400' },
      { label: 'Đang điều tra', value: summary.investigating, tone: 'text-yellow-400' },
      { label: 'Đã chặn', value: summary.blocked, tone: 'text-red-400' },
    ],
    [summary]
  );

  const getRiskBadge = (risk: ScamRisk) => {
    const map: Record<ScamRisk, { label: string; className: string }> = {
      low: { label: 'Thấp', className: 'bg-green-500/20 text-green-300' },
      medium: { label: 'Trung bình', className: 'bg-yellow-500/20 text-yellow-300' },
      high: { label: 'Cao', className: 'bg-red-500/20 text-red-300' },
    };
    const item = map[risk];
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.className}`}>{item.label}</span>;
  };

  const getStatusBadge = (status: ScamStatus) => {
    const map: Record<ScamStatus, { label: string; className: string }> = {
      active: { label: 'Hoạt động', className: 'bg-green-500/20 text-green-300' },
      investigating: { label: 'Điều tra', className: 'bg-blue-500/20 text-blue-300' },
      blocked: { label: 'Đã chặn', className: 'bg-red-500/20 text-red-300' },
    };
    const item = map[status];
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.className}`}>{item.label}</span>;
  };

  const rangeStart = scams.length === 0 ? 0 : (currentPage - 1) * 10 + 1;
  const rangeEnd = scams.length === 0 ? 0 : rangeStart + scams.length - 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Scam Database</h2>
          <p className="text-gray-400 mt-1">Cơ sở dữ liệu cảnh báo lừa đảo</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchScams}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl"
          >
            <RefreshCcw className="w-4 h-4" />
            Làm mới
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl"
          >
            <Plus className="w-4 h-4" />
            Thêm mới
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {summaryCards.map((item) => (
          <div key={item.label} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4">
            <p className="text-sm text-gray-400">{item.label}</p>
            <p className={`text-2xl font-bold mt-1 ${item.tone}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4">
        <div className="flex flex-col xl:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tìm theo ID, dữ liệu, mô tả..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as 'all' | ScamType)}
            className="px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white"
          >
            {typeOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'all' | ScamStatus)}
            className="px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white"
          >
            {statusOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <select
            value={riskFilter}
            onChange={(event) => setRiskFilter(event.target.value as 'all' | ScamRisk)}
            className="px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white"
          >
            {riskOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left p-4 text-sm font-medium text-gray-400">ID</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Loại</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Dữ liệu</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Mô tả</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Báo cáo</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Mức độ</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Trạng thái</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Cập nhật</th>
                <th className="text-right p-4 text-sm font-medium text-gray-400">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-gray-400">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : scams.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-gray-400">
                    Không có mục scam phù hợp bộ lọc.
                  </td>
                </tr>
              ) : (
                scams.map((item) => {
                  const Icon = getTypeIcon(item.type);
                  const pending = actionId === item.id;

                  return (
                    <tr key={item.id} className="border-b border-gray-800 hover:bg-gray-800/40">
                      <td className="p-4 text-sm font-semibold text-blue-300">{item.id}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-2 text-gray-300 text-sm">
                          <Icon className="w-4 h-4" />
                          {typeOptions.find((opt) => opt.value === item.type)?.label || item.type}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <code className="text-xs text-white bg-gray-800 px-2 py-1 rounded max-w-[230px] truncate">{item.value}</code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(item.value);
                              showToast('success', 'Đã sao chép dữ liệu');
                            }}
                            className="p-1 text-gray-500 hover:text-white"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-300 max-w-[300px] truncate">{item.description}</td>
                      <td className="p-4 text-sm text-white">{item.reportCount}</td>
                      <td className="p-4">{getRiskBadge(item.riskLevel)}</td>
                      <td className="p-4">{getStatusBadge(item.status)}</td>
                      <td className="p-4 text-sm text-gray-400">{formatDate(item.updatedAt)}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedScam(item)}
                            className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() =>
                              updateScam(
                                item.id,
                                { status: item.status === 'blocked' ? 'investigating' : 'blocked' },
                                item.status === 'blocked' ? 'Đã mở lại theo dõi' : 'Đã chuyển trạng thái chặn'
                              )
                            }
                            disabled={pending}
                            className="p-2 text-gray-500 hover:text-yellow-300 hover:bg-yellow-500/10 rounded-lg disabled:opacity-40"
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => deleteScam(item.id)}
                            disabled={pending}
                            className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg disabled:opacity-40"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-gray-800">
          <span className="text-sm text-gray-500">
            Hiển thị {rangeStart}-{rangeEnd} / {totalItems}
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
      </div>

      <AnimatePresence>
        {createOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            onClick={() => setCreateOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-xl bg-gray-900 border border-gray-800 rounded-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <h3 className="text-xl font-semibold text-white">Thêm mục scam mới</h3>
                <button onClick={() => setCreateOpen(false)} className="p-2 text-gray-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-3">
                <input
                  value={createForm.value}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, value: event.target.value }))}
                  placeholder="Dữ liệu nhận diện (domain, số điện thoại, email, tài khoản...)"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white"
                />

                <textarea
                  value={createForm.description}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))}
                  rows={3}
                  placeholder="Mô tả cảnh báo"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white"
                />

                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={createForm.type}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, type: event.target.value as ScamType }))}
                    className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white"
                  >
                    {typeOptions
                      .filter((item): item is { value: ScamType; label: string } => item.value !== 'all')
                      .map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                  </select>

                  <select
                    value={createForm.riskLevel}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, riskLevel: event.target.value as ScamRisk }))}
                    className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white"
                  >
                    {riskOptions
                      .filter((item): item is { value: ScamRisk; label: string } => item.value !== 'all')
                      .map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                  </select>

                  <select
                    value={createForm.status}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, status: event.target.value as ScamStatus }))}
                    className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white"
                  >
                    {statusOptions
                      .filter((item): item is { value: ScamStatus; label: string } => item.value !== 'all')
                      .map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                  </select>

                  <input
                    value={createForm.source}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, source: event.target.value }))}
                    placeholder="Nguồn"
                    className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-800">
                <button onClick={() => setCreateOpen(false)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl">
                  Hủy
                </button>
                <button onClick={createScam} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl">
                  Tạo mới
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedScam && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            onClick={() => setSelectedScam(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <div>
                  <h3 className="text-xl font-semibold text-white">Chi tiết dữ liệu scam</h3>
                  <p className="text-sm text-gray-400">ID: {selectedScam.id}</p>
                </div>
                <button onClick={() => setSelectedScam(null)} className="p-2 text-gray-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/50">
                  <p className="text-xs text-gray-500 mb-1">Dữ liệu</p>
                  <p className="text-white font-medium break-all">{selectedScam.value}</p>
                </div>

                <textarea
                  value={editingDescription}
                  onChange={(event) => setEditingDescription(event.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white"
                />

                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={editingStatus}
                    onChange={(event) => setEditingStatus(event.target.value as ScamStatus)}
                    className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white"
                  >
                    {statusOptions
                      .filter((item): item is { value: ScamStatus; label: string } => item.value !== 'all')
                      .map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                  </select>

                  <select
                    value={editingRisk}
                    onChange={(event) => setEditingRisk(event.target.value as ScamRisk)}
                    className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white"
                  >
                    {riskOptions
                      .filter((item): item is { value: ScamRisk; label: string } => item.value !== 'all')
                      .map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                  </select>

                  <input
                    type="number"
                    min={0}
                    value={editingReportCount}
                    onChange={(event) => setEditingReportCount(Number(event.target.value || 0))}
                    className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white"
                  />

                  <input
                    value={editingSource}
                    onChange={(event) => setEditingSource(event.target.value)}
                    className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-800/30 p-3 rounded-xl border border-gray-700/50">
                    <p className="text-gray-500">Tạo lúc</p>
                    <p className="text-white mt-1">{formatDate(selectedScam.createdAt)}</p>
                  </div>
                  <div className="bg-gray-800/30 p-3 rounded-xl border border-gray-700/50">
                    <p className="text-gray-500">Cập nhật</p>
                    <p className="text-white mt-1">{formatDate(selectedScam.updatedAt)}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-6 border-t border-gray-800">
                <div className="inline-flex items-center gap-2 text-xs text-gray-500">
                  <Shield className="w-4 h-4" />
                  Chỉ admin mới được chỉnh sửa dữ liệu.
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedScam(null)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl">
                    Đóng
                  </button>
                  <button
                    onClick={() =>
                      updateScam(
                        selectedScam.id,
                        {
                          description: editingDescription,
                          status: editingStatus,
                          riskLevel: editingRisk,
                          reportCount: editingReportCount,
                          source: editingSource,
                        },
                        'Đã cập nhật thông tin scam'
                      )
                    }
                    disabled={actionId === selectedScam.id}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl"
                  >
                    Lưu thay đổi
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

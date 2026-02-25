'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  AlertTriangle,
  User,
  Download,
  CheckCircle,
  XCircle,
  Loader2,
  Save,
} from 'lucide-react';

interface ReportDetail {
  id: string;
  title: string;
  type: 'website' | 'phone' | 'email' | 'social' | 'sms';
  status: 'pending' | 'verified' | 'rejected';
  riskLevel: 'low' | 'medium' | 'high';
  description: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  adminNotes: string;
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
  history: Array<{
    action: string;
    user: string;
    date: string;
    note?: string;
  }>;
}

interface DetailResponse {
  success: boolean;
  error?: string;
  item?: ReportDetail;
}

function formatDateTime(input: string): string {
  const t = new Date(input).getTime();
  if (!Number.isFinite(t)) return 'Không rõ';
  return new Date(t).toLocaleString('vi-VN');
}

const statusConfig: Record<ReportDetail['status'], { label: string; className: string }> = {
  pending: { label: 'Chờ duyệt', className: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  verified: { label: 'Đã xác minh', className: 'bg-green-500/20 text-green-300 border-green-500/30' },
  rejected: { label: 'Từ chối', className: 'bg-red-500/20 text-red-300 border-red-500/30' },
};

export default function ReportDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const reportId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [report, setReport] = useState<ReportDetail | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [error, setError] = useState('');

  const loadDetail = useCallback(async () => {
    if (!reportId) return;
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/reports/${encodeURIComponent(reportId)}`, {
        cache: 'no-store',
      });
      const payload: DetailResponse = await response.json();

      if (!response.ok || !payload.success || !payload.item) {
        throw new Error(payload.error || 'Không thể tải chi tiết báo cáo.');
      }

      setReport(payload.item);
      setAdminNotes(payload.item.adminNotes || '');
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Không thể tải chi tiết báo cáo.';
      setError(message);
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const handleUpdateStatus = async (status: 'verified' | 'rejected') => {
    if (!report || isUpdating) return;

    setIsUpdating(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/reports/${encodeURIComponent(report.id)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const payload: DetailResponse = await response.json();
      if (!response.ok || !payload.success || !payload.item) {
        throw new Error(payload.error || 'Không thể cập nhật trạng thái.');
      }

      setReport(payload.item);
      setAdminNotes(payload.item.adminNotes || '');
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : 'Không thể cập nhật trạng thái.';
      setError(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!report || isSavingNotes) return;

    setIsSavingNotes(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/reports/${encodeURIComponent(report.id)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminNotes }),
      });

      const payload: DetailResponse = await response.json();
      if (!response.ok || !payload.success || !payload.item) {
        throw new Error(payload.error || 'Không thể lưu ghi chú.');
      }

      setReport(payload.item);
      setAdminNotes(payload.item.adminNotes || '');
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Không thể lưu ghi chú.';
      setError(message);
    } finally {
      setIsSavingNotes(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-8 text-center text-gray-300">
        <span className="inline-flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Đang tải chi tiết báo cáo...
        </span>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.push('/admin/reports')}
          className="inline-flex items-center gap-2 text-gray-300 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
        </button>
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-6 text-red-300">
          {error || 'Không tìm thấy báo cáo.'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin/reports')}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white">Chi tiết báo cáo #{report.id}</h2>
            <p className="text-gray-400">Cập nhật: {formatDateTime(report.updatedAt)}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors">
            <Download className="w-4 h-4" /> Xuất PDF
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 text-red-300 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-6">
        <div className="space-y-6">
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className={`p-3 rounded-xl ${report.riskLevel === 'high' ? 'bg-red-500/20' : report.riskLevel === 'medium' ? 'bg-yellow-500/20' : 'bg-green-500/20'}`}>
                  <AlertTriangle className={`w-5 h-5 ${report.riskLevel === 'high' ? 'text-red-300' : report.riskLevel === 'medium' ? 'text-yellow-300' : 'text-green-300'}`} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xl font-semibold text-white break-words">{report.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">Loại: {report.type} • Nguồn: {report.source}</p>
                </div>
              </div>
              <span className={`shrink-0 inline-flex px-2.5 py-1 rounded-full border text-xs font-medium ${statusConfig[report.status].className}`}>
                {statusConfig[report.status].label}
              </span>
            </div>

            <p className="text-gray-300 leading-relaxed">{report.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="rounded-xl border border-gray-800 bg-gray-800/40 p-4">
                <p className="text-xs text-gray-500">Đối tượng</p>
                <p className="text-sm text-white mt-1 break-all">{report.target.value}</p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-gray-800/40 p-4">
                <p className="text-xs text-gray-500">Ngày tạo</p>
                <p className="text-sm text-white mt-1">{formatDateTime(report.createdAt)}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Lịch sử xử lý</h3>
            <div className="space-y-3">
              {report.history.map((item, idx) => (
                <div key={`${item.action}-${item.date}-${idx}`} className="rounded-lg border border-gray-800 bg-gray-800/30 px-3 py-2.5">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
                    <p className="text-sm text-white">{item.action}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(item.date)}</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Thực hiện bởi: {item.user}</p>
                  {item.note && <p className="text-xs text-gray-300 mt-1">Ghi chú: {item.note}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Người báo cáo</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <User className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <p className="text-white font-medium">{report.reporter.name}</p>
                <p className="text-xs text-gray-400">{report.reporter.email}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Thao tác xử lý</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleUpdateStatus('verified')}
                disabled={report.status !== 'pending' || isUpdating}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Xác minh
              </button>
              <button
                onClick={() => handleUpdateStatus('rejected')}
                disabled={report.status !== 'pending' || isUpdating}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Từ chối
              </button>
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Ghi chú admin</h3>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="w-full p-3 bg-gray-800/60 border border-gray-700 rounded-lg h-28 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập ghi chú xử lý..."
            />
            <button
              onClick={handleSaveNotes}
              disabled={isSavingNotes}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {isSavingNotes ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Lưu ghi chú
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

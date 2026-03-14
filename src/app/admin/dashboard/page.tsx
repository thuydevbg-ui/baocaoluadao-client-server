'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Database, FileWarning, RefreshCw } from 'lucide-react';
import StatsCards, { type StatCardItem } from '@/components/admin/StatsCards';

type OverviewPayload = {
  reports: {
    total: number;
    pending: number;
    verified: number;
    rejected: number;
  };
  scams: {
    total: number;
    active: number;
    blocked: number;
  };
  recentReports: Array<{
    id: string;
    type: string;
    target: string;
    status: string;
    created_at: string;
  }>;
  reportTypes: Array<{
    type: string;
    count: number;
  }>;
};

const fallbackOverview: OverviewPayload = {
  reports: { total: 0, pending: 0, verified: 0, rejected: 0 },
  scams: { total: 0, active: 0, blocked: 0 },
  recentReports: [],
  reportTypes: [],
};

type SyncSummary = {
  source: string;
  startedAt: string;
  completedAt: string;
  pagesSynced: number;
  recordsSynced: number;
};

type IconBackfillSummary = {
  source: string;
  startedAt: string;
  completedAt: string;
  totalTargets: number;
  resolvedTargets: number;
  remainingTargets: number;
  scannedPages: number;
  updatedRows: number;
  categoriesScanned: string[];
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('vi-VN');
}

function statusTone(status: string) {
  if (status === 'verified' || status === 'completed') return 'bg-emerald-100 text-emerald-700';
  if (status === 'rejected') return 'bg-rose-100 text-rose-700';
  if (status === 'processing') return 'bg-blue-100 text-blue-700';
  return 'bg-amber-100 text-amber-700';
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [overview, setOverview] = useState<OverviewPayload>(fallbackOverview);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [syncMessage, setSyncMessage] = useState('');
  const [syncSummary, setSyncSummary] = useState<SyncSummary | null>(null);
  const [iconResyncing, setIconResyncing] = useState(false);
  const [iconResyncError, setIconResyncError] = useState('');
  const [iconResyncMessage, setIconResyncMessage] = useState('');
  const [iconBackfillSummary, setIconBackfillSummary] = useState<IconBackfillSummary | null>(null);

  const loadIconBackfillSnapshot = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/scams/resync-icons', {
        method: 'GET',
        cache: 'no-store',
        credentials: 'include',
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) return;
      const snapshot = payload.snapshot;
      setIconResyncing(Boolean(snapshot?.running));
      setIconBackfillSummary(snapshot?.lastSummary || null);
    } catch {
      // Silent fail; not critical for dashboard load.
    }
  }, []);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/overview', {
        cache: 'no-store',
        credentials: 'include',
      });

      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error?.message || 'Failed to load overview');
      }

      setOverview(payload.data || fallbackOverview);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load overview');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
    void loadIconBackfillSnapshot();
  }, [loadIconBackfillSnapshot, loadOverview]);

  const handleSyncNow = useCallback(async () => {
    if (syncing) return;

    setSyncing(true);
    setSyncError('');
    setSyncMessage('');

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch('/api/admin/scams/sync', {
        method: 'POST',
        credentials: 'include',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      let payload: any = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok || !payload?.success) {
        const reason = payload?.error || (response.status === 504 ? 'Sync request timed out' : `Sync failed (${response.status})`);
        throw new Error(reason);
      }

      const summary = payload.summary as SyncSummary | undefined;
      if (summary) {
        setSyncSummary(summary);
        setSyncMessage(payload.message || 'Sync completed successfully.');
      } else {
        setSyncSummary(null);
        setSyncMessage(payload.message || 'Sync started in background. This may take a few minutes.');
      }

      await loadOverview();
    } catch (syncNowError) {
      setSyncError(syncNowError instanceof Error ? syncNowError.message : 'Sync failed');
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      setSyncing(false);
    }
  }, [loadOverview, syncing]);

  const handleResyncIconsOnly = useCallback(async () => {
    if (iconResyncing) return;

    setIconResyncing(true);
    setIconResyncError('');
    setIconResyncMessage('');

    try {
      const response = await fetch('/api/admin/scams/resync-icons', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || `Resync icons failed (${response.status})`);
      }

      setIconResyncMessage(payload.message || 'Icon resync started in background.');
      const snapshot = payload.snapshot;
      setIconResyncing(Boolean(snapshot?.running));
      setIconBackfillSummary(snapshot?.lastSummary || null);

      setTimeout(() => {
        void loadIconBackfillSnapshot();
      }, 3000);
    } catch (resyncError) {
      setIconResyncError(resyncError instanceof Error ? resyncError.message : 'Resync icons failed');
      setIconResyncing(false);
    }
  }, [iconResyncing, loadIconBackfillSnapshot]);

  const statItems = useMemo<StatCardItem[]>(
    () => [
      {
        id: 'pending-reports',
        title: 'Báo cáo chờ duyệt',
        value: overview.reports.pending,
        subtitle: 'Đang chờ quản trị viên xem xét',
        icon: AlertTriangle,
        tone: 'amber',
      },
      {
        id: 'verified-entities',
        title: 'Đã xác minh',
        value: overview.reports.verified,
        subtitle: 'Đã được xác thực là đáng tin cậy',
        icon: CheckCircle2,
        tone: 'emerald',
      },
      {
        id: 'rejected-reports',
        title: 'Báo cáo bị từ chối',
        value: overview.reports.rejected,
        subtitle: 'Bị đóng là không hợp lệ hoặc trùng lặp',
        icon: FileWarning,
        tone: 'rose',
      },
      {
        id: 'total-records',
        title: 'Tổng số bản ghi',
        value: overview.reports.total,
        subtitle: 'Tất cả các báo cáo trong hệ thống',
        icon: Database,
        tone: 'sky',
      },
    ],
    [overview]
  );

  const totalTypes = overview.reportTypes.reduce((sum, item) => sum + item.count, 0) || 1;

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">TinNhiemMang Data Sync</h2>
            <p className="text-xs text-slate-500">
              Pull toàn bộ dữ liệu mới từ tinnhiemmang.vn vào database nội bộ.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResyncIconsOnly}
              disabled={iconResyncing}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${iconResyncing ? 'animate-spin' : ''}`} />
              {iconResyncing ? 'Đang cập nhật icon...' : 'Cập nhật icon'}
            </button>
            <button
              type="button"
              onClick={handleSyncNow}
              disabled={syncing}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}
            </button>
          </div>
        </div>

        {iconResyncError && (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {iconResyncError}
          </p>
        )}
        {iconResyncMessage && !iconResyncError && (
          <p className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-700">
            {iconResyncMessage}
          </p>
        )}
        {syncError && (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {syncError}
          </p>
        )}
        {syncMessage && !syncError && (
          <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {syncMessage}
          </p>
        )}
        {syncSummary && (
          <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-600 sm:grid-cols-3">
            <div className="rounded-lg bg-slate-50 px-3 py-2">
              <span className="font-semibold text-slate-800">Trang:</span> {syncSummary.pagesSynced}
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2">
              <span className="font-semibold text-slate-800">Bản ghi:</span> {syncSummary.recordsSynced}
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2">
              <span className="font-semibold text-slate-800">Hoàn thành:</span> {formatDate(syncSummary.completedAt)}
            </div>
          </div>
        )}
        {iconBackfillSummary && (
          <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-600 sm:grid-cols-3">
            <div className="rounded-lg bg-indigo-50 px-3 py-2">
              <span className="font-semibold text-slate-800">Đã cập nhật icon:</span> {iconBackfillSummary.updatedRows}
            </div>
            <div className="rounded-lg bg-indigo-50 px-3 py-2">
              <span className="font-semibold text-slate-800">Đã xử lý:</span> {iconBackfillSummary.resolvedTargets}/{iconBackfillSummary.totalTargets}
            </div>
            <div className="rounded-lg bg-indigo-50 px-3 py-2">
              <span className="font-semibold text-slate-800">Hoàn thành:</span> {formatDate(iconBackfillSummary.completedAt)}
            </div>
          </div>
        )}
      </section>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <StatsCards items={statItems} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <section className="xl:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Báo cáo mới nhất</h2>
            <p className="text-xs text-slate-500">Các báo cáo mới nhất từ người dùng</p>
          </div>

          <div className="divide-y divide-slate-100">
            {loading && <p className="px-5 py-6 text-sm text-slate-500">Đang tải báo cáo mới nhất...</p>}
            {!loading && overview.recentReports.length === 0 && (
              <p className="px-5 py-6 text-sm text-slate-500">Không có báo cáo nào.</p>
            )}
            {!loading &&
              overview.recentReports.map((report) => (
                <article key={report.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 break-words">{report.target}</p>
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        {report.type} • {report.id}
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusTone(
                        report.status
                      )}`}
                    >
                      {report.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(report.created_at)}</p>
                </article>
              ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
          <h2 className="text-sm font-semibold text-slate-900">Phân bố loại báo cáo</h2>
          <p className="text-xs text-slate-500">Các loại báo cáo trong hệ thống</p>

          <div className="mt-4 space-y-3">
            {loading && <p className="text-sm text-slate-500">Đang tải phân bố...</p>}
            {!loading && overview.reportTypes.length === 0 && (
              <p className="text-sm text-slate-500">Chưa có dữ liệu phân bố.</p>
            )}
            {!loading &&
              overview.reportTypes.map((entry) => {
                const percent = Math.round((entry.count / totalTypes) * 100);
                return (
                  <div key={entry.type}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium uppercase tracking-wide text-slate-600">{entry.type}</span>
                      <span className="text-slate-500">{entry.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-slate-700" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      </div>
    </div>
  );
}

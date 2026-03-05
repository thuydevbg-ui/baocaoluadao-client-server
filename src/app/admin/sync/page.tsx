'use client';

import React, { useCallback, useState } from 'react';
import { CheckCircle2, RefreshCw } from 'lucide-react';

type SyncSummary = {
  source: string;
  startedAt: string;
  completedAt: string;
  pagesSynced: number;
  recordsSynced: number;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('vi-VN');
}

export default function AdminSyncPage() {
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [syncMessage, setSyncMessage] = useState('');
  const [syncSummary, setSyncSummary] = useState<SyncSummary | null>(null);

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
    } catch (syncNowError) {
      setSyncError(syncNowError instanceof Error ? syncNowError.message : 'Sync failed');
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      setSyncing(false);
    }
  }, [syncing]);

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">TinNhiemMang Data Sync</h2>
            <p className="text-sm leading-relaxed text-slate-600 break-words">
              Đồng bộ toàn bộ dữ liệu tinnhiemmang.vn vào database nội bộ để hệ thống vận hành độc lập.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSyncNow}
            disabled={syncing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>

        {syncError && (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm leading-relaxed text-rose-700 break-words">
            {syncError}
          </p>
        )}
        {syncMessage && !syncError && (
          <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm leading-relaxed text-emerald-700 break-words">
            {syncMessage}
          </p>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
        <h3 className="text-sm font-semibold text-slate-900">Latest Sync Result</h3>
        <p className="text-sm leading-relaxed text-slate-500 break-words">
          Kết quả lần đồng bộ gần nhất từ nguồn bên ngoài.
        </p>

        {!syncSummary && (
          <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
            Chưa có phiên đồng bộ trong phiên làm việc này. Nhấn <span className="font-medium">Sync Now</span> để bắt đầu.
          </div>
        )}

        {syncSummary && (
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Source</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 break-words">{syncSummary.source}</p>
            </article>
            <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Pages Synced</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{syncSummary.pagesSynced}</p>
            </article>
            <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Records Synced</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{syncSummary.recordsSynced}</p>
            </article>
            <article className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs uppercase tracking-wide text-emerald-700">Status</p>
              <p className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Completed
              </p>
            </article>

            <article className="rounded-lg border border-slate-200 bg-white p-4 md:col-span-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Started</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{formatDate(syncSummary.startedAt)}</p>
            </article>
            <article className="rounded-lg border border-slate-200 bg-white p-4 md:col-span-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Completed</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{formatDate(syncSummary.completedAt)}</p>
            </article>
          </div>
        )}
      </section>
    </div>
  );
}

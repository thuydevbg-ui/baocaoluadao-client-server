'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileX2, Files } from 'lucide-react';
import StatsCards, { type StatCardItem } from '@/components/admin/StatsCards';
import FilterBar from '@/components/admin/FilterBar';
import ReportTable from '@/components/admin/ReportTable';
import ReportPanel from '@/components/admin/ReportPanel';
import {
  ModerationReport,
  ReportAction,
  ReportSortKey,
  SortDirection,
  ReportStatus,
  ReportType,
} from '@/components/admin/reportTypes';

type Summary = {
  pending: number;
  processing?: number;
  verified: number;
  rejected: number;
  completed?: number;
};

type ReportsResponse = {
  items: ModerationReport[];
  total: number;
  page: number;
  totalPages: number;
  summary: Summary;
};

const PAGE_SIZE = 12;

const statusOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'verified', label: 'Verified' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'completed', label: 'Completed' },
];

const typeOptions = [
  { value: 'all', label: 'All types' },
  { value: 'website', label: 'Website' },
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
  { value: 'social', label: 'Social' },
  { value: 'sms', label: 'SMS' },
  { value: 'bank', label: 'Bank' },
  { value: 'device', label: 'Device' },
  { value: 'system', label: 'System' },
  { value: 'application', label: 'Application' },
  { value: 'organization', label: 'Organization' },
];

function parseStatusFilter(value: string): 'all' | ReportStatus {
  if (['pending', 'processing', 'verified', 'rejected', 'completed'].includes(value)) {
    return value as ReportStatus;
  }
  return 'all';
}

function parseTypeFilter(value: string): 'all' | ReportType {
  if (
    [
      'website',
      'phone',
      'email',
      'social',
      'sms',
      'bank',
      'device',
      'system',
      'application',
      'organization',
    ].includes(value)
  ) {
    return value as ReportType;
  }
  return 'all';
}

type ReportsClientProps = {
  initialStatus?: 'all' | ReportStatus;
  initialType?: 'all' | ReportType;
};

export default function ReportsClient({ initialStatus = 'all', initialType = 'all' }: ReportsClientProps) {
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<ModerationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [statusValue, setStatusValue] = useState<'all' | ReportStatus>(initialStatus);
  const [typeValue, setTypeValue] = useState<'all' | ReportType>(initialType);
  const [sortKey, setSortKey] = useState<ReportSortKey>('created');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<Summary>({ pending: 0, verified: 0, rejected: 0 });
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);

  useEffect(() => {
    setStatusValue(initialStatus);
    setTypeValue(initialType);
    setPage(1);
  }, [initialStatus, initialType]);

  useEffect(() => {
    setPage(1);
  }, [searchValue, statusValue, typeValue]);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const query = new URLSearchParams({
        q: searchValue,
        status: statusValue,
        type: typeValue,
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });

      const response = await fetch(`/api/admin/reports?${query.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const payload = await response.json();

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error?.message || payload?.error || 'Unable to load reports');
      }

      const data: ReportsResponse = payload?.data;
      setReports(Array.isArray(data?.items) ? data.items : []);
      setTotal(data?.total || 0);
      setTotalPages(data?.totalPages || 1);
      setSummary(data?.summary || { pending: 0, verified: 0, rejected: 0 });

      if (selectedReport) {
        const latestSelected = (data?.items || []).find((item) => item.id === selectedReport.id) || null;
        setSelectedReport(latestSelected);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load reports');
      setReports([]);
      setTotal(0);
      setTotalPages(1);
      if (selectedReport) setSelectedReport(null);
    } finally {
      setLoading(false);
    }
  }, [page, searchValue, selectedReport, statusValue, typeValue]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const sortedReports = useMemo(() => {
    const copy = [...reports];

    copy.sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1;

      const getComparableValue = (report: ModerationReport) => {
        switch (sortKey) {
          case 'id':
            return report.id;
          case 'target':
            return report.target.value;
          case 'type':
            return report.type;
          case 'risk':
            return report.riskLevel;
          case 'status':
            return report.status;
          case 'reporter':
            return `${report.reporter.name} ${report.reporter.email}`;
          case 'created':
          default:
            return new Date(report.createdAt).getTime();
        }
      };

      const aValue = getComparableValue(a);
      const bValue = getComparableValue(b);

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return (aValue - bValue) * direction;
      }

      return String(aValue).localeCompare(String(bValue)) * direction;
    });

    return copy;
  }, [reports, sortDirection, sortKey]);

  const statItems = useMemo<StatCardItem[]>(
    () => [
      {
        id: 'pending',
        title: 'Pending Reports',
        value: summary.pending || 0,
        subtitle: 'Needs moderator decision',
        icon: AlertTriangle,
        tone: 'amber',
      },
      {
        id: 'verified',
        title: 'Verified Entities',
        value: summary.verified || 0,
        subtitle: 'Validated or confirmed reports',
        icon: CheckCircle2,
        tone: 'emerald',
      },
      {
        id: 'rejected',
        title: 'Rejected Reports',
        value: summary.rejected || 0,
        subtitle: 'Closed with no violation',
        icon: FileX2,
        tone: 'rose',
      },
      {
        id: 'total',
        title: 'Total Records',
        value: total,
        subtitle: 'Reports matching current filters',
        icon: Files,
        tone: 'sky',
      },
    ],
    [summary.pending, summary.rejected, summary.verified, total]
  );

  const handleSort = (key: ReportSortKey) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDirection('asc');
      return;
    }

    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const updateReport = useCallback(
    async (report: ModerationReport, action: ReportAction) => {
      if (actionInProgressId) return;

      setActionInProgressId(report.id);
      setError('');

      try {
        if (action === 'mark_scam') {
          const response = await fetch('/api/admin/reports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              action: 'approve',
              reportId: report.id,
              riskLevel: 'high',
            }),
          });
          const payload = await response.json();
          if (!response.ok || !payload?.success) {
            throw new Error(payload?.error?.message || payload?.error || 'Unable to mark scam');
          }
          await loadReports();
          return;
        }

        const statusByAction: Record<Exclude<ReportAction, 'mark_scam'>, ReportStatus> = {
          approve: 'verified',
          reject: 'rejected',
          delete: 'rejected',
        };

        const body: { status: ReportStatus; adminNotes?: string } = {
          status: statusByAction[action as Exclude<ReportAction, 'mark_scam'>],
        };

        if (action === 'delete') {
          body.adminNotes = `${report.adminNotes || ''}\n[Admin] Marked as deleted from moderation table.`.trim();
        }

        const response = await fetch(`/api/admin/reports/${encodeURIComponent(report.id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body),
        });

        const payload = await response.json();
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error?.message || payload?.error || 'Unable to update report');
        }

        const updated: ModerationReport | undefined = payload.item;
        if (updated) {
          setReports((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
          setSelectedReport((prev) => (prev?.id === updated.id ? updated : prev));
        }

        await loadReports();
      } catch (actionError) {
        setError(actionError instanceof Error ? actionError.message : 'Unable to process action');
      } finally {
        setActionInProgressId(null);
      }
    },
    [actionInProgressId, loadReports]
  );

  const handleSaveNotes = async (notes: string) => {
    if (!selectedReport || actionInProgressId) return;

    setActionInProgressId(selectedReport.id);
    setError('');

    try {
      const response = await fetch(`/api/admin/reports/${encodeURIComponent(selectedReport.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ adminNotes: notes }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error?.message || payload?.error || 'Unable to save notes');
      }

      const updated: ModerationReport | undefined = payload.item;
      if (updated) {
        setReports((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        setSelectedReport(updated);
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save notes');
    } finally {
      setActionInProgressId(null);
    }
  };

  const selectedIndex = selectedReport ? reports.findIndex((item) => item.id === selectedReport.id) : -1;
  const rangeStart = reports.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = reports.length === 0 ? 0 : rangeStart + reports.length - 1;

  return (
    <div className="space-y-5">
      <StatsCards items={statItems} />

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Report Moderation Table</h2>
            <p className="text-xs text-slate-500">
              Showing {rangeStart}-{rangeEnd} of {total} reports
            </p>
          </div>
          <button
            type="button"
            onClick={loadReports}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        <FilterBar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          statusValue={statusValue}
          onStatusChange={(value) => setStatusValue(parseStatusFilter(value))}
          typeValue={typeValue}
          onTypeChange={(value) => setTypeValue(parseTypeFilter(value))}
          statusOptions={statusOptions}
          typeOptions={typeOptions}
        />

        {error && (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        )}

        <div className="mt-3">
          <ReportTable
            reports={sortedReports}
            selectedId={selectedReport?.id || null}
            loading={loading}
            sortKey={sortKey}
            sortDirection={sortDirection}
            actionInProgressId={actionInProgressId}
            onSort={handleSort}
            onOpen={(report) => setSelectedReport(report)}
            onAction={updateReport}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            {selectedIndex >= 0 ? `Selected report #${selectedIndex + 1}` : 'Select a report row to inspect full details'}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-xs font-semibold text-slate-600">
              Page {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <ReportPanel
        report={selectedReport}
        actionInProgress={Boolean(selectedReport && actionInProgressId === selectedReport.id)}
        onClose={() => setSelectedReport(null)}
        onAction={(action) => {
          if (!selectedReport) return;
          updateReport(selectedReport, action);
        }}
        onSaveNotes={handleSaveNotes}
      />
    </div>
  );
}

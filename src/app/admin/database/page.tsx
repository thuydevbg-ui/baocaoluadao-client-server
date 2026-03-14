'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Database, ShieldCheck, ShieldX, Trash2, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react';
import StatsCards, { type StatCardItem } from '@/components/admin/StatsCards';
import ExportButton, { type ExportColumn } from '@/components/admin/ExportButton';
import BulkActions, { useBulkSelection, type BulkAction } from '@/components/admin/BulkActions';

type ScamType =
  | 'website'
  | 'phone'
  | 'email'
  | 'bank'
  | 'social'
  | 'sms'
  | 'device'
  | 'system'
  | 'application'
  | 'organization';

type ScamRisk = 'low' | 'medium' | 'high';
type ScamStatus = 'active' | 'investigating' | 'blocked';

type ScamItem = {
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
};

type ScamsResponse = {
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
};

const typeOptions: Array<{ value: 'all' | ScamType; label: string }> = [
  { value: 'all', label: 'All types' },
  { value: 'website', label: 'Website' },
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
  { value: 'bank', label: 'Bank' },
  { value: 'social', label: 'Social' },
  { value: 'sms', label: 'SMS' },
  { value: 'device', label: 'Device' },
  { value: 'system', label: 'System' },
  { value: 'application', label: 'Application' },
  { value: 'organization', label: 'Organization' },
];

const statusOptions: Array<{ value: 'all' | ScamStatus; label: string }> = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Active' },
  { value: 'investigating', label: 'Investigating' },
  { value: 'blocked', label: 'Blocked' },
];

const riskOptions: Array<{ value: 'all' | ScamRisk; label: string }> = [
  { value: 'all', label: 'All risk levels' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('vi-VN');
}

function riskBadge(risk: ScamRisk) {
  const styles: Record<ScamRisk, string> = {
    low: 'bg-emerald-100 text-emerald-700',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-rose-100 text-rose-700',
  };
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium uppercase ${styles[risk]}`}>{risk}</span>;
}

function statusBadge(status: ScamStatus) {
  const styles: Record<ScamStatus, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    investigating: 'bg-blue-100 text-blue-700',
    blocked: 'bg-rose-100 text-rose-700',
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${styles[status]}`}>
      {status}
    </span>
  );
}

export default function DatabasePage() {
  const [items, setItems] = useState<ScamItem[]>([]);
  const [summary, setSummary] = useState<ScamsResponse['summary']>({
    total: 0,
    active: 0,
    investigating: 0,
    blocked: 0,
  });
  const [searchValue, setSearchValue] = useState('');
  const [typeValue, setTypeValue] = useState<'all' | ScamType>('all');
  const [statusValue, setStatusValue] = useState<'all' | ScamStatus>('all');
  const [riskValue, setRiskValue] = useState<'all' | ScamRisk>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedItem, setSelectedItem] = useState<ScamItem | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  // Bulk selection hook
  const {
    selectedIds,
    handleSelectAll,
    handleDeselectAll,
    handleToggle,
    isSelected,
    allSelected,
    hasSelection,
  } = useBulkSelection(items, (item) => item.id);

  useEffect(() => {
    setPage(1);
  }, [searchValue, typeValue, statusValue, riskValue]);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const query = new URLSearchParams({
        q: searchValue,
        type: typeValue,
        status: statusValue,
        riskLevel: riskValue,
        page: String(page),
        pageSize: '12',
      });

      const response = await fetch(`/api/admin/scams?${query.toString()}`, {
        cache: 'no-store',
        credentials: 'include',
      });

      const payload = (await response.json()) as ScamsResponse;
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Unable to load entities');
      }

      setItems(payload.items || []);
      setSummary(payload.summary || { total: 0, active: 0, investigating: 0, blocked: 0 });
      setTotalPages(payload.totalPages || 1);
      setTotalItems(payload.total || 0);

      if (selectedItem) {
        const refreshed = (payload.items || []).find((item) => item.id === selectedItem.id) || null;
        setSelectedItem(refreshed);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load entities');
      setItems([]);
      setTotalItems(0);
      setTotalPages(1);
      if (selectedItem) setSelectedItem(null);
    } finally {
      setLoading(false);
    }
  }, [page, riskValue, searchValue, selectedItem, statusValue, typeValue]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const updateItem = async (id: string, payload: Partial<Pick<ScamItem, 'status' | 'riskLevel' | 'description'>>) => {
    if (actionId) return;

    setActionId(id);
    setError('');

    try {
      const response = await fetch(`/api/admin/scams/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Unable to update entity');
      }

      await loadItems();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update entity');
    } finally {
      setActionId(null);
    }
  };

  const deleteItem = async (id: string) => {
    if (actionId) return;

    setActionId(id);
    setError('');

    try {
      const response = await fetch(`/api/admin/scams/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Unable to delete entity');
      }

      await loadItems();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete entity');
    } finally {
      setActionId(null);
    }
  };

  // Bulk action handler
  const handleBulkAction = async (actionId: string, selectedIds: string[]) => {
    setError('');
    setLoading(true);

    try {
      switch (actionId) {
        case 'delete':
          // Delete multiple items
          const deletePromises = selectedIds.map(id => 
            fetch(`/api/admin/scams/${encodeURIComponent(id)}`, {
              method: 'DELETE',
              credentials: 'include',
            })
          );
          await Promise.all(deletePromises);
          break;
        case 'activate':
          // Activate multiple items
          const activatePromises = selectedIds.map(id =>
            fetch(`/api/admin/scams/${encodeURIComponent(id)}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ status: 'active' }),
            })
          );
          await Promise.all(activatePromises);
          break;
        case 'deactivate':
          // Deactivate multiple items
          const deactivatePromises = selectedIds.map(id =>
            fetch(`/api/admin/scams/${encodeURIComponent(id)}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ status: 'blocked' }),
            })
          );
          await Promise.all(deactivatePromises);
          break;
        default:
          break;
      }
      await loadItems();
    } catch (bulkError) {
      setError(bulkError instanceof Error ? bulkError.message : 'Unable to perform bulk action');
    } finally {
      setLoading(false);
    }
  };

  // Define bulk actions
  const bulkActions: BulkAction[] = [
    {
      id: 'activate',
      label: 'Kích hoạt',
      icon: ToggleRight,
      variant: 'success',
      requiresConfirmation: false,
    },
    {
      id: 'deactivate',
      label: 'Vô hiệu hóa',
      icon: ToggleLeft,
      variant: 'warning',
      requiresConfirmation: true,
      confirmationMessage: 'Bạn có chắc muốn vô hiệu hóa các mục đã chọn?',
    },
    {
      id: 'delete',
      label: 'Xóa',
      icon: Trash2,
      variant: 'danger',
      requiresConfirmation: true,
      confirmationMessage: 'Bạn có chắc muốn xóa các mục đã chọn? Hành động này không thể hoàn tác.',
    },
  ];

  // Export columns configuration
  const exportColumns: ExportColumn[] = [
    { key: 'id', label: 'ID', selected: true },
    { key: 'type', label: 'Loại', selected: true },
    { key: 'value', label: 'Giá trị', selected: true },
    { key: 'status', label: 'Trạng thái', selected: true },
    { key: 'riskLevel', label: 'Mức độ rủi ro', selected: true },
    { key: 'reportCount', label: 'Số báo cáo', selected: true },
    { key: 'source', label: 'Nguồn', selected: false },
    { key: 'createdAt', label: 'Ngày tạo', selected: true },
    { key: 'updatedAt', label: 'Ngày cập nhật', selected: false },
  ];

  const statItems = useMemo<StatCardItem[]>(
    () => [
      {
        id: 'db-total',
        title: 'Tổng số bản ghi',
        value: summary.total,
        subtitle: 'Các thực thể được theo dõi trong DB điều hành',
        icon: Database,
        tone: 'sky',
      },
      {
        id: 'db-active',
        title: 'Tín hiệu hoạt động',
        value: summary.active,
        subtitle: 'Các thực thể được giám sát tích cực',
        icon: ShieldCheck,
        tone: 'emerald',
      },
      {
        id: 'db-investigating',
        title: 'Đang điều tra',
        value: summary.investigating,
        subtitle: 'Chờ xác minh sâu hơn',
        icon: AlertTriangle,
        tone: 'amber',
      },
      {
        id: 'db-blocked',
        title: 'Bị chặn',
        value: summary.blocked,
        subtitle: 'Các thực thể lừa đảo đã xác nhận',
        icon: ShieldX,
        tone: 'rose',
      },
    ],
    [summary]
  );

  const rangeStart = items.length === 0 ? 0 : (page - 1) * 12 + 1;
  const rangeEnd = items.length === 0 ? 0 : rangeStart + items.length - 1;

  return (
    <div className="space-y-5">
      <StatsCards items={statItems} />

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Cơ sở dữ liệu thực thể</h2>
            <p className="text-xs text-slate-500">
              Hiển thị {rangeStart}-{rangeEnd} của {totalItems} thực thể
            </p>
          </div>
          <div className="flex gap-2">
            <ExportButton
              data={items}
              columns={exportColumns}
              filename="database_export"
            />
            <button
              type="button"
              onClick={loadItems}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Làm mới
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/70">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Tìm kiếm theo giá trị, loại, nguồn hoặc mô tả..."
              className="w-full flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-slate-300 focus:bg-white"
            />

            <select
              value={typeValue}
              onChange={(event) => setTypeValue(event.target.value as 'all' | ScamType)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
            >
              {typeOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <select
              value={statusValue}
              onChange={(event) => setStatusValue(event.target.value as 'all' | ScamStatus)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
            >
              {statusOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <select
              value={riskValue}
              onChange={(event) => setRiskValue(event.target.value as 'all' | ScamRisk)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
            >
              {riskOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        )}

        {/* Bulk Actions */}
        {hasSelection && (
          <div className="mt-3">
            <BulkActions
              items={items}
              selectedIds={selectedIds}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              onAction={handleBulkAction}
              actions={bulkActions}
              getId={(item) => item.id}
            />
          </div>
        )}

        <div className="mt-3 overflow-auto rounded-xl border border-slate-200">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => allSelected ? handleDeselectAll() : handleSelectAll(items.map(i => i.id))}
                    className="h-4 w-4 rounded border-slate-300 text-slate-600"
                  />
                </th>
                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">ID</th>
                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Entity</th>
                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Rủi ro</th>
                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Trạng thái</th>
                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Báo cáo</th>
                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Updated</th>
                <th className="p-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-500">
                    Loading entities...
                  </td>
                </tr>
              )}

              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-500">
                    No entities found for current filters.
                  </td>
                </tr>
              )}

              {!loading &&
                items.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={isSelected(item.id)}
                        onChange={() => handleToggle(item.id)}
                        className="h-4 w-4 rounded border-slate-300 text-slate-600"
                      />
                    </td>
                    <td className="p-3 font-mono text-xs text-slate-500">{item.id}</td>
                    <td className="p-3">
                      <p className="font-medium text-slate-900 break-words">{item.value}</p>
                      <p className="text-xs text-slate-500 break-words">{item.source}</p>
                    </td>
                    <td className="p-3 uppercase tracking-wide text-slate-700">{item.type}</td>
                    <td className="p-3">{riskBadge(item.riskLevel)}</td>
                    <td className="p-3">{statusBadge(item.status)}</td>
                    <td className="p-3 text-slate-700">{item.reportCount}</td>
                    <td className="p-3 text-slate-600">{formatDate(item.updatedAt)}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedItem(item)}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          View
                        </button>
                        {item.status !== 'blocked' ? (
                          <button
                            type="button"
                            disabled={actionId === item.id}
                            onClick={() => updateItem(item.id, { status: 'blocked', riskLevel: 'high' })}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                          >
                            Block
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={actionId === item.id}
                            onClick={() => updateItem(item.id, { status: 'investigating' })}
                            className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-60"
                          >
                            Review
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Trước
          </button>
          <span className="text-xs font-semibold text-slate-600">
            Trang {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Sau
          </button>
        </div>
      </section>

      {selectedItem && (
        <>
          <button
            type="button"
            onClick={() => setSelectedItem(null)}
            className="fixed inset-0 z-40 bg-slate-900/25"
            aria-label="Close entity panel overlay"
          />
          <aside className="fixed right-0 top-0 z-50 h-full w-[520px] max-w-[calc(100vw-0.75rem)] border-l border-slate-200 bg-white shadow-2xl">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Entity Detail</p>
                  <h3 className="text-sm font-semibold text-slate-900">{selectedItem.value}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>

              <div className="max-h-[90vh] flex-1 overflow-y-auto p-5">
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">ID</p>
                    <p className="col-span-2 font-mono text-xs text-slate-600 break-words">{selectedItem.id}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Type</p>
                    <p className="col-span-2 text-sm text-slate-700 uppercase tracking-wide">{selectedItem.type}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Source</p>
                    <p className="col-span-2 text-sm text-slate-700 break-words">{selectedItem.source}</p>
                  </div>
                </div>

                <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500">Description</label>
                <textarea
                  value={selectedItem.description}
                  onChange={(event) =>
                    setSelectedItem((prev) =>
                      prev ? { ...prev, description: event.target.value } : prev
                    )
                  }
                  rows={5}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 outline-none focus:border-slate-300 focus:bg-white"
                />

                <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500">Risk Level</label>
                <select
                  value={selectedItem.riskLevel}
                  onChange={(event) =>
                    setSelectedItem((prev) =>
                      prev ? { ...prev, riskLevel: event.target.value as ScamRisk } : prev
                    )
                  }
                  className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
                >
                  {riskOptions
                    .filter((item) => item.value !== 'all')
                    .map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                </select>

                <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500">Trạng thái</label>
                <select
                  value={selectedItem.status}
                  onChange={(event) =>
                    setSelectedItem((prev) =>
                      prev ? { ...prev, status: event.target.value as ScamStatus } : prev
                    )
                  }
                  className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
                >
                  {statusOptions
                    .filter((item) => item.value !== 'all')
                    .map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                </select>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={actionId === selectedItem.id}
                    onClick={() =>
                      updateItem(selectedItem.id, {
                        status: selectedItem.status,
                        riskLevel: selectedItem.riskLevel,
                        description: selectedItem.description,
                      })
                    }
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    disabled={actionId === selectedItem.id}
                    onClick={() => deleteItem(selectedItem.id)}
                    className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}

import React from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import ReportRow from './ReportRow';
import { ModerationReport, ReportAction, ReportSortKey, SortDirection } from './reportTypes';

const sortableColumns: Array<{ key: ReportSortKey; label: string }> = [
  { key: 'id', label: 'ID' },
  { key: 'target', label: 'Target' },
  { key: 'type', label: 'Type' },
  { key: 'risk', label: 'Risk' },
  { key: 'status', label: 'Status' },
  { key: 'reporter', label: 'Reporter' },
  { key: 'created', label: 'Created' },
];

function SortButton({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-800"
    >
      {label}
      {!active && <ArrowUpDown className="h-3.5 w-3.5" />}
      {active && direction === 'asc' && <ArrowUp className="h-3.5 w-3.5" />}
      {active && direction === 'desc' && <ArrowDown className="h-3.5 w-3.5" />}
    </button>
  );
}

type ReportTableProps = {
  reports: ModerationReport[];
  selectedId: string | null;
  loading: boolean;
  sortKey: ReportSortKey;
  sortDirection: SortDirection;
  actionInProgressId: string | null;
  onSort: (key: ReportSortKey) => void;
  onOpen: (report: ModerationReport) => void;
  onAction: (report: ModerationReport, action: ReportAction) => void;
};

export default function ReportTable({
  reports,
  selectedId,
  loading,
  sortKey,
  sortDirection,
  actionInProgressId,
  onSort,
  onOpen,
  onAction,
}: ReportTableProps) {
  return (
    <div className="overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
      <table className="min-w-[1100px] w-full text-sm">
        <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur border-b border-slate-200">
          <tr>
            {sortableColumns.map((column) => (
              <th key={column.key} className="p-3 text-left align-middle">
                <SortButton
                  label={column.label}
                  active={sortKey === column.key}
                  direction={sortDirection}
                  onClick={() => onSort(column.key)}
                />
              </th>
            ))}
            <th className="p-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={9} className="p-8 text-center text-slate-500">
                Loading reports...
              </td>
            </tr>
          )}
          {!loading && reports.length === 0 && (
            <tr>
              <td colSpan={9} className="p-8 text-center text-slate-500">
                No reports match current filters.
              </td>
            </tr>
          )}
          {!loading &&
            reports.map((report) => (
              <ReportRow
                key={report.id}
                report={report}
                selected={selectedId === report.id}
                processing={actionInProgressId === report.id}
                onOpen={onOpen}
                onAction={onAction}
              />
            ))}
        </tbody>
      </table>
    </div>
  );
}

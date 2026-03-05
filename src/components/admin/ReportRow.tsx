import React from 'react';
import { Check, Flag, Trash2, X } from 'lucide-react';
import { ModerationReport, ReportAction } from './reportTypes';

const statusStyles: Record<ModerationReport['status'], string> = {
  pending: 'bg-amber-100 text-amber-800',
  processing: 'bg-blue-100 text-blue-800',
  verified: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-rose-100 text-rose-800',
  completed: 'bg-slate-200 text-slate-800',
};

const riskStyles: Record<ModerationReport['riskLevel'], string> = {
  low: 'bg-emerald-100 text-emerald-800',
  medium: 'bg-amber-100 text-amber-800',
  high: 'bg-rose-100 text-rose-800',
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('vi-VN');
}

function ActionButton({
  label,
  onClick,
  tone,
  icon,
  disabled,
}: {
  label: string;
  onClick: () => void;
  tone: 'emerald' | 'rose' | 'amber' | 'slate';
  icon: React.ReactNode;
  disabled?: boolean;
}) {
  const toneClass: Record<typeof tone, string> = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
    rose: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
    amber: 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100',
    slate: 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${toneClass[tone]}`}
    >
      {icon}
      {label}
    </button>
  );
}

type ReportRowProps = {
  report: ModerationReport;
  selected: boolean;
  processing: boolean;
  onOpen: (report: ModerationReport) => void;
  onAction: (report: ModerationReport, action: ReportAction) => void;
};

export default function ReportRow({ report, selected, processing, onOpen, onAction }: ReportRowProps) {
  return (
    <tr
      className={`group cursor-pointer border-t border-slate-100 transition-colors ${
        selected ? 'bg-slate-100/70' : 'hover:bg-slate-50'
      }`}
      onClick={() => onOpen(report)}
    >
      <td className="p-3 align-top font-mono text-xs text-slate-500">{report.id}</td>
      <td className="p-3 align-top">
        <p className="font-medium text-slate-900 break-words">{report.target.value}</p>
        <p className="text-xs text-slate-500 uppercase tracking-wide">{report.target.type}</p>
      </td>
      <td className="p-3 align-top text-slate-700 uppercase tracking-wide">{report.type}</td>
      <td className="p-3 align-top">
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${riskStyles[report.riskLevel]}`}>
          {report.riskLevel}
        </span>
      </td>
      <td className="p-3 align-top">
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[report.status]}`}>
          {report.status}
        </span>
      </td>
      <td className="p-3 align-top">
        <p className="font-medium text-slate-800 break-words">{report.reporter.name}</p>
        <p className="text-xs text-slate-500 break-words">{report.reporter.email}</p>
      </td>
      <td className="p-3 align-top text-slate-600 whitespace-nowrap">{formatDate(report.createdAt)}</td>
      <td className="p-3 align-top">
        <div
          className={`flex flex-wrap justify-end gap-1 transition-opacity ${
            selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
          onClick={(event) => event.stopPropagation()}
        >
          <ActionButton
            label="Approve"
            tone="emerald"
            icon={<Check className="h-3.5 w-3.5" />}
            disabled={processing}
            onClick={() => onAction(report, 'approve')}
          />
          <ActionButton
            label="Reject"
            tone="rose"
            icon={<X className="h-3.5 w-3.5" />}
            disabled={processing}
            onClick={() => onAction(report, 'reject')}
          />
          <ActionButton
            label="Mark Scam"
            tone="amber"
            icon={<Flag className="h-3.5 w-3.5" />}
            disabled={processing}
            onClick={() => onAction(report, 'mark_scam')}
          />
          <ActionButton
            label="Delete"
            tone="slate"
            icon={<Trash2 className="h-3.5 w-3.5" />}
            disabled={processing}
            onClick={() => onAction(report, 'delete')}
          />
        </div>
      </td>
    </tr>
  );
}

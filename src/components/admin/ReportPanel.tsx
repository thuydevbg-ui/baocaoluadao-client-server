import React, { useEffect, useState } from 'react';
import { Check, Flag, Trash2, X } from 'lucide-react';
import { ModerationReport, ReportAction } from './reportTypes';

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-3 py-2">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="col-span-2 text-sm text-slate-700 break-words">{value}</dd>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('vi-VN');
}

type ReportPanelProps = {
  report: ModerationReport | null;
  actionInProgress: boolean;
  onClose: () => void;
  onAction: (action: ReportAction) => void;
  onSaveNotes: (notes: string) => void;
};

export default function ReportPanel({ report, actionInProgress, onClose, onAction, onSaveNotes }: ReportPanelProps) {
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setNotes(report?.adminNotes || '');
  }, [report]);

  if (!report) return null;

  return (
    <>
      <button
        type="button"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-slate-900/30"
        aria-label="Close detail panel overlay"
      />
      <aside className="fixed right-0 top-0 z-50 h-full w-[520px] max-w-[calc(100vw-0.75rem)] border-l border-slate-200 bg-white shadow-2xl">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-slate-500">Report Detail</p>
              <h3 className="text-sm font-semibold text-slate-900 truncate">{report.id}</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              aria-label="Close detail panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mx-4 my-4 rounded-xl border border-slate-200">
            <div className="max-h-[90vh] overflow-y-auto p-4">
              <section className="border-b border-slate-100 pb-4">
                <h4 className="text-sm font-semibold text-slate-900">Basic Info</h4>
                <dl className="mt-2">
                  <InfoRow label="Status" value={report.status} />
                  <InfoRow label="Risk" value={report.riskLevel} />
                  <InfoRow label="Created" value={formatDate(report.createdAt)} />
                  <InfoRow label="Updated" value={formatDate(report.updatedAt)} />
                  <InfoRow label="Reporter" value={`${report.reporter.name} (${report.reporter.email})`} />
                </dl>
              </section>

              <section className="border-b border-slate-100 py-4">
                <h4 className="text-sm font-semibold text-slate-900">Target Entity</h4>
                <dl className="mt-2">
                  <InfoRow label="Type" value={report.target.type} />
                  <InfoRow label="Value" value={report.target.value} />
                  <InfoRow label="IP" value={report.target.ip || 'N/A'} />
                  <InfoRow label="Platform" value={report.target.platform || 'N/A'} />
                </dl>
              </section>

              <section className="border-b border-slate-100 py-4">
                <h4 className="text-sm font-semibold text-slate-900">Report Description</h4>
                <p className="mt-2 text-sm text-slate-700 leading-relaxed break-words whitespace-pre-wrap">
                  {report.description || 'No report description provided.'}
                </p>
              </section>

              <section className="border-b border-slate-100 py-4">
                <h4 className="text-sm font-semibold text-slate-900">Evidence</h4>
                <ul className="mt-2 space-y-2 text-sm text-slate-700">
                  <li className="rounded-lg bg-slate-50 p-3 break-words">Source: {report.source || 'N/A'}</li>
                  <li className="rounded-lg bg-slate-50 p-3 break-words">Title: {report.title || 'N/A'}</li>
                </ul>
              </section>

              <section className="py-4">
                <h4 className="text-sm font-semibold text-slate-900">Admin Actions</h4>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={actionInProgress}
                    onClick={() => onAction('approve')}
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={actionInProgress}
                    onClick={() => onAction('reject')}
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                  >
                    <X className="h-3.5 w-3.5" />
                    Reject
                  </button>
                  <button
                    type="button"
                    disabled={actionInProgress}
                    onClick={() => onAction('mark_scam')}
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-60"
                  >
                    <Flag className="h-3.5 w-3.5" />
                    Mark Scam
                  </button>
                  <button
                    type="button"
                    disabled={actionInProgress}
                    onClick={() => onAction('delete')}
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>

                <div className="mt-4">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Admin Notes</label>
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Add internal notes for other moderators..."
                    rows={4}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 outline-none focus:border-slate-300 focus:bg-white"
                  />
                  <button
                    type="button"
                    disabled={actionInProgress}
                    onClick={() => onSaveNotes(notes)}
                    className="mt-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    Save Notes
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

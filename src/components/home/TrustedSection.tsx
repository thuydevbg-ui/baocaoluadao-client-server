import { Building2, CheckCircle2, Clock, FileText, Globe } from 'lucide-react';
import { RowDataPacket } from 'mysql2/promise';
import { getDb } from '@/lib/db';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type TrustedAuthorityType = 'website' | 'organization';

interface TrustedAuthorityItem {
  id: string;
  type: TrustedAuthorityType;
  name: string;
  organization: string;
  reports: number;
  firstSeen: string;
  status: string;
  riskScore: number;
}

interface TrustedRow extends RowDataPacket {
  id?: string;
  type?: string;
  name?: string;
  value?: string;
  organization?: string;
  source?: string;
  reports?: number;
  report_count?: number;
  firstSeen?: string;
  created_at?: string;
  status?: string;
  riskScore?: number;
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function pickBalanced(websites: TrustedAuthorityItem[], organizations: TrustedAuthorityItem[], limit = 6) {
  const websiteItems = shuffle(websites).slice(0, Math.ceil(limit / 2));
  const organizationItems = shuffle(organizations).slice(0, Math.floor(limit / 2));
  let combined = [...websiteItems, ...organizationItems];

  if (combined.length < limit) {
    const remaining = shuffle([
      ...websites.filter((item) => !websiteItems.includes(item)),
      ...organizations.filter((item) => !organizationItems.includes(item)),
    ]);
    combined = [...combined, ...remaining.slice(0, limit - combined.length)];
  }

  return combined.slice(0, limit);
}

function normalizeStatus(value?: string): string {
  return (value || '').trim().toLowerCase();
}

function toTrustedItem(row: TrustedRow): TrustedAuthorityItem {
  const type = (row.type || 'website') as TrustedAuthorityType;
  const name = row.name || row.value || 'Đối tượng uy tín';
  const reportsValue = row.reports ?? row.report_count ?? 0;
  const reports = Number.isFinite(reportsValue) ? Number(reportsValue) : 0;
  const riskScoreValue = row.riskScore ?? 0;
  const riskScore = Number.isFinite(riskScoreValue) ? Number(riskScoreValue) : 0;
  const organization = row.organization || row.source || (type === 'organization' ? name : 'Nguồn xác minh');
  return {
    id: row.id || `${type}-${name}-${Math.random().toString(36).slice(2, 10)}`,
    type,
    name,
    organization,
    reports,
    firstSeen: row.firstSeen || row.created_at || new Date().toISOString(),
    status: normalizeStatus(row.status),
    riskScore,
  };
}

const RISK_SCORE_EXPR = "CASE risk_level WHEN 'low' THEN 10 WHEN 'medium' THEN 45 WHEN 'high' THEN 80 ELSE 15 END";

async function queryTrustedByType(type: TrustedAuthorityType, limit: number): Promise<TrustedAuthorityItem[]> {
  const db = getDb();
  const [rows] = await db.query<TrustedRow[]>(
    `SELECT id, type, value as name, source as organization, report_count as reports, created_at as firstSeen, status,
            ${RISK_SCORE_EXPR} as riskScore
     FROM scams
     WHERE type = ? AND (status = 'trusted' OR ${RISK_SCORE_EXPR} <= 20)
     ORDER BY RAND()
     LIMIT ?`,
    [type, limit]
  );
  return rows.map((row) => toTrustedItem(row));
}

async function queryTrustedAny(limit: number): Promise<TrustedAuthorityItem[]> {
  const db = getDb();
  const [rows] = await db.query<TrustedRow[]>(
    `SELECT id, type, value as name, source as organization, report_count as reports, created_at as firstSeen, status,
            ${RISK_SCORE_EXPR} as riskScore
     FROM scams
     WHERE type IN ('website','organization') AND (status = 'trusted' OR ${RISK_SCORE_EXPR} <= 20)
     ORDER BY RAND()
     LIMIT ?`,
    [limit]
  );
  return rows.map((row) => toTrustedItem(row));
}

async function fetchTrustedAuthorities(): Promise<TrustedAuthorityItem[]> {
  try {
    const [websites, organizations] = await Promise.all([
      queryTrustedByType('website', 3),
      queryTrustedByType('organization', 3),
    ]);

    let combined = pickBalanced(websites, organizations, 6);
    if (combined.length < 6) {
      const extras = await queryTrustedAny(6 - combined.length);
      const existingIds = new Set(combined.map((item) => item.id));
      combined = [...combined, ...extras.filter((item) => !existingIds.has(item.id))].slice(0, 6);
    }

    return combined.filter((item) => item.status === 'trusted' || item.riskScore <= 20);
  } catch (error) {
    console.error('Trusted authorities fetch failed:', error);
    return [];
  }
}

export default async function TrustedSection() {
  const items = await fetchTrustedAuthorities();

  return (
    <section className="rounded-2xl border border-bg-border bg-white/70 dark:bg-[#0c1221]/80 shadow-sm backdrop-blur">
      <div className="p-5 space-y-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Trang & Tổ chức uy tín</p>
          <h3 className="text-lg font-semibold text-text-main">Các thực thể được xác minh và đánh giá an toàn</h3>
        </div>

        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 md:flex-col md:overflow-visible md:pb-0">
          {items.map((item) => {
            const Icon = item.type === 'website' ? Globe : Building2;
            return (
              <div
                key={item.id}
                className="min-w-[260px] snap-start rounded-2xl border border-bg-border/70 bg-white/80 dark:bg-[#101827]/80 p-4 shadow-sm transition-all duration-200 hover:translate-y-1 hover:border-primary/40"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-text-main truncate">{item.name}</p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-[0.65rem] font-semibold dark:bg-green-500/20 dark:text-green-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Đã xác minh
                      </span>
                    </div>
                    <p className="text-xs text-text-muted mt-1">{item.organization}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                      <span className="inline-flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        {item.reports} báo cáo
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDate(item.firstSeen)}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-[0.65rem] font-semibold dark:bg-green-500/20 dark:text-green-200">
                        An toàn
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {items.length === 0 && (
            <div className="rounded-2xl border border-dashed border-bg-border/70 bg-bg-card/60 p-6 text-sm text-text-muted">
              Chưa có dữ liệu uy tín để hiển thị.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

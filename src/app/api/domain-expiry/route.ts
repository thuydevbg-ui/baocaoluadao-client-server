import { NextRequest } from 'next/server';
import { withApiObservability } from '@/lib/apiHandler';
import { createSecureJsonResponse, isRequestFromSameOrigin, rateLimitRequest } from '@/lib/apiSecurity';
import { normalizeDomainInput } from '@/lib/dataSources/tinnhiemmang';
import { getDb } from '@/lib/db';
import { d1Query, isD1Configured, shouldUseD1Reads } from '@/lib/d1Client';
import { fetchDomainExpiry } from '@/lib/scan/deterministic';
import { RowDataPacket } from 'mysql2/promise';

const RATE_LIMIT_OPTIONS = {
  keyPrefix: 'domain-expiry',
  windowMs: 60_000,
  maxRequests: 30,
};

const DAY_MS = 86_400_000;
const DEFAULT_COOLDOWN_DAYS = 7;
const DEFAULT_MATCH_LIMIT = 40;

interface DomainRow extends RowDataPacket {
  id: string;
  value: string;
  domain_expires_at?: string | null;
  domain_expires_checked_at?: string | null;
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

function parseDbDateMs(value: string | null | undefined): number | null {
  if (!value) return null;
  const text = String(value).trim();
  if (!text) return null;
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(text)) {
    const iso = `${text.replace(' ', 'T')}Z`;
    const parsed = Date.parse(iso);
    return Number.isFinite(parsed) ? parsed : null;
  }
  const parsed = Date.parse(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function toMysqlDateTime(iso: string): string {
  return iso.replace('T', ' ').replace('Z', '').slice(0, 19);
}

function buildCacheResponse(domain: string, expiresAt: string | null, checkedAtMs: number | null) {
  const expiresAtMs = parseDbDateMs(expiresAt);
  const isExpired = expiresAtMs !== null ? expiresAtMs <= Date.now() : null;
  const daysLeft = expiresAtMs === null
    ? null
    : Math.max(0, Math.ceil((expiresAtMs - Date.now()) / DAY_MS));

  return {
    success: true,
    domain,
    expiresAt,
    daysLeft,
    isExpired,
    checkedAt: checkedAtMs ? new Date(checkedAtMs).toISOString() : null,
    source: 'cache',
  };
}

function normalizeCandidates(rows: DomainRow[], domain: string): DomainRow[] {
  return rows.filter((row) => normalizeDomainInput(row.value || '') === domain);
}

function pickLatestChecked(rows: DomainRow[]): DomainRow | null {
  if (!rows.length) return null;
  return rows.reduce((best, current) => {
    const bestMs = parseDbDateMs(best.domain_expires_checked_at ?? null) ?? 0;
    const currentMs = parseDbDateMs(current.domain_expires_checked_at ?? null) ?? 0;
    return currentMs >= bestMs ? current : best;
  }, rows[0]);
}

async function fetchDomainRowsFromD1(domain: string, limit: number): Promise<DomainRow[]> {
  const like = `%${escapeLike(domain)}%`;
  return d1Query<DomainRow>(
    `SELECT id, value, domain_expires_at, domain_expires_checked_at FROM scams WHERE type = 'website' AND value LIKE ? ESCAPE '\\' LIMIT ?`,
    [like, limit]
  );
}

async function fetchDomainRowsFromMySql(domain: string, limit: number): Promise<DomainRow[]> {
  const db = getDb();
  const like = `%${escapeLike(domain)}%`;
  const [rows] = await db.query<DomainRow[]>(
    `SELECT id, value, domain_expires_at, domain_expires_checked_at FROM scams WHERE type = 'website' AND value LIKE ? ESCAPE '\\' LIMIT ?`,
    [like, limit]
  );
  return rows;
}

async function updateExpiryInMySql(ids: string[], expiresAt: string | null): Promise<void> {
  if (!ids.length) return;
  const db = getDb();
  const placeholders = ids.map(() => '?').join(',');
  await db.query(
    `UPDATE scams SET domain_expires_at = ?, domain_expires_checked_at = NOW() WHERE id IN (${placeholders})`,
    [expiresAt, ...ids]
  );
}

async function updateExpiryInD1(ids: string[], expiresAt: string | null): Promise<void> {
  if (!ids.length || !isD1Configured()) return;
  const chunkSize = 100;
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const placeholders = chunk.map(() => '?').join(',');
    await d1Query(
      `UPDATE scams SET domain_expires_at = ?, domain_expires_checked_at = datetime('now') WHERE id IN (${placeholders})`,
      [expiresAt, ...chunk]
    );
  }
}

export const GET = withApiObservability(async (request: NextRequest) => {
  if (!isRequestFromSameOrigin(request)) {
    return createSecureJsonResponse({ success: false, error: 'Forbidden request origin' }, { status: 403 });
  }

  const rateLimit = rateLimitRequest(request, RATE_LIMIT_OPTIONS);
  if (!rateLimit.ok) {
    return createSecureJsonResponse({ success: false, error: 'Too many requests' }, { status: 429 }, rateLimit);
  }

  const domainParam = request.nextUrl.searchParams.get('domain') ?? '';
  const urlParam = request.nextUrl.searchParams.get('url') ?? '';
  const domain = normalizeDomainInput(domainParam || urlParam);

  if (!domain) {
    return createSecureJsonResponse({ success: false, error: 'Invalid domain' }, { status: 400 }, rateLimit);
  }

  const cooldownDays = Math.max(1, Number(process.env.DOMAIN_EXPIRY_COOLDOWN_DAYS || DEFAULT_COOLDOWN_DAYS));
  const matchLimit = Math.max(5, Number(process.env.DOMAIN_EXPIRY_MATCH_LIMIT || DEFAULT_MATCH_LIMIT));
  const nowMs = Date.now();

  let rows: DomainRow[] = [];
  const useD1 = shouldUseD1Reads();

  if (useD1) {
    try {
      rows = await fetchDomainRowsFromD1(domain, matchLimit);
    } catch {
      rows = [];
    }
  }

  if (!rows.length) {
    rows = await fetchDomainRowsFromMySql(domain, matchLimit).catch(() => []);
  }

  const matching = normalizeCandidates(rows, domain);
  const latest = pickLatestChecked(matching);
  const checkedAtMs = parseDbDateMs(latest?.domain_expires_checked_at ?? null);
  const cacheFresh = checkedAtMs !== null && (nowMs - checkedAtMs) < cooldownDays * DAY_MS;

  if (latest && cacheFresh) {
    return createSecureJsonResponse(buildCacheResponse(domain, latest.domain_expires_at ?? null, checkedAtMs), { status: 200 }, rateLimit);
  }

  const rdapResult = await fetchDomainExpiry(domain);
  const expiresAt = rdapResult.expiresAt ? toMysqlDateTime(rdapResult.expiresAt) : null;

  if (matching.length) {
    const ids = matching.map((row) => row.id);
    await updateExpiryInMySql(ids, expiresAt).catch(() => null);
    await updateExpiryInD1(ids, expiresAt).catch(() => null);
  }

  const expiresAtMs = rdapResult.expiresAt ? Date.parse(rdapResult.expiresAt) : null;
  const isExpired = expiresAtMs !== null ? expiresAtMs <= nowMs : null;
  const daysLeft = rdapResult.daysLeft ?? (expiresAtMs === null ? null : Math.max(0, Math.ceil((expiresAtMs - nowMs) / DAY_MS)));

  return createSecureJsonResponse(
    {
      success: true,
      domain,
      expiresAt: rdapResult.expiresAt,
      daysLeft,
      isExpired,
      checkedAt: new Date().toISOString(),
      source: 'rdap',
    },
    { status: 200 },
    rateLimit
  );
});

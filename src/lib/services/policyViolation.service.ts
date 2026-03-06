import { load, type CheerioAPI } from 'cheerio';
import type { AnyNode } from 'domhandler';
import { getDb } from '@/lib/db';
import { normalizeDomainInput } from '@/lib/dataSources/tinnhiemmang';

export type PolicyViolationHit = {
  domain: string;
  violationSummary: string | null;
  sourceName: string;
  sourceUrl: string;
  sourceTitle: string | null;
  updatedAt: string;
};

type PolicyViolationSyncSummary = {
  source: string;
  startedAt: string;
  completedAt: string;
  recordsSynced: number;
  domainsTotal: number;
  sourcesScanned: string[];
  lastError?: string | null;
};

const SYNC_SOURCE_KEY = 'policy_violations:xaydungchinhphu';

const POLICY_SOURCES: Array<{ sourceName: string; sourceUrl: string }> = [
  {
    sourceName: 'xaydungchinhphu.vn',
    // Official list example (QIV/2022). Keep as a curated source list to avoid SSRF.
    sourceUrl: 'https://xaydungchinhphu.vn/danh-sach-146-website-co-dau-hieu-vi-pham-phap-luat-119221209124321461.htm',
  },
];

async function ensurePolicyViolationSchema(): Promise<void> {
  const db = getDb();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS policy_violations (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      domain VARCHAR(255) NOT NULL,
      violation_summary TEXT,
      source_name VARCHAR(120) NOT NULL,
      source_url VARCHAR(700) NOT NULL,
      source_title VARCHAR(255) DEFAULT NULL,
      source_published_at DATETIME DEFAULT NULL,
      first_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_policy_violations_domain (domain),
      KEY idx_policy_violations_source (source_name),
      KEY idx_policy_violations_updated (updated_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

async function upsertPolicyViolation(row: {
  domain: string;
  violationSummary: string | null;
  sourceName: string;
  sourceUrl: string;
  sourceTitle: string | null;
}): Promise<void> {
  const db = getDb();
  await db.execute(
    `
      INSERT INTO policy_violations (
        domain,
        violation_summary,
        source_name,
        source_url,
        source_title,
        first_seen_at,
        last_seen_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON DUPLICATE KEY UPDATE
        violation_summary = VALUES(violation_summary),
        source_name = VALUES(source_name),
        source_url = VALUES(source_url),
        source_title = VALUES(source_title),
        last_seen_at = CURRENT_TIMESTAMP
    `,
    [row.domain, row.violationSummary, row.sourceName, row.sourceUrl, row.sourceTitle]
  );
}

function extractPolicyRowsFromHtml(html: string): Array<{ domains: string[]; violationSummary: string | null; sourceTitle: string | null }> {
  const $ = load(html);
  const pageTitle = $('h1').first().text().trim() || $('title').text().trim() || null;

  const tables = $('table').toArray() as AnyNode[];
  const targetTable = tables.find((table: AnyNode) => {
    const text = $(table).text().toLowerCase();
    return text.includes('tên miền') && text.includes('dấu hiệu');
  });

  if (!targetTable) {
    // Fallback: consider the first table with URLs.
    const fallback = tables.find((table: AnyNode) => $(table).find('a[href^=\"http\"]').length > 0);
    if (!fallback) return [];
    return extractRowsFromTable($, fallback, pageTitle);
  }

  return extractRowsFromTable($, targetTable, pageTitle);
}

function extractRowsFromTable(
  $: CheerioAPI,
  table: AnyNode,
  pageTitle: string | null
): Array<{ domains: string[]; violationSummary: string | null; sourceTitle: string | null }> {
  const rows = $(table).find('tr').toArray();
  const extracted: Array<{ domains: string[]; violationSummary: string | null; sourceTitle: string | null }> = [];

  for (const row of rows.slice(1)) {
    const cells = $(row).find('td').toArray();
    if (cells.length < 2) continue;

    const domainCell = cells[1];
    const violationCell = cells[cells.length - 1];

    const links = $(domainCell).find('a[href]').toArray();
    const domains: string[] = [];
    for (const link of links) {
      const href = String($(link).attr('href') || '').trim();
      if (!href) continue;
      const domain = normalizeDomainInput(href);
      if (domain) domains.push(domain);
    }

    // Fallback: some tables may list domains as plain text separated by whitespace/newlines.
    if (domains.length === 0) {
      const text = $(domainCell).text();
      const candidates = text
        .split(/\s+/)
        .map((value: string) => normalizeDomainInput(value))
        .filter((value): value is string => Boolean(value));
      domains.push(...candidates);
    }

    const uniqueDomains = Array.from(new Set(domains));
    if (uniqueDomains.length === 0) continue;

    const violationSummaryRaw = $(violationCell).text().replace(/\s+/g, ' ').trim();
    const violationSummary = violationSummaryRaw ? violationSummaryRaw : null;

    extracted.push({ domains: uniqueDomains, violationSummary, sourceTitle: pageTitle });
  }

  return extracted;
}

async function updateSyncState(values: {
  last_sync_started_at?: Date | null;
  last_sync_completed_at?: Date | null;
  last_success_at?: Date | null;
  last_error?: string | null;
  pages_synced?: number;
  records_synced?: number;
}): Promise<void> {
  const db = getDb();
  // external_sync_state may not exist in older DBs. Ignore if missing.
  try {
    await db.execute(
      `
        INSERT INTO external_sync_state (
          source, last_sync_started_at, last_sync_completed_at, last_success_at, last_error, pages_synced, records_synced
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          last_sync_started_at = VALUES(last_sync_started_at),
          last_sync_completed_at = VALUES(last_sync_completed_at),
          last_success_at = VALUES(last_success_at),
          last_error = VALUES(last_error),
          pages_synced = VALUES(pages_synced),
          records_synced = VALUES(records_synced)
      `,
      [
        SYNC_SOURCE_KEY,
        values.last_sync_started_at ?? null,
        values.last_sync_completed_at ?? null,
        values.last_success_at ?? null,
        values.last_error ?? null,
        values.pages_synced ?? 0,
        values.records_synced ?? 0,
      ]
    );
  } catch {
    // no-op
  }
}

export async function syncPolicyViolationList(): Promise<PolicyViolationSyncSummary> {
  const startedAt = new Date();
  await ensurePolicyViolationSchema();
  await updateSyncState({ last_sync_started_at: startedAt, last_error: null });

  let recordsSynced = 0;
  const sourcesScanned: string[] = [];
  let domainsTotal = 0;

  try {
    for (const source of POLICY_SOURCES) {
      sourcesScanned.push(source.sourceUrl);
      const response = await fetch(source.sourceUrl, {
        method: 'GET',
        headers: { Accept: 'text/html,application/xhtml+xml' },
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error(`Fetch failed (${response.status}) for ${source.sourceUrl}`);
      }

      const html = await response.text();
      const rows = extractPolicyRowsFromHtml(html);
      for (const row of rows) {
        for (const domain of row.domains) {
          await upsertPolicyViolation({
            domain,
            violationSummary: row.violationSummary,
            sourceName: source.sourceName,
            sourceUrl: source.sourceUrl,
            sourceTitle: row.sourceTitle,
          });
          recordsSynced += 1;
        }
        domainsTotal += row.domains.length;
      }
    }

    const completedAt = new Date();
    await updateSyncState({
      last_sync_started_at: startedAt,
      last_sync_completed_at: completedAt,
      last_success_at: completedAt,
      last_error: null,
      pages_synced: POLICY_SOURCES.length,
      records_synced: recordsSynced,
    });

    return {
      source: SYNC_SOURCE_KEY,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      recordsSynced,
      domainsTotal,
      sourcesScanned,
      lastError: null,
    };
  } catch (error) {
    const completedAt = new Date();
    const message = error instanceof Error ? error.message : 'Unknown sync error';
    await updateSyncState({
      last_sync_started_at: startedAt,
      last_sync_completed_at: completedAt,
      last_error: message,
      pages_synced: POLICY_SOURCES.length,
      records_synced: recordsSynced,
    });

    return {
      source: SYNC_SOURCE_KEY,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      recordsSynced,
      domainsTotal,
      sourcesScanned,
      lastError: message,
    };
  }
}

export async function findPolicyViolationInLocalDb(domain: string): Promise<PolicyViolationHit | null> {
  const normalized = normalizeDomainInput(domain);
  if (!normalized) return null;
  await ensurePolicyViolationSchema();

  const db = getDb();
  const [rows] = await db.execute(
    `
      SELECT
        domain,
        violation_summary AS violationSummary,
        source_name AS sourceName,
        source_url AS sourceUrl,
        source_title AS sourceTitle,
        updated_at AS updatedAt
      FROM policy_violations
      WHERE domain = ?
      LIMIT 1
    `,
    [normalized]
  );

  const items = rows as any[];
  if (!items || items.length === 0) return null;
  return items[0] as PolicyViolationHit;
}

export async function getPolicyViolationSyncSnapshot(): Promise<{
  source: string;
  lastSyncStartedAt: string | null;
  lastSyncCompletedAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  pagesSynced: number;
  recordsSynced: number;
}> {
  const db = getDb();
  try {
    const [rows] = await db.execute(
      `
        SELECT
          source,
          last_sync_started_at AS lastSyncStartedAt,
          last_sync_completed_at AS lastSyncCompletedAt,
          last_success_at AS lastSuccessAt,
          last_error AS lastError,
          pages_synced AS pagesSynced,
          records_synced AS recordsSynced
        FROM external_sync_state
        WHERE source = ?
        LIMIT 1
      `,
      [SYNC_SOURCE_KEY]
    );
    const items = rows as any[];
    if (!items || items.length === 0) {
      return {
        source: SYNC_SOURCE_KEY,
        lastSyncStartedAt: null,
        lastSyncCompletedAt: null,
        lastSuccessAt: null,
        lastError: null,
        pagesSynced: 0,
        recordsSynced: 0,
      };
    }
    return items[0];
  } catch {
    return {
      source: SYNC_SOURCE_KEY,
      lastSyncStartedAt: null,
      lastSyncCompletedAt: null,
      lastSuccessAt: null,
      lastError: null,
      pagesSynced: 0,
      recordsSynced: 0,
    };
  }
}

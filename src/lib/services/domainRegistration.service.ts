import { RowDataPacket } from 'mysql2/promise';
import { getDb } from '@/lib/db';
import { normalizeDomainInput } from '@/lib/dataSources/tinnhiemmang';
import { fetchDomainRegistration } from '@/lib/scan/deterministic';

const DEFAULT_BATCH_LIMIT = Math.max(10, Number(process.env.DOMAIN_REGISTRATION_BATCH || 200));
const DEFAULT_CONCURRENCY = Math.max(1, Number(process.env.DOMAIN_REGISTRATION_CONCURRENCY || 4));
const DEFAULT_COOLDOWN_DAYS = Math.max(1, Number(process.env.DOMAIN_REGISTRATION_COOLDOWN_DAYS || 7));
const UPDATE_CHUNK_SIZE = 200;

function toMysqlDateTime(iso: string): string {
  return iso.replace('T', ' ').replace('Z', '').slice(0, 19);
}

interface PendingRow extends RowDataPacket {
  id: string;
  value: string;
}

export interface DomainRegistrationBackfillSummary {
  rowsFetched: number;
  domainsFetched: number;
  domainsUpdated: number;
  domainsUnknown: number;
  rowsUpdated: number;
  errors: number;
}

async function updateRows(ids: string[], registeredAt: string | null): Promise<void> {
  if (!ids.length) return;
  const db = getDb();

  for (let i = 0; i < ids.length; i += UPDATE_CHUNK_SIZE) {
    const chunk = ids.slice(i, i + UPDATE_CHUNK_SIZE);
    const placeholders = chunk.map(() => '?').join(',');
    await db.query(
      `UPDATE scams SET domain_registered_at = ?, domain_registered_checked_at = NOW() WHERE id IN (${placeholders})`,
      [registeredAt, ...chunk]
    );
  }
}

export async function runDomainRegistrationBackfill(options?: {
  limit?: number;
  concurrency?: number;
  cooldownDays?: number;
}): Promise<DomainRegistrationBackfillSummary> {
  const db = getDb();
  const limit = Math.max(1, options?.limit ?? DEFAULT_BATCH_LIMIT);
  const concurrency = Math.max(1, options?.concurrency ?? DEFAULT_CONCURRENCY);
  const cooldownDays = Math.max(1, options?.cooldownDays ?? DEFAULT_COOLDOWN_DAYS);

  const [rows] = await db.query<PendingRow[]>(
    `
      SELECT id, value
      FROM scams
      WHERE type = 'website'
        AND (domain_registered_at IS NULL OR domain_registered_at = '')
        AND (domain_registered_checked_at IS NULL OR domain_registered_checked_at < DATE_SUB(NOW(), INTERVAL ? DAY))
      ORDER BY created_at DESC
      LIMIT ?
    `,
    [cooldownDays, limit]
  );

  const domainMap = new Map<string, string[]>();
  for (const row of rows) {
    const domain = normalizeDomainInput(row.value || '');
    if (!domain) continue;
    const bucket = domainMap.get(domain) ?? [];
    bucket.push(row.id);
    domainMap.set(domain, bucket);
  }

  const entries = Array.from(domainMap.entries());
  let index = 0;
  let domainsUpdated = 0;
  let domainsUnknown = 0;
  let rowsUpdated = 0;
  let errors = 0;

  const worker = async () => {
    while (true) {
      const current = entries[index];
      if (!current) return;
      index += 1;

      const [domain, ids] = current;
      try {
        const registration = await fetchDomainRegistration(domain);
        const registeredAt = registration.registeredAt ? toMysqlDateTime(registration.registeredAt) : null;
        await updateRows(ids, registeredAt);
        rowsUpdated += ids.length;
        if (registeredAt) {
          domainsUpdated += 1;
        } else {
          domainsUnknown += 1;
        }
      } catch (error) {
        errors += 1;
        await updateRows(ids, null);
      }
    }
  };

  const workers = Array.from({ length: Math.min(concurrency, entries.length || 1) }, () => worker());
  await Promise.all(workers);

  return {
    rowsFetched: rows.length,
    domainsFetched: entries.length,
    domainsUpdated,
    domainsUnknown,
    rowsUpdated,
    errors,
  };
}

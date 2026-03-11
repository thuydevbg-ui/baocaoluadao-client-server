import fs from 'node:fs';
import path from 'node:path';

type D1Config = {
  accountId: string;
  databaseId: string;
  apiToken: string;
};

let cachedConfig: D1Config | null | undefined;

function parseWranglerToml(): { accountId?: string; databaseId?: string } {
  try {
    const tomlPath = path.join(process.cwd(), 'workers', 'wrangler.toml');
    const content = fs.readFileSync(tomlPath, 'utf8');
    const accountMatch = content.match(/account_id\s*=\s*"([^"]+)"/);
    const databaseMatch = content.match(/database_id\s*=\s*"([^"]+)"/);
    return {
      accountId: accountMatch ? accountMatch[1] : undefined,
      databaseId: databaseMatch ? databaseMatch[1] : undefined,
    };
  } catch {
    return {};
  }
}

function loadD1Config(): D1Config | null {
  const apiToken = process.env.CLOUDFLARE_API_TOKEN || '';
  const envAccountId = process.env.CLOUDFLARE_ACCOUNT_ID || '';
  const envDatabaseId = process.env.CLOUDFLARE_D1_DATABASE_ID || '';

  const fallback = parseWranglerToml();
  const accountId = envAccountId || fallback.accountId || '';
  const databaseId = envDatabaseId || fallback.databaseId || '';

  if (!apiToken || !accountId || !databaseId) return null;
  return { apiToken, accountId, databaseId };
}

function getD1Config(): D1Config | null {
  if (cachedConfig === undefined) {
    cachedConfig = loadD1Config();
  }
  return cachedConfig || null;
}

export function isD1Configured(): boolean {
  return Boolean(getD1Config());
}

export function shouldUseD1Reads(): boolean {
  const flag = (process.env.USE_D1_READS || '').toLowerCase().trim();
  const enabled = flag === '1' || flag === 'true' || flag === 'yes';
  return enabled && isD1Configured();
}

type D1ApiResult<T> = {
  success?: boolean;
  result?: Array<{ results?: T[] } | { results?: T[] }>;
  errors?: Array<{ message?: string }>;
};

export async function d1Query<T = Record<string, unknown>>(
  sql: string,
  params: Array<string | number | null> = []
): Promise<T[]> {
  const config = getD1Config();
  if (!config) {
    throw new Error('D1 is not configured. Set CLOUDFLARE_API_TOKEN and D1 IDs.');
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/d1/database/${config.databaseId}/query`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
  });

  let payload: D1ApiResult<T> | null = null;
  try {
    payload = (await response.json()) as D1ApiResult<T>;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.success) {
    const message = payload?.errors?.[0]?.message || `D1 query failed (${response.status})`;
    throw new Error(message);
  }

  const result = payload.result;
  if (Array.isArray(result)) {
    return (result[0] as { results?: T[] })?.results || [];
  }
  return [];
}

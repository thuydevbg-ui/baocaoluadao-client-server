// Pipeline: trigger TinNhiemMang sync -> wait for MySQL completion -> sync MySQL to D1
// Usage:
//   INTERNAL_SYNC_TOKEN=... CLOUDFLARE_API_TOKEN=... node scripts/sync-tinnhiem-to-d1.js

const path = require('path');
const { execFileSync } = require('child_process');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

const ROOT_DIR = path.resolve(__dirname, '..');
const envPath = process.env.ENV_PATH || path.join(ROOT_DIR, '.env.production');
dotenv.config({ path: envPath });

const SOURCE_NAME = 'tinnhiemmang.vn';
const syncUrl = process.env.INTERNAL_SYNC_URL || 'http://localhost:3001/api/internal/sync-tinnhiem';
const syncToken = process.env.INTERNAL_SYNC_TOKEN || '';
const pollIntervalMs = Math.max(5000, Number(process.env.SYNC_POLL_INTERVAL_MS || 30_000));
const timeoutMs = Math.max(60_000, Number(process.env.SYNC_TIMEOUT_MINUTES || 120) * 60 * 1000);
const forceD1Sync = (process.env.FORCE_D1_SYNC || '').toLowerCase() === 'true' || process.env.FORCE_D1_SYNC === '1';

const MYSQL_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'baocaoluadao',
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function loadSyncState(conn) {
  const [rows] = await conn.query(
    'SELECT last_sync_started_at, last_sync_completed_at, last_error FROM external_sync_state WHERE source = ?',
    [SOURCE_NAME]
  );
  return rows && rows[0] ? rows[0] : null;
}

async function triggerSync() {
  if (!syncToken) {
    console.warn('INTERNAL_SYNC_TOKEN is not set. Skipping remote trigger.');
    return { triggered: false };
  }

  try {
    const response = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${syncToken}`,
      },
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error || `Sync trigger failed (${response.status})`);
    }

    console.log('Triggered TinNhiemMang sync:', payload?.message || 'OK');
    return { triggered: true };
  } catch (error) {
    console.error('Failed to trigger TinNhiemMang sync:', error?.message || error);
    return { triggered: false, error };
  }
}

async function waitForCompletion(conn, previousCompletedAt) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await sleep(pollIntervalMs);
    const state = await loadSyncState(conn);
    if (state?.last_error) {
      console.warn('Sync reported error:', state.last_error);
    }
    if (state?.last_sync_completed_at && state.last_sync_completed_at !== previousCompletedAt) {
      return { completed: true, state };
    }
  }
  return { completed: false };
}

async function main() {
  const conn = await mysql.createConnection(MYSQL_CONFIG);

  const initialState = await loadSyncState(conn);
  const previousCompletedAt = initialState?.last_sync_completed_at || null;

  const trigger = await triggerSync();
  let completed = false;

  if (trigger.triggered) {
    console.log('Waiting for sync completion...');
    const result = await waitForCompletion(conn, previousCompletedAt);
    completed = result.completed;
    if (completed) {
      console.log('TinNhiemMang sync completed.');
    }
  }

  await conn.end();

  if (trigger.triggered && !completed && !forceD1Sync) {
    console.error('Sync did not complete before timeout. Set FORCE_D1_SYNC=1 to continue anyway.');
    process.exit(1);
  }

  execFileSync('node', ['scripts/sync-mysql-to-d1.js'], {
    cwd: ROOT_DIR,
    env: process.env,
    stdio: 'inherit',
  });
}

main().catch((err) => {
  console.error('Pipeline failed:', err && err.message ? err.message : err);
  process.exit(1);
});

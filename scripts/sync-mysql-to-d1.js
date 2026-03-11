// Sync MySQL scams table into Cloudflare D1
// Usage: CLOUDFLARE_API_TOKEN=... node scripts/sync-mysql-to-d1.js

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

const ROOT_DIR = path.resolve(__dirname, '..');
const WORKERS_DIR = path.join(ROOT_DIR, 'workers');
const WRANGLER_TOML = path.join(WORKERS_DIR, 'wrangler.toml');

const envPath = process.env.ENV_PATH || path.join(ROOT_DIR, '.env.production');
dotenv.config({ path: envPath });

const token = process.env.CLOUDFLARE_API_TOKEN;
if (!token) {
  console.error('Missing CLOUDFLARE_API_TOKEN in environment.');
  process.exit(1);
}

const tomlText = fs.readFileSync(WRANGLER_TOML, 'utf8');
const dbNameMatch = tomlText.match(/database_name\s*=\s*"([^"]+)"/);
const dbName = dbNameMatch ? dbNameMatch[1] : 'baocaoluadao-d1';

const MYSQL_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'baocaoluadao',
};

const BATCH_SIZE = Math.max(20, Number(process.env.D1_BATCH_SIZE || 200));
const INSERT_ROWS = Math.max(10, Number(process.env.D1_INSERT_ROWS || 50));
const SOURCE_FILTER = process.env.SYNC_SOURCE || '';

const COLUMNS = [
  'id',
  'type',
  'value',
  'description',
  'report_count',
  'risk_level',
  'status',
  'source',
  'created_at',
  'updated_at',
  'external_status',
  'external_created_at',
  'organization_name',
  'source_url',
  'external_hash',
  'external_category',
  'icon',
  'organization_icon',
  'is_scam',
];

function toSqlValue(value) {
  if (value === null || value === undefined) return 'NULL';
  if (value instanceof Date) return `'${value.toISOString().replace(/'/g, "''")}'`;
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL';
  if (typeof value === 'boolean') return value ? '1' : '0';
  const str = String(value)
    .replace(/\u0000/g, '')
    .replace(/'/g, "''");
  return `'${str}'`;
}

function runWrangler(sqlFile) {
  execFileSync(
    'npx',
    ['wrangler', 'd1', 'execute', dbName, '--remote', '--file', sqlFile],
    {
      cwd: WORKERS_DIR,
      env: { ...process.env, CLOUDFLARE_API_TOKEN: token },
      stdio: 'inherit',
    }
  );
}

async function main() {
  const conn = await mysql.createConnection(MYSQL_CONFIG);

  const whereClause = SOURCE_FILTER ? 'WHERE source = ?' : '';
  const countParams = SOURCE_FILTER ? [SOURCE_FILTER] : [];
  const [countRows] = await conn.query(
    `SELECT COUNT(*) AS total FROM scams ${whereClause}`,
    countParams
  );

  const total = countRows[0]?.total || 0;
  console.log(`MySQL rows to sync: ${total}`);

  if (total === 0) {
    await conn.end();
    console.log('No data to sync.');
    return;
  }

  // Clear D1 scams table before import to avoid duplicates
  const clearFile = path.join('/tmp', 'd1_clear_scams.sql');
  fs.writeFileSync(clearFile, 'DELETE FROM scams;\n');
  runWrangler(clearFile);

  let offset = 0;
  let batch = 0;

  while (offset < total) {
    const params = SOURCE_FILTER ? [SOURCE_FILTER, BATCH_SIZE, offset] : [BATCH_SIZE, offset];
    const sql = SOURCE_FILTER
      ? `SELECT ${COLUMNS.join(', ')} FROM scams WHERE source = ? ORDER BY id LIMIT ? OFFSET ?`
      : `SELECT ${COLUMNS.join(', ')} FROM scams ORDER BY id LIMIT ? OFFSET ?`;

    const [rows] = await conn.query(sql, params);

    if (!rows || rows.length === 0) break;

    const statements = [];
    for (let i = 0; i < rows.length; i += INSERT_ROWS) {
      const slice = rows.slice(i, i + INSERT_ROWS);
      const values = slice
        .map((row) => `(${COLUMNS.map((col) => toSqlValue(row[col])).join(', ')})`)
        .join(',\n');
      statements.push(`INSERT OR REPLACE INTO scams (${COLUMNS.join(', ')}) VALUES\n${values};`);
    }

    const insertSql = `${statements.join('\n')}\n`;

    const batchFile = path.join('/tmp', `d1_scams_batch_${batch}.sql`);
    fs.writeFileSync(batchFile, insertSql);

    console.log(`Uploading batch ${batch + 1} (${offset + 1} - ${Math.min(offset + rows.length, total)})`);
    runWrangler(batchFile);

    offset += rows.length;
    batch += 1;
  }

  await conn.end();
  console.log('Sync complete.');
}

main().catch((err) => {
  console.error('Sync failed:', err && err.message ? err.message : err);
  process.exit(1);
});

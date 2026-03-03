import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import crypto from 'node:crypto';

// ============================================
// CONSTANT-TIME COMPARISON - PREVENT TIMING ATTACKS
// ============================================

function safeCompare(a: string | undefined, b: string): boolean {
  if (!a || a.length !== b.length) return false;
  try {
    const aBuf = Buffer.from(a);
    const bBuf = Buffer.from(b);
    return crypto.timingSafeEqual(aBuf, bBuf);
  } catch {
    return false;
  }
}

// ============================================
// IP-BASED ACCESS CONTROL - SECURITY LAYER
// ============================================

// ============================================
// IP VALIDATION - SECURITY FIX
// ============================================

// Validate IP address format (IPv4 and IPv6)
function isValidIP(ip: string): boolean {
  if (!ip || typeof ip !== 'string') return false;
  
  // IPv4 validation
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Pattern.test(ip)) {
    const parts = ip.split('.').map(Number);
    return parts.every(part => part >= 0 && part <= 255);
  }
  
  // IPv6 validation (simplified)
  const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  const ipv6ShortPattern = /^([0-9a-fA-F]{1,4}:)*:[0-9a-fA-F]{1,4}$/;
  return ipv6Pattern.test(ip) || ipv6ShortPattern.test(ip);
}

// Whitelisted IPs that are allowed to access (add your server IP here)
const ALLOWED_IPS = new Set<string>(
  (process.env.DB_MANAGER_ALLOWED_IPS || '127.0.0.1,localhost')
    .split(',')
    .map(ip => ip.trim().toLowerCase())
    .filter(ip => ip.length > 0)
);

// Trusted proxy IPs - only these IPs can set forwarded headers
const TRUSTED_PROXIES = new Set<string>(
  (process.env.DB_MANAGER_TRUSTED_PROXIES || '')
    .split(',')
    .map(ip => ip.trim().toLowerCase())
    .filter(ip => ip.length > 0)
);

// Permanently banned IPs (unauthorized access attempts will be added here)
const PERMANENTLY_BANNED_IPS = new Set<string>();

// Rate limiting for banned IP detection
const FAILED_ATTEMPT_MAP = new Map<string, { count: number; firstAttempt: number }>();
const MAX_FAILED_ATTEMPTS = 3; // Ban after 3 failed attempts
const BAN_CHECK_WINDOW = 60000; // 1 minute window

/**
 * Get client IP from request - SECURE VERSION
 * Only trusts x-forwarded-for from trusted proxies
 */
function getClientIP(request: NextRequest): string {
  // Get the direct remote address from the connection
  let remoteIP: string | null = null;
  
  // Try to get from Next.js headers (set by the server)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  // Check if request comes from a trusted proxy
  // If no trusted proxies configured, don't trust any x-forwarded-for
  const forwardedIPs = forwarded ? forwarded.split(',').map(ip => ip.trim()) : [];
  
  // SECURITY FIX: Only trust x-forwarded-for if we have trusted proxies configured
  // and the first IP in the chain is from a trusted proxy
  if (TRUSTED_PROXIES.size > 0 && forwardedIPs.length > 0) {
    const clientIP = forwardedIPs[forwardedIPs.length - 1].toLowerCase();
    // The immediate proxy should be trusted
    const proxyIP = forwardedIPs[0].toLowerCase();
    
    if (isValidIP(proxyIP) && (TRUSTED_PROXIES.has(proxyIP) || TRUSTED_PROXIES.has('*'))) {
      // Use the last IP (original client) after validating it's a valid IP
      if (isValidIP(clientIP)) {
        return clientIP;
      }
    }
  }
  
  // Fallback: use x-real-ip only if it's a valid IP
  if (realIP && isValidIP(realIP)) {
    return realIP.toLowerCase();
  }
  
  // If we have forwarded headers but no trusted proxies, log a warning
  if ((forwarded || realIP) && TRUSTED_PROXIES.size === 0) {
    console.log('[SECURITY] Received forwarded headers but no trusted proxies configured. Ignoring forwarded headers.');
  }
  
  // Fallback to unknown - this will cause the request to be denied
  return 'unknown';
}

/**
 * Check if IP is permanently banned
 */
function isIPBanned(ip: string): boolean {
  if (ip === 'unknown' || ip === '127.0.0.1' || ip === 'localhost') return false;
  return PERMANENTLY_BANNED_IPS.has(ip);
}

/**
 * Check if IP is whitelisted
 */
function isIPAllowed(ip: string): boolean {
  if (ip === 'unknown') return false;
  
  // Check exact match
  if (ALLOWED_IPS.has(ip)) return true;
  
  // Check CIDR support (e.g., 192.168.1.0/24)
  for (const allowed of ALLOWED_IPS) {
    if (allowed.includes('/')) {
      if (ipInCIDR(ip, allowed)) return true;
    }
  }
  
  return false;
}

/**
 * Check if IP is in CIDR range
 */
function ipInCIDR(ip: string, cidr: string): boolean {
  const [range, bits] = cidr.split('/');
  if (!bits) return ip === range;
  
  const mask = ~(2 ** (32 - parseInt(bits)) - 1);
  const ipNum = ipToNumber(ip);
  const rangeNum = ipToNumber(range);
  
  return (ipNum & mask) === (rangeNum & mask);
}

/**
 * Convert IP string to number
 */
function ipToNumber(ip: string): number {
  const parts = ip.split('.').map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

/**
 * Permanently ban an IP
 */
function banIP(ip: string): void {
  if (ip && ip !== 'unknown' && ip !== '127.0.0.1' && ip !== 'localhost') {
    PERMANENTLY_BANNED_IPS.add(ip);
    console.log(`[SECURITY] IP permanently banned: ${ip}`);
  }
}

/**
 * Record failed attempt and ban if too many
 */
function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const record = FAILED_ATTEMPT_MAP.get(ip);
  
  if (!record || now - record.firstAttempt > BAN_CHECK_WINDOW) {
    FAILED_ATTEMPT_MAP.set(ip, { count: 1, firstAttempt: now });
    return;
  }
  
  record.count++;
  
  // Ban permanently if too many failed attempts
  if (record.count >= MAX_FAILED_ATTEMPTS) {
    banIP(ip);
    FAILED_ATTEMPT_MAP.delete(ip);
  }
}

/**
 * Main IP access check - returns { allowed, banned, reason }
 */
function checkIPAccess(ip: string): { allowed: boolean; banned: boolean; reason: string } {
  // Check if permanently banned
  if (isIPBanned(ip)) {
    return { allowed: false, banned: true, reason: 'Permanently banned' };
  }
  
  // Check if whitelisted
  if (isIPAllowed(ip)) {
    return { allowed: true, banned: false, reason: 'Allowed IP' };
  }
  
  // Not in whitelist - record failed attempt
  recordFailedAttempt(ip);
  
  return { allowed: false, banned: false, reason: 'IP not whitelisted' };
}

// Secret key for authentication (REQUIRED even for allowed IPs)
// CRITICAL: Throw error if not configured - never accept empty string
const SECRET_KEY = process.env.DB_MANAGER_KEY;
if (!SECRET_KEY) {
  console.error('[CRITICAL] DB_MANAGER_KEY environment variable is not set!');
}

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // requests per minute
const RATE_WINDOW = 60000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT) {
    return false;
  }
  
  record.count++;
  return true;
}

// SQL injection prevention - whitelist approach
function validateTableName(table: string): boolean {
  // Only allow alphanumeric, underscore, and common table name patterns
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table) && table.length < 64;
}

function validateColumnName(column: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(column) && column.length < 64;
}

function getDb() {
  return mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'baocaoluadao',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'baocaoluadao',
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
  });
}

function authCheck(request: NextRequest): { authorized: boolean; ip: string } {
  const ip = getClientIP(request);
  
  // FIRST: Check IP access - this is the most important security layer
  const ipCheck = checkIPAccess(ip);
  
  if (ipCheck.banned) {
    console.log(`[SECURITY] Blocked banned IP: ${ip}`);
    return { authorized: false, ip };
  }
  
  if (!ipCheck.allowed) {
    console.log(`[SECURITY] Blocked non-whitelisted IP: ${ip} - ${ipCheck.reason}`);
    return { authorized: false, ip };
  }
  
  // SECOND: Check API key (still required for allowed IPs)
  const key = request.nextUrl.searchParams.get('key');
  
  // Reject if no key provided or secret is not configured
  if (!SECRET_KEY) {
    logQuery(ip, 'AUTH_FAIL', 'DB_MANAGER_KEY not configured on server');
    return { authorized: false, ip };
  }
  
  if (!key || !safeCompare(key, SECRET_KEY)) {
    recordFailedAttempt(ip);
    return { authorized: false, ip };
  }
  
  return { authorized: true, ip };
}

// Log all queries for security audit
function logQuery(ip: string, action: string, details: string) {
  const timestamp = new Date().toISOString();
  console.log(`[DB Manager] ${timestamp} | IP: ${ip} | Action: ${action} | ${details}`);
}

export async function GET(request: NextRequest) {
  try {
    const { authorized, ip } = authCheck(request);
    
    if (!authorized) {
      const ipCheck = checkIPAccess(ip);
      if (ipCheck.banned) {
        logQuery(ip, 'BLOCKED', 'Permanently banned IP attempted access');
        return NextResponse.json({ error: 'IP permanently banned', code: 'IP_BANNED' }, { status: 403 });
      }
      if (!ipCheck.allowed) {
        logQuery(ip, 'BLOCKED', `Non-whitelisted IP attempted access - ${ipCheck.reason}`);
        return NextResponse.json({ error: 'IP not whitelisted', code: 'IP_NOT_ALLOWED' }, { status: 403 });
      }
      logQuery(ip, 'AUTH_FAIL', 'Invalid API key');
      return NextResponse.json({ error: 'Unauthorized - Invalid key', code: 'INVALID_KEY' }, { status: 401 });
    }

    const db = getDb();
    const action = request.nextUrl.searchParams.get('action') || 'tables';

    switch (action) {
      case 'tables': {
        const [tables] = await db.query('SHOW TABLES');
        logQuery(ip, 'LIST_TABLES', 'Listed all tables');
        return NextResponse.json({ success: true, tables });
      }

      case 'tableStatus': {
        const [status] = await db.query('SHOW TABLE STATUS');
        logQuery(ip, 'TABLE_STATUS', 'Got table status');
        return NextResponse.json({ success: true, status });
      }

      case 'columns': {
        const table = request.nextUrl.searchParams.get('table');
        if (!table || !validateTableName(table)) {
          return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
        }
        const [columns] = await db.query(`DESCRIBE \`${table}\``);
        logQuery(ip, 'DESCRIBE', `Described table: ${table}`);
        return NextResponse.json({ success: true, columns });
      }

      case 'indexes': {
        const table = request.nextUrl.searchParams.get('table');
        if (!table || !validateTableName(table)) {
          return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
        }
        const [indexes] = await db.query(`SHOW INDEX FROM \`${table}\``);
        logQuery(ip, 'INDEXES', `Showed indexes for: ${table}`);
        return NextResponse.json({ success: true, indexes });
      }

      case 'createTable': {
        const table = request.nextUrl.searchParams.get('table');
        if (!table || !validateTableName(table)) {
          return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
        }
        const [createStmt] = await db.query(`SHOW CREATE TABLE \`${table}\``);
        logQuery(ip, 'CREATE_TABLE', `Got create statement for: ${table}`);
        return NextResponse.json({ success: true, createTable: createStmt });
      }

      case 'data': {
        const table = request.nextUrl.searchParams.get('table');
        const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
        const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '50'), 500);
        const orderBy = request.nextUrl.searchParams.get('orderBy') || 'id';
        const orderDir = request.nextUrl.searchParams.get('orderDir') || 'DESC';
        const search = request.nextUrl.searchParams.get('search') || '';
        
        if (!table || !validateTableName(table)) {
          return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
        }

        if (!validateColumnName(orderBy)) {
          return NextResponse.json({ error: 'Invalid order column' }, { status: 400 });
        }

        const offset = (page - 1) * limit;
        
        // Get total count with optional search
        let countQuery = `SELECT COUNT(*) as total FROM \`${table}\``;
        let queryParams: any[] = [];
        
        if (search) {
          // Get column names for search
          const [cols] = await db.query(`SHOW COLUMNS FROM \`${table}\``) as any[];
          const searchableCols = cols.filter((c: any) => 
            c.Type.includes('varchar') || c.Type.includes('text') || c.Type.includes('char')
          ).map((c: any) => c.Field);
          
          if (searchableCols.length > 0) {
            const searchConditions = searchableCols.map((col: string) => `\`${col}\` LIKE ?`).join(' OR ');
            countQuery = `SELECT COUNT(*) as total FROM \`${table}\` WHERE ${searchConditions.replace(`${table}.`, '')}`;
            queryParams = searchableCols.map(() => `%${search}%`);
          }
        }
        
        const [countResult]: any = await db.query(countQuery, queryParams);
        const total = countResult[0]?.total || 0;

        // Get data with pagination
        let dataQuery = `SELECT * FROM \`${table}\` ORDER BY \`${orderBy}\` ${orderDir} LIMIT ? OFFSET ?`;
        let dataParams: any[] = [limit, offset];
        
        if (search && queryParams.length > 0) {
          const [cols] = await db.query(`SHOW COLUMNS FROM \`${table}\``) as any[];
          const searchableCols = cols.filter((c: any) => 
            c.Type.includes('varchar') || c.Type.includes('text') || c.Type.includes('char')
          ).map((c: any) => c.Field);
          
          if (searchableCols.length > 0) {
            const searchConditions = searchableCols.map((c: string) => `\`${c}\` LIKE ?`).join(' OR ');
            dataQuery = `SELECT * FROM \`${table}\` WHERE ${searchConditions} ORDER BY \`${orderBy}\` ${orderDir} LIMIT ? OFFSET ?`;
            const searchParams = searchableCols.map(() => `%${search}%`);
            dataParams = [...searchParams, limit, offset];
          }
        }

        const [data] = await db.query(dataQuery, dataParams) as any[];

        logQuery(ip, 'SELECT_DATA', `Selected from ${table}: ${Array.isArray(data) ? data.length : 0} rows`);
        return NextResponse.json({
          success: true,
          data,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        });
      }

      // SECURITY FIX: Removed arbitrary SQL query execution.
        // The 'query' action has been disabled for security reasons.
        // Use specific read-only actions: tables, columns, data, etc.
        logQuery(ip, 'QUERY_BLOCKED', 'Arbitrary query execution is disabled');
        return NextResponse.json({ 
          error: 'Arbitrary SQL query execution is disabled for security reasons. Use specific read-only actions (tables, columns, data, indexes, etc.) instead.'
        }, { status: 403 });

      case 'databases': {
        const [databases] = await db.query('SHOW DATABASES');
        logQuery(ip, 'DATABASES', 'Listed databases');
        return NextResponse.json({ success: true, databases });
      }

      case 'processlist': {
        const [processes] = await db.query('SHOW PROCESSLIST');
        logQuery(ip, 'PROCESSES', 'Listed processes');
        return NextResponse.json({ success: true, processes });
      }

      case 'variables': {
        const [variables] = await db.query('SHOW VARIABLES');
        logQuery(ip, 'VARIABLES', 'Listed variables');
        return NextResponse.json({ success: true, variables });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (err: any) {
    console.error('DB Manager Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { authorized, ip } = authCheck(request);
    
    if (!authorized) {
      const ipCheck = checkIPAccess(ip);
      if (ipCheck.banned) {
        logQuery(ip, 'BLOCKED', 'Permanently banned IP attempted access');
        return NextResponse.json({ error: 'IP permanently banned', code: 'IP_BANNED' }, { status: 403 });
      }
      if (!ipCheck.allowed) {
        logQuery(ip, 'BLOCKED', `Non-whitelisted IP attempted access - ${ipCheck.reason}`);
        return NextResponse.json({ error: 'IP not whitelisted', code: 'IP_NOT_ALLOWED' }, { status: 403 });
      }
      logQuery(ip, 'AUTH_FAIL', 'Invalid API key');
      return NextResponse.json({ error: 'Unauthorized - Invalid key', code: 'INVALID_KEY' }, { status: 401 });
    }

    const db = getDb();
    const body = await request.json();
    const { action, table, data, sql, columns, column: dropColumn, values } = body;

    switch (action) {
      case 'insert': {
        if (!table || !data || !validateTableName(table)) {
          return NextResponse.json({ error: 'Invalid table or data' }, { status: 400 });
        }
        
        const fields = Object.keys(data);
        const placeholders = fields.map(() => '?').join(', ');
        const values = Object.values(data);
        
        const startTime = Date.now();
        const [result]: any = await db.query(
          `INSERT INTO \`${table}\` (${fields.map(f => `\`${f}\``).join(', ')}) VALUES (${placeholders})`,
          values
        );
        
        logQuery(ip, 'INSERT', `Inserted into ${table}: ${result.affectedRows} row, ${Date.now() - startTime}ms`);
        
        return NextResponse.json({ 
          success: true, 
          message: 'Row inserted successfully',
          insertId: result.insertId,
          affectedRows: result.affectedRows
        });
      }

      case 'update': {
        if (!table || !data || !validateTableName(table)) {
          return NextResponse.json({ error: 'Invalid table or data' }, { status: 400 });
        }
        
        const { set, where, whereValues } = data;
        
        // SECURITY: Validate WHERE clause to prevent SQL injection
        // Only allow: column names, operators (=, !=, <, >, <=, >=, LIKE, IN, IS NULL, IS NOT NULL), AND, OR, parentheses
        if (where && typeof where === 'string') {
          const unsafePattern = /[;\-@#$%^&*()+={}\[\]\\|'"]/;
          if (unsafePattern.test(where)) {
            return NextResponse.json({ error: 'Invalid characters in WHERE clause' }, { status: 400 });
          }
        }
        
        const setFields = Object.keys(set).map(f => `\`${f}\` = ?`).join(', ');
        const setValues = Object.values(set);
        
        const startTime = Date.now();
        const [result]: any = await db.query(
          `UPDATE \`${table}\` SET ${setFields} WHERE ${where}`,
          [...setValues, ...(whereValues || [])]
        );
        
        logQuery(ip, 'UPDATE', `Updated ${table}: ${result.affectedRows} rows, ${Date.now() - startTime}ms`);
        
        return NextResponse.json({ 
          success: true, 
          message: 'Row updated successfully',
          affectedRows: result.affectedRows
        });
      }

      case 'delete': {
        if (!table || !data || !validateTableName(table)) {
          return NextResponse.json({ error: 'Invalid table or data' }, { status: 400 });
        }
        
        const { where, whereValues } = data;
        
        // SECURITY: Validate WHERE clause to prevent SQL injection
        if (where && typeof where === 'string') {
          const unsafePattern = /[;\-@#$%^&*()+={}\[\]\\|'"]/;
          if (unsafePattern.test(where)) {
            return NextResponse.json({ error: 'Invalid characters in WHERE clause' }, { status: 400 });
          }
        }
        
        const startTime = Date.now();
        const [result]: any = await db.query(
          `DELETE FROM \`${table}\` WHERE ${where}`,
          whereValues || []
        );
        
        logQuery(ip, 'DELETE', `Deleted from ${table}: ${result.affectedRows} rows, ${Date.now() - startTime}ms`);
        
        return NextResponse.json({ 
          success: true, 
          message: 'Row deleted successfully',
          affectedRows: result.affectedRows
        });
      }

      // SECURITY FIX: Disabled arbitrary SQL query execution via POST.
        // Write operations (INSERT, UPDATE, DELETE) should use dedicated actions.
        logQuery(ip, 'QUERY_BLOCKED', 'Arbitrary query via POST is disabled');
        return NextResponse.json({ 
          error: 'Arbitrary SQL query execution is disabled for security reasons. Use dedicated actions (insert, update, delete) for data modifications.'
        }, { status: 403 });

      case 'createTable': {
        if (!table || !columns || !validateTableName(table)) {
          return NextResponse.json({ error: 'Table name and columns required' }, { status: 400 });
        }
        
        const columnDefs = columns.map((col: any) => {
          let def = `\`${col.name}\` ${col.type}`;
          if (col.primary) def += ' PRIMARY KEY';
          if (col.autoIncrement) def += ' AUTO_INCREMENT';
          if (!col.nullable) def += ' NOT NULL';
          if (col.default) def += ` DEFAULT ${col.default}`;
          if (col.unique) def += ' UNIQUE';
          return def;
        }).join(', ');

        await db.query(`CREATE TABLE \`${table}\` (${columnDefs})`);
        
        logQuery(ip, 'CREATE_TABLE', `Created table: ${table}`);
        
        return NextResponse.json({ success: true, message: `Table ${table} created successfully` });
      }

      case 'dropTable': {
        if (!table || !validateTableName(table)) {
          return NextResponse.json({ error: 'Valid table name required' }, { status: 400 });
        }
        
        if (!body.confirm) {
          return NextResponse.json({ 
            warning: `Are you sure you want to DROP table "${table}"? This action cannot be undone!`,
            requiresConfirmation: true,
            action: 'dropTable',
            table
          });
        }
        
        await db.query(`DROP TABLE IF EXISTS \`${table}\``);
        
        logQuery(ip, 'DROP_TABLE', `Dropped table: ${table}`);
        
        return NextResponse.json({ success: true, message: `Table ${table} dropped successfully` });
      }

      case 'truncateTable': {
        if (!table || !validateTableName(table)) {
          return NextResponse.json({ error: 'Valid table name required' }, { status: 400 });
        }
        
        if (!body.confirm) {
          return NextResponse.json({ 
            warning: `Are you sure you want to TRUNCATE table "${table}"? All data will be lost!`,
            requiresConfirmation: true,
            action: 'truncateTable',
            table
          });
        }
        
        await db.query(`TRUNCATE TABLE \`${table}\``);
        
        logQuery(ip, 'TRUNCATE', `Truncated table: ${table}`);
        
        return NextResponse.json({ success: true, message: `Table ${table} truncated successfully` });
      }

      case 'renameTable': {
        if (!table || !body.newName || !validateTableName(table) || !validateTableName(body.newName)) {
          return NextResponse.json({ error: 'Valid table names required' }, { status: 400 });
        }
        
        await db.query(`RENAME TABLE \`${table}\` TO \`${body.newName}\``);
        
        logQuery(ip, 'RENAME', `Renamed table: ${table} -> ${body.newName}`);
        
        return NextResponse.json({ success: true, message: `Table renamed to ${body.newName}` });
      }

      case 'addColumn': {
        if (!table || !columns || !validateTableName(table)) {
          return NextResponse.json({ error: 'Table name and column definition required' }, { status: 400 });
        }
        
        const col = columns[0];
        if (!validateColumnName(col.name)) {
          return NextResponse.json({ error: 'Invalid column name' }, { status: 400 });
        }
        
        let def = `ADD COLUMN \`${col.name}\` ${col.type}`;
        if (col.after) def += ` AFTER \`${col.after}\``;
        
        await db.query(`ALTER TABLE \`${table}\` ${def}`);
        
        logQuery(ip, 'ADD_COLUMN', `Added column ${col.name} to ${table}`);
        
        return NextResponse.json({ success: true, message: `Column ${col.name} added successfully` });
      }

      case 'dropColumn': {
        if (!table || !dropColumn || !validateTableName(table) || !validateColumnName(dropColumn)) {
          return NextResponse.json({ error: 'Valid table and column names required' }, { status: 400 });
        }
        
        await db.query(`ALTER TABLE \`${table}\` DROP COLUMN \`${dropColumn}\``);
        
        logQuery(ip, 'DROP_COLUMN', `Dropped column ${dropColumn} from ${table}`);
        
        return NextResponse.json({ success: true, message: `Column ${dropColumn} dropped successfully` });
      }

      case 'addIndex': {
        if (!table || !body.indexName || !body.columns || !validateTableName(table)) {
          return NextResponse.json({ error: 'Table name, index name, and columns required' }, { status: 400 });
        }
        
        const indexType = body.indexType || 'INDEX';
        const columnsStr = body.columns.map((c: string) => `\`${c}\``).join(', ');
        
        await db.query(`ALTER TABLE \`${table}\` ADD ${indexType} \`${body.indexName}\` (${columnsStr})`);
        
        logQuery(ip, 'ADD_INDEX', `Added index ${body.indexName} to ${table}`);
        
        return NextResponse.json({ success: true, message: `Index ${body.indexName} added successfully` });
      }

      case 'dropIndex': {
        if (!table || !body.indexName || !validateTableName(table)) {
          return NextResponse.json({ error: 'Table name and index name required' }, { status: 400 });
        }
        
        await db.query(`ALTER TABLE \`${table}\` DROP INDEX \`${body.indexName}\``);
        
        logQuery(ip, 'DROP_INDEX', `Dropped index ${body.indexName} from ${table}`);
        
        return NextResponse.json({ success: true, message: `Index ${body.indexName} dropped successfully` });
      }

      case 'importSQL': {
        if (!sql) {
          return NextResponse.json({ error: 'SQL content required' }, { status: 400 });
        }

        // Split SQL into individual statements
        const statements = sql.split(';').filter((s: string) => s.trim());
        let imported = 0;
        let errors: string[] = [];
        const connection = await db.getConnection();
        
        try {
          await connection.beginTransaction();
          
          for (const stmt of statements) {
            try {
              if (stmt.trim()) {
                await connection.query(stmt);
                imported++;
              }
            } catch (err: any) {
              errors.push(`Statement ${imported + 1}: ${err.message}`);
            }
          }
          
          await connection.commit();
        } catch (err: any) {
          await connection.rollback();
          errors.push(`Transaction failed: ${err.message}`);
        } finally {
          connection.release();
        }

        logQuery(ip, 'IMPORT', `Imported ${imported} statements, ${errors.length} errors`);
        
        return NextResponse.json({ 
          success: true, 
          imported,
          errors: errors.length > 0 ? errors : undefined,
          message: `Imported ${imported} statements`
        });
      }

      case 'backup': {
        // Generate backup SQL for a table
        if (!table || !validateTableName(table)) {
          return NextResponse.json({ error: 'Valid table name required' }, { status: 400 });
        }
        
        const [createStmt]: any = await db.query(`SHOW CREATE TABLE \`${table}\``);
        const [data] = await db.query(`SELECT * FROM \`${table}\``);
        
        let backupSQL = `-- Backup for table ${table}\n`;
        backupSQL += `DROP TABLE IF EXISTS \`${table}\`;\n\n`;
        backupSQL += createStmt[0]['Create Table'] + ';\n\n';
        
        for (const row of data as any[]) {
          const fields = Object.keys(row).map(f => `\`${f}\``).join(', ');
          const values = Object.values(row).map(v => {
            if (v === null) return 'NULL';
            if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
            if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
            return v;
          }).join(', ');
          backupSQL += `INSERT INTO \`${table}\` (${fields}) VALUES (${values});\n`;
        }
        
        logQuery(ip, 'BACKUP', `Backed up table: ${table}`);
        
        return NextResponse.json({ 
          success: true, 
          backup: backupSQL,
          table,
          rowCount: Array.isArray(data) ? data.length : 0
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (err: any) {
    console.error('DB Manager Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

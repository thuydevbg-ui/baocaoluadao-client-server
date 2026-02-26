/**
 * Database Query Layer for Admin Management
 * Replaces in-memory stores with proper database operations
 * Uses MySQL connection pooling from src/lib/db.ts
 */

import { getDb } from './db';
import { RowDataPacket } from 'mysql2/promise';
import {
  AdminUserRole,
  AdminUserStatus,
  AdminScamType,
  AdminScamRiskLevel,
  AdminScamStatus,
  AdminActivityStatus,
  AdminUserRecord,
  AdminScamRecord,
  AdminActivityRecord,
} from './adminManagementStore';

// ============================================
// Type Definitions (matching schema)
// ============================================

// MySQL row types
export interface IdRow extends RowDataPacket {
  id: string;
}

export interface CountRow extends RowDataPacket {
  count: number;
}

export interface StatusCountRow extends RowDataPacket {
  status: string;
  count: number;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UserListResult extends PagedResult<AdminUserRecord> {
  summary: {
    total: number;
    active: number;
    banned: number;
    suspended: number;
  };
}

export interface ScamListResult extends PagedResult<AdminScamRecord> {
  summary: {
    total: number;
    active: number;
    investigating: number;
    blocked: number;
  };
}

export interface ListUserOptions {
  page?: number;
  pageSize?: number;
  q?: string;
  role?: 'all' | AdminUserRole;
  status?: 'all' | AdminUserStatus;
}

export interface ListScamOptions {
  page?: number;
  pageSize?: number;
  q?: string;
  type?: 'all' | AdminScamType;
  status?: 'all' | AdminScamStatus;
  riskLevel?: 'all' | AdminScamRiskLevel;
}

export interface ListActivityOptions {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: 'all' | AdminActivityStatus;
}

export interface UpdateUserPayload {
  status?: AdminUserStatus;
  role?: AdminUserRole;
  actor?: string;
  ip?: string;
}

export interface CreateScamPayload {
  type: AdminScamType;
  value: string;
  description: string;
  riskLevel?: AdminScamRiskLevel;
  status?: AdminScamStatus;
  source?: string;
  reportCount?: number;
  actor?: string;
  ip?: string;
}

export interface UpdateScamPayload {
  description?: string;
  riskLevel?: AdminScamRiskLevel;
  status?: AdminScamStatus;
  reportCount?: number;
  source?: string;
  actor?: string;
  ip?: string;
}

export interface DeleteScamPayload {
  actor?: string;
  ip?: string;
}

export interface ManagementOverview {
  users: {
    total: number;
    active: number;
    banned: number;
    suspended: number;
  };
  scams: {
    total: number;
    active: number;
    investigating: number;
    blocked: number;
  };
  recentLogs: AdminActivityRecord[];
}

// ============================================
// Helper Functions
// ============================================

function parsePaging(input: { page?: number; pageSize?: number }): { page: number; pageSize: number } {
  const page = Math.max(1, Number(input.page || 1));
  const pageSize = Math.max(1, Math.min(100, Number(input.pageSize || 10)));
  return { page, pageSize };
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeText(input: string): string {
  return input.trim().toLowerCase();
}

/**
 * Log database errors with context
 */
function logDbError(context: string, error: unknown): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`[DB Error] ${context}:`, errorMessage);
}

/**
 * Generate a unique ID for new records
 */
async function generateUniqueId(prefix: string, table: string, column: string): Promise<string> {
  const db = getDb();
  const [rows] = await db.query<IdRow[]>(
    `SELECT ${column} as id FROM ${table} WHERE ${column} LIKE ? ORDER BY ${column} DESC LIMIT 1`,
    [`${prefix}%`]
  );
  
  if (rows.length === 0) {
    return `${prefix}001`;
  }
  
  const lastId = rows[0].id;
  const numPart = parseInt(lastId.replace(prefix, ''), 10);
  const nextNum = isNaN(numPart) ? 1 : numPart + 1;
  return `${prefix}${String(nextNum).padStart(3, '0')}`;
}

// ============================================
// Admin Users Queries
// ============================================

/**
 * List admin users with pagination and filtering
 */
export async function listAdminUsers(options: ListUserOptions = {}): Promise<UserListResult> {
  const db = getDb();
  const { page, pageSize } = parsePaging(options);
  const q = normalizeText(options.q || '');
  const roleFilter = options.role || 'all';
  const statusFilter = options.status || 'all';

  try {
    // Build WHERE clause
    const whereConditions: string[] = [];
    const params: (string | number)[] = [];

    if (q) {
      whereConditions.push('(id LIKE ? OR name LIKE ? OR email LIKE ?)');
      const searchPattern = `%${q}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (roleFilter !== 'all') {
      whereConditions.push('role = ?');
      params.push(roleFilter);
    }

    if (statusFilter !== 'all') {
      whereConditions.push('status = ?');
      params.push(statusFilter);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const [countResult] = await db.query<CountRow[]>(
      `SELECT COUNT(*) as count FROM admin_users ${whereClause}`,
      params
    );
    const total = countResult[0]?.count || 0;

    // Get paginated results ordered by last_login_at descending
    const offset = (page - 1) * pageSize;
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT 
        id,
        name,
        email,
        '' as phone,
        role,
        status,
        0 as reputationScore,
        0 as reportCount,
        0 as verifiedReportCount,
        COALESCE(created_at, NOW()) as joinedAt,
        COALESCE(last_login_at, created_at) as lastActiveAt,
        COALESCE(updated_at, NOW()) as updatedAt
      FROM admin_users 
      ${whereClause}
      ORDER BY last_login_at DESC
      LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );
    const items = rows as AdminUserRecord[];

    // Get summary counts
    const [summaryRows] = await db.query<StatusCountRow[]>(
      `SELECT status, COUNT(*) as count FROM admin_users GROUP BY status`
    );

    const summary = { total: 0, active: 0, banned: 0, suspended: 0 };
    summaryRows.forEach((row) => {
      summary.total += row.count;
      if (row.status === 'active') summary.active = row.count;
      else if (row.status === 'banned') summary.banned = row.count;
      else if (row.status === 'suspended') summary.suspended = row.count;
    });

    return {
      items: rows as AdminUserRecord[],
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      summary,
    };
  } catch (error) {
    logDbError('listAdminUsers', error);
    throw new Error('Failed to fetch admin users');
  }
}

/**
 * Get admin user by ID
 */
export async function getAdminUserById(id: string): Promise<AdminUserRecord | null> {
  const db = getDb();

  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT 
        id,
        name,
        email,
        '' as phone,
        role,
        status,
        0 as reputationScore,
        0 as reportCount,
        0 as verifiedReportCount,
        COALESCE(created_at, NOW()) as joinedAt,
        COALESCE(last_login_at, created_at) as lastActiveAt,
        COALESCE(updated_at, NOW()) as updatedAt
      FROM admin_users 
      WHERE id = ?`,
      [id]
    );

    return (rows[0] as AdminUserRecord) || null;
  } catch (error) {
    logDbError('getAdminUserById', error);
    throw new Error('Failed to fetch admin user');
  }
}

/**
 * Update admin user (status and/or role)
 */
export async function updateAdminUser(
  id: string,
  payload: UpdateUserPayload
): Promise<AdminUserRecord | null> {
  const db = getDb();
  const actor = (payload.actor || 'admin@scamguard.vn').slice(0, 120);

  try {
    // Check if user exists
    const existing = await getAdminUserById(id);
    if (!existing) return null;

    // Build update query
    const updates: string[] = [];
    const params: (string | number)[] = [];

    if (payload.status) {
      updates.push('status = ?');
      params.push(payload.status);
    }

    if (payload.role) {
      updates.push('role = ?');
      params.push(payload.role);
    }

    if (updates.length === 0) {
      return existing;
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    await db.query(
      `UPDATE admin_users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Get updated record
    const updated = await getAdminUserById(id);

    // Record activity
    if (updated) {
      await recordAdminActivity({
        action: 'Cap nhat nguoi dung',
        user: actor,
        target: `${id}:${updated.status}:${updated.role}`,
        status: updated.status === 'banned' ? 'warning' : 'success',
        ip: payload.ip,
      });
    }

    return updated;
  } catch (error) {
    logDbError('updateAdminUser', error);
    throw new Error('Failed to update admin user');
  }
}

// ============================================
// Admin Scams Queries
// ============================================

/**
 * List scams with pagination and filtering
 */
export async function listAdminScams(options: ListScamOptions = {}): Promise<ScamListResult> {
  const db = getDb();
  const { page, pageSize } = parsePaging(options);
  const q = normalizeText(options.q || '');
  const typeFilter = options.type || 'all';
  const statusFilter = options.status || 'all';
  const riskFilter = options.riskLevel || 'all';

  try {
    // Build WHERE clause
    const whereConditions: string[] = [];
    const params: (string | number)[] = [];

    if (q) {
      whereConditions.push('(id LIKE ? OR value LIKE ? OR description LIKE ?)');
      const searchPattern = `%${q}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (typeFilter !== 'all') {
      whereConditions.push('type = ?');
      params.push(typeFilter);
    }

    if (statusFilter !== 'all') {
      whereConditions.push('status = ?');
      params.push(statusFilter);
    }

    if (riskFilter !== 'all') {
      whereConditions.push('risk_level = ?');
      params.push(riskFilter);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const [countResult] = await db.query<CountRow[]>(
      `SELECT COUNT(*) as count FROM scams ${whereClause}`,
      params
    );
    const total = countResult[0]?.count || 0;

    // Get paginated results ordered by updated_at descending
    const offset = (page - 1) * pageSize;
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT 
        id,
        type,
        value,
        description,
        report_count as reportCount,
        risk_level as riskLevel,
        status,
        source,
        created_at as createdAt,
        updated_at as updatedAt
      FROM scams 
      ${whereClause}
      ORDER BY updated_at DESC
      LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );
    const items = rows as AdminScamRecord[];

    // Get summary counts
    const [summaryRows] = await db.query<StatusCountRow[]>(
      `SELECT status, COUNT(*) as count FROM scams GROUP BY status`
    );

    const summary = { total: 0, active: 0, investigating: 0, blocked: 0 };
    summaryRows.forEach((row) => {
      summary.total += row.count;
      if (row.status === 'active') summary.active = row.count;
      else if (row.status === 'investigating') summary.investigating = row.count;
      else if (row.status === 'blocked') summary.blocked = row.count;
    });

    return {
      items: rows as AdminScamRecord[],
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      summary,
    };
  } catch (error) {
    logDbError('listAdminScams', error);
    throw new Error('Failed to fetch scams');
  }
}

/**
 * Get scam by ID
 */
export async function getAdminScamById(id: string): Promise<AdminScamRecord | null> {
  const db = getDb();

  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT 
        id,
        type,
        value,
        description,
        report_count as reportCount,
        risk_level as riskLevel,
        status,
        source,
        created_at as createdAt,
        updated_at as updatedAt
      FROM scams 
      WHERE id = ?`,
      [id]
    );

    return (rows[0] as AdminScamRecord) || null;
  } catch (error) {
    logDbError('getAdminScamById', error);
    throw new Error('Failed to fetch scam');
  }
}

/**
 * Create a new scam record
 */
export async function createAdminScam(payload: CreateScamPayload): Promise<AdminScamRecord> {
  const db = getDb();
  const actor = (payload.actor || 'admin@scamguard.vn').slice(0, 120);

  try {
    // Generate unique ID
    const id = await generateUniqueId('SC', 'scams', 'id');
    const now = nowIso();

    // Insert new scam record
    await db.query(
      `INSERT INTO scams (id, type, value, description, report_count, risk_level, status, source, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        payload.type,
        payload.value.trim().slice(0, 200),
        payload.description.trim().slice(0, 2000),
        Math.max(0, Number(payload.reportCount || 0)),
        payload.riskLevel || 'medium',
        payload.status || 'investigating',
        (payload.source || 'admin').slice(0, 60),
        now,
        now,
      ]
    );

    // Get created record
    const created = await getAdminScamById(id);

    if (!created) {
      throw new Error('Failed to retrieve created scam record');
    }

    // Record activity
    await recordAdminActivity({
      action: 'Them scam moi',
      user: actor,
      target: `${id}:${created.value}`,
      status: 'success',
      ip: payload.ip,
    });

    return created;
  } catch (error) {
    logDbError('createAdminScam', error);
    throw new Error('Failed to create scam');
  }
}

/**
 * Update an existing scam record
 */
export async function updateAdminScam(
  id: string,
  payload: UpdateScamPayload
): Promise<AdminScamRecord | null> {
  const db = getDb();
  const actor = (payload.actor || 'admin@scamguard.vn').slice(0, 120);

  try {
    // Check if scam exists
    const existing = await getAdminScamById(id);
    if (!existing) return null;

    // Build dynamic update query
    const updates: string[] = [];
    const params: (string | number)[] = [];

    if (payload.description !== undefined) {
      updates.push('description = ?');
      params.push(payload.description.trim().slice(0, 2000));
    }

    if (payload.riskLevel) {
      updates.push('risk_level = ?');
      params.push(payload.riskLevel);
    }

    if (payload.status) {
      updates.push('status = ?');
      params.push(payload.status);
    }

    if (payload.reportCount !== undefined) {
      updates.push('report_count = ?');
      params.push(Math.max(0, Number(payload.reportCount || 0)));
    }

    if (payload.source !== undefined) {
      updates.push('source = ?');
      params.push(payload.source.trim().slice(0, 60));
    }

    if (updates.length === 0) {
      return existing;
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    await db.query(
      `UPDATE scams SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Get updated record
    const updated = await getAdminScamById(id);

    // Record activity
    if (updated) {
      await recordAdminActivity({
        action: 'Cap nhat scam',
        user: actor,
        target: `${id}:${updated.status}:${updated.riskLevel}`,
        status: updated.status === 'blocked' ? 'warning' : 'success',
        ip: payload.ip,
      });
    }

    return updated;
  } catch (error) {
    logDbError('updateAdminScam', error);
    throw new Error('Failed to update scam');
  }
}

/**
 * Delete a scam record
 */
export async function deleteAdminScam(
  id: string,
  payload: DeleteScamPayload = {}
): Promise<boolean> {
  const db = getDb();
  const actor = (payload.actor || 'admin@scamguard.vn').slice(0, 120);

  try {
    // Check if scam exists
    const existing = await getAdminScamById(id);
    if (!existing) return false;

    // Delete the record
    await db.query('DELETE FROM scams WHERE id = ?', [id]);

    // Record activity
    await recordAdminActivity({
      action: 'Xoa scam',
      user: actor,
      target: `${id}:${existing.value}`,
      status: 'warning',
      ip: payload.ip,
    });

    return true;
  } catch (error) {
    logDbError('deleteAdminScam', error);
    throw new Error('Failed to delete scam');
  }
}

// ============================================
// Admin Activity Logs Queries
// ============================================

/**
 * List admin activity logs with pagination and filtering
 */
export async function listAdminActivityLogs(
  options: ListActivityOptions = {}
): Promise<PagedResult<AdminActivityRecord>> {
  const db = getDb();
  const { page, pageSize } = parsePaging(options);
  const q = normalizeText(options.q || '');
  const statusFilter = options.status || 'all';

  try {
    // Build WHERE clause
    const whereConditions: string[] = [];
    const params: string[] = [];

    if (q) {
      whereConditions.push('(action LIKE ? OR user LIKE ? OR target LIKE ? OR ip LIKE ?)');
      const searchPattern = `%${q}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (statusFilter !== 'all') {
      whereConditions.push('status = ?');
      params.push(statusFilter);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const [countResult] = await db.query<CountRow[]>(
      `SELECT COUNT(*) as count FROM admin_activity_logs ${whereClause}`,
      params
    );
    const total = countResult[0]?.count || 0;

    // Get paginated results ordered by timestamp descending
    const offset = (page - 1) * pageSize;
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT 
        id,
        action,
        user,
        ip,
        target,
        status,
        timestamp
      FROM admin_activity_logs 
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    return {
      items: rows as AdminActivityRecord[],
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  } catch (error) {
    logDbError('listAdminActivityLogs', error);
    throw new Error('Failed to fetch activity logs');
  }
}

/**
 * Record admin activity (creates a new log entry)
 */
export async function recordAdminActivity(payload: {
  action: string;
  user: string;
  target: string;
  status: AdminActivityStatus;
  ip?: string;
}): Promise<AdminActivityRecord> {
  const db = getDb();

  try {
    // Generate unique ID
    const id = await generateUniqueId('LG', 'admin_activity_logs', 'id');
    const now = nowIso();

    // Insert activity log
    await db.query(
      `INSERT INTO admin_activity_logs (id, action, user, ip, target, status, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        payload.action.trim().slice(0, 120),
        payload.user.trim().slice(0, 120),
        (payload.ip || '127.0.0.1').slice(0, 45),
        payload.target.trim().slice(0, 180),
        payload.status,
        now,
      ]
    );

    return {
      id,
      action: payload.action.trim().slice(0, 120),
      user: payload.user.trim().slice(0, 120),
      ip: (payload.ip || '127.0.0.1').slice(0, 45),
      target: payload.target.trim().slice(0, 180),
      status: payload.status,
      timestamp: now,
    };
  } catch (error) {
    logDbError('recordAdminActivity', error);
    // Don't throw - logging should not break main operations
    console.warn('[DB] Failed to record admin activity, continuing...');
    return {
      id: 'LG0000',
      action: payload.action.trim().slice(0, 120),
      user: payload.user.trim().slice(0, 120),
      ip: (payload.ip || '127.0.0.1').slice(0, 45),
      target: payload.target.trim().slice(0, 180),
      status: payload.status,
      timestamp: nowIso(),
    };
  }
}

// ============================================
// Overview Query
// ============================================

/**
 * Get admin management overview with user and scam summaries
 */
export async function getAdminManagementOverview(): Promise<ManagementOverview> {
  try {
    // Get user summary from database
    const [userSummaryRows] = await getDb().query<StatusCountRow[]>(
      `SELECT status, COUNT(*) as count FROM admin_users GROUP BY status`
    );

    const userSummary = { total: 0, active: 0, banned: 0, suspended: 0 };
    userSummaryRows.forEach((row) => {
      userSummary.total += row.count;
      if (row.status === 'active') userSummary.active = row.count;
      else if (row.status === 'banned') userSummary.banned = row.count;
      else if (row.status === 'suspended') userSummary.suspended = row.count;
    });

    // Get scam summary from database
    const [scamSummaryRows] = await getDb().query<StatusCountRow[]>(
      `SELECT status, COUNT(*) as count FROM scams GROUP BY status`
    );

    const scamSummary = { total: 0, active: 0, investigating: 0, blocked: 0 };
    scamSummaryRows.forEach((row) => {
      scamSummary.total += row.count;
      if (row.status === 'active') scamSummary.active = row.count;
      else if (row.status === 'investigating') scamSummary.investigating = row.count;
      else if (row.status === 'blocked') scamSummary.blocked = row.count;
    });

    // Get recent activity logs
    const recentLogsResult = await listAdminActivityLogs({ page: 1, pageSize: 10 });

    return {
      users: userSummary,
      scams: scamSummary,
      recentLogs: recentLogsResult.items,
    };
  } catch (error) {
    logDbError('getAdminManagementOverview', error);
    throw new Error('Failed to fetch management overview');
  }
}

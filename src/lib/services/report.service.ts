/**
 * Report Service
 * Handles report management, approval, and workflow
 * Production-grade implementation for baocaoluadao.com
 */

import { getDb } from '../db';
import { invalidateDashboardCache } from './dashboard.service';
import { recordAdminActivity } from '../adminManagementStore';
import { RowDataPacket } from 'mysql2/promise';

export type ReportType = 'website' | 'phone' | 'email' | 'social' | 'sms' | 'bank';
export type ReportStatus = 'pending' | 'processing' | 'verified' | 'rejected' | 'completed';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface Report {
  id: string;
  type: ReportType;
  target: string;
  description: string;
  reporter_name: string | null;
  reporter_email: string | null;
  source: string;
  status: ReportStatus;
  ip: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportListOptions {
  page?: number;
  pageSize?: number;
  status?: ReportStatus;
  type?: ReportType;
  search?: string;
}

export interface ReportListResult {
  items: Report[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: {
    pending: number;
    processing: number;
    verified: number;
    rejected: number;
    completed: number;
  };
}

export interface ApproveReportPayload {
  reportId: string;
  riskLevel?: RiskLevel;
  adminNotes?: string;
  actor: string;
  ip?: string;
}

export interface RejectReportPayload {
  reportId: string;
  reason?: string;
  actor: string;
  ip?: string;
}

interface StatusCountRow extends RowDataPacket {
  status: string;
  count: number;
}

/**
 * Parse paging parameters
 */
function parsePaging(input: { page?: number; pageSize?: number }): { page: number; pageSize: number } {
  const page = Math.max(1, Number(input.page || 1));
  const pageSize = Math.max(1, Math.min(100, Number(input.pageSize || 10)));
  return { page, pageSize };
}

/**
 * Generate unique ID for new records
 */
async function generateUniqueId(prefix: string, table: string, column: string): Promise<string> {
  const db = getDb();
  const [rows] = await db.query<(RowDataPacket & { id: string })[]>(
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

/**
 * Get report by ID
 */
export async function getReportById(id: string): Promise<Report | null> {
  const db = getDb();

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT id, type, target, description, reporter_name, reporter_email, source, status, ip, created_at, updated_at 
     FROM reports WHERE id = ?`,
    [id]
  );

  if (rows.length === 0) return null;

  const row = rows[0] as Report;
  return row;
}

/**
 * List reports with pagination
 */
export async function listReports(options: ReportListOptions = {}): Promise<ReportListResult> {
  const db = getDb();
  const { page, pageSize } = parsePaging(options);
  const statusFilter = options.status || 'all';
  const typeFilter = options.type || 'all';
  const searchQuery = options.search || '';

  try {
    // Build WHERE clause
    const whereConditions: string[] = [];
    const params: (string | number)[] = [];

    if (statusFilter !== 'all') {
      whereConditions.push('status = ?');
      params.push(statusFilter);
    }

    if (typeFilter !== 'all') {
      whereConditions.push('type = ?');
      params.push(typeFilter);
    }

    if (searchQuery) {
      whereConditions.push('(target LIKE ? OR description LIKE ?)');
      const searchPattern = `%${searchQuery}%`;
      params.push(searchPattern, searchPattern);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const [countResult] = await db.query<(RowDataPacket & { count: number })[]>(
      `SELECT COUNT(*) as count FROM reports ${whereClause}`,
      params
    );
    const total = countResult[0]?.count || 0;

    // Get paginated results
    const offset = (page - 1) * pageSize;
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT id, type, target, description, reporter_name, reporter_email, source, status, ip, created_at, updated_at 
       FROM reports ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    // Get summary counts
    const [summaryRows] = await db.query<StatusCountRow[]>(
      `SELECT status, COUNT(*) as count FROM reports GROUP BY status`
    );

    const summary = {
      pending: 0,
      processing: 0,
      verified: 0,
      rejected: 0,
      completed: 0,
    };

    summaryRows.forEach((row) => {
      const status = row.status as keyof typeof summary;
      if (status in summary) {
        summary[status] = row.count;
      }
    });

    return {
      items: rows as Report[],
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      summary,
    };
  } catch (error) {
    console.error('[Report Service] listReports error:', error);
    throw new Error('Failed to fetch reports');
  }
}

/**
 * Approve report - move to scams table
 */
export async function approveReport(payload: ApproveReportPayload): Promise<{ success: boolean; scamId?: string; error?: string }> {
  const db = getDb();
  const { reportId, riskLevel = 'medium', adminNotes, actor, ip } = payload;
  let scamId = '';

  try {
    // Get the report first
    const report = await getReportById(reportId);
    if (!report) {
      return { success: false, error: 'Report not found' };
    }

    if (report.status === 'verified') {
      return { success: false, error: 'Report already verified' };
    }

    if (report.status === 'rejected') {
      return { success: false, error: 'Report was rejected' };
    }

    // Start transaction
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Generate scam ID
      scamId = await generateUniqueId('SCM', 'scams', 'id');

      // Insert into scams table
      await connection.execute(
        `INSERT INTO scams (id, type, value, description, risk_level, status, source, report_count, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'active', ?, 1, NOW(), NOW())`,
        [
          scamId,
          report.type,
          report.target,
          report.description,
          riskLevel,
          `report:${reportId}`,
        ]
      );

      // Update report status to verified
      await connection.execute(
        `UPDATE reports SET status = 'verified', updated_at = NOW() WHERE id = ?`,
        [reportId]
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    // Invalidate dashboard cache
    await invalidateDashboardCache();

    // Record admin activity
    await recordAdminActivity({
      action: 'Duyệt báo cáo thành scam',
      user: actor,
      target: `${reportId} -> ${scamId}`,
      status: 'success',
      ip: ip,
    });

    return { success: true, scamId };
  } catch (error) {
    console.error('[Report Service] approveReport error:', error);

    // Record failed activity
    await recordAdminActivity({
      action: 'Duyệt báo cáo thất bại',
      user: actor,
      target: reportId,
      status: 'failed',
      ip: ip,
    });

    return { success: false, error: 'Failed to approve report' };
  }
}

/**
 * Reject report
 */
export async function rejectReport(payload: RejectReportPayload): Promise<{ success: boolean; error?: string }> {
  const db = getDb();
  const { reportId, reason, actor, ip } = payload;

  try {
    // Get the report first
    const report = await getReportById(reportId);
    if (!report) {
      return { success: false, error: 'Report not found' };
    }

    if (report.status === 'rejected') {
      return { success: false, error: 'Report already rejected' };
    }

    if (report.status === 'verified') {
      return { success: false, error: 'Report was already verified' };
    }

    // Update report status
    await db.execute(
      `UPDATE reports SET status = 'rejected', updated_at = NOW() WHERE id = ?`,
      [reportId]
    );

    // Invalidate dashboard cache (pending count will change)
    await invalidateDashboardCache();

    // Record admin activity
    await recordAdminActivity({
      action: 'Từ chối báo cáo',
      user: actor,
      target: reportId,
      status: 'success',
      ip: ip,
    });

    return { success: true };
  } catch (error) {
    console.error('[Report Service] rejectReport error:', error);

    return { success: false, error: 'Failed to reject report' };
  }
}

/**
 * Update report status
 */
export async function updateReportStatus(
  reportId: string,
  status: ReportStatus,
  actor: string,
  ip?: string
): Promise<{ success: boolean; error?: string }> {
  const db = getDb();

  try {
    await db.execute(
      `UPDATE reports SET status = ?, updated_at = NOW() WHERE id = ?`,
      [status, reportId]
    );

    // Invalidate cache if status changed to/from pending
    if (status === 'verified' || status === 'rejected') {
      await invalidateDashboardCache();
    }

    // Record activity
    await recordAdminActivity({
      action: `Cập nhật trạng thái báo cáo: ${status}`,
      user: actor,
      target: reportId,
      status: 'success',
      ip: ip,
    });

    return { success: true };
  } catch (error) {
    console.error('[Report Service] updateReportStatus error:', error);
    return { success: false, error: 'Failed to update report status' };
  }
}
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getDb } from '@/lib/db';

export type ReportType = 'website' | 'phone' | 'email' | 'social' | 'sms';
export type ReportSource = 'community' | 'auto_scan' | 'manual';

interface SubmittedReport {
  id: string;
  type: ReportType;
  target: string;
  description: string;
  reporterEmail?: string;
  reporterName?: string;
  source: ReportSource;
  status: 'pending' | 'processing' | 'completed';
  createdAt: string;
  ip?: string;
}

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REPORTS_PER_IP = 5;

function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfIP = request.headers.get('cf-connecting-ip');

  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  if (realIP) return realIP.trim();
  if (cfIP) return cfIP.trim();
  return 'unknown';
}

async function checkRateLimit(ip: string, db: any): Promise<boolean> {
  if (ip === 'unknown') return true;
  
  const now = Date.now();
  
  try {
    // Check existing rate limit record
    const [rows] = await db.execute(
      'SELECT * FROM rate_limits WHERE ip = ? AND reset_time > NOW()',
      [ip]
    );
    
    const records = rows as any[];
    if (records.length > 0) {
      const record = records[0];
      if (record.count >= MAX_REPORTS_PER_IP) {
        return false;
      }
      // Increment count
      await db.execute(
        'UPDATE rate_limits SET count = count + 1 WHERE ip = ?',
        [ip]
      );
      return true;
    }
    
    // Create new record
    await db.execute(
      'INSERT INTO rate_limits (ip, count, first_attempt, reset_time) VALUES (?, 1, NOW(), DATE_ADD(NOW(), INTERVAL 1 MINUTE))',
      [ip]
    );
    return true;
  } catch {
    // If DB fails, allow the request (fail open)
    return true;
  }
}

function sanitizeInput(input: string | undefined, maxLength: number): string {
  if (!input) return '';
  return input.trim().slice(0, maxLength);
}

function validateReportType(type: string): type is ReportType {
  return ['website', 'phone', 'email', 'social', 'sms'].includes(type);
}

function validateTarget(type: ReportType, target: string): boolean {
  if (!target || target.length < 3 || target.length > 500) return false;
  
  switch (type) {
    case 'website':
      return /^(https?:\/\/)?([\w.-]+\.)+[\w.-]+(\/[\w.-]*)*\/?$/i.test(target);
    case 'phone':
      return /^[\d\s+().-]{7,20}$/.test(target);
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target);
    case 'social':
      return target.length > 5;
    case 'sms':
      return target.length > 3;
    default:
      return true;
  }
}

/**
 * Validate email format
 */
function validateEmail(email: string | null | undefined): boolean {
  if (!email) return true; // Email is optional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  const db = getDb();
  
  try {
    // Rate limiting
    const ip = getClientIP(request);
    if (!await checkRateLimit(ip, db)) {
      return NextResponse.json(
        { success: false, error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' },
        { status: 429 }
      );
    }

    // Parse body
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Dữ liệu JSON không hợp lệ' },
        { status: 400 }
      );
    }

    // Validate required fields
    const type = sanitizeInput(typeof body.type === 'string' ? body.type : '', 20);
    const target = sanitizeInput(typeof body.target === 'string' ? body.target : '', 500);
    const description = sanitizeInput(typeof body.description === 'string' ? body.description : '', 2000);
    const reporterEmail = sanitizeInput(typeof body.email === 'string' ? body.email : '', 120);

    if (!type || !target || !description) {
      return NextResponse.json(
        { success: false, error: 'Thiếu thông tin bắt buộc: type, target, description' },
        { status: 400 }
      );
    }

    if (!validateReportType(type)) {
      return NextResponse.json(
        { success: false, error: 'Loại báo cáo không hợp lệ' },
        { status: 400 }
      );
    }

    if (!validateTarget(type, target)) {
      return NextResponse.json(
        { success: false, error: 'Định dạng mục tiêu không hợp lệ' },
        { status: 400 }
      );
    }

    if (!validateEmail(reporterEmail)) {
      return NextResponse.json(
        { success: false, error: 'Định dạng email không hợp lệ' },
        { status: 400 }
      );
    }

    // Create report
    const reportId = `RPT${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const createdAt = new Date().toISOString();

    // Insert into database
    await db.execute(
      `INSERT INTO reports (id, type, target, description, reporter_name, reporter_email, source, status, ip, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [
        reportId,
        type,
        target,
        description,
        sanitizeInput(typeof body.name === 'string' ? body.name : '', 80) || null,
        reporterEmail || null,
        'community',
        ip !== 'unknown' ? ip : null,
        createdAt
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Báo cáo của bạn đã được ghi nhận. Cảm ơn đã đóng góp!',
      reportId,
    });
  } catch (error) {
    console.error('Report submission error:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi server. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const status = searchParams.get('status');
  const type = searchParams.get('type');
  const offset = (page - 1) * limit;

  try {
    // Build query
    let whereClause = '';
    const params: any[] = [];
    
    if (status && status !== 'all') {
      whereClause += ' WHERE status = ?';
      params.push(status);
    }
    
    if (type && type !== 'all') {
      whereClause += whereClause ? ' AND type = ?' : ' WHERE type = ?';
      params.push(type);
    }
    
    // Get total count
    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM reports${whereClause}`,
      params
    );
    const total = (countResult as any[])[0]?.total || 0;
    
    // Get reports
    const [rows] = await db.execute(
      `SELECT * FROM reports${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    
    return NextResponse.json({
      success: true,
      items: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}
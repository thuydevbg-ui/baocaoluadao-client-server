import { NextRequest, NextResponse } from 'next/server';
import {
  AdminReportStatus,
  AdminReportType,
  createAdminReport,
  listAdminReports,
} from '@/lib/adminDataStore';
import { recordAdminActivity } from '@/lib/adminManagementStore';
import { getAdminAuth } from '@/lib/adminApiAuth';

function parseStatus(value: string | null): 'all' | AdminReportStatus {
  if (!value) return 'all';
  if (value === 'pending' || value === 'verified' || value === 'rejected') return value;
  return 'all';
}

function parseType(value: string | null): 'all' | AdminReportType {
  if (!value) return 'all';
  if (value === 'website' || value === 'phone' || value === 'email' || value === 'social' || value === 'sms') {
    return value;
  }
  return 'all';
}

// Validation helpers
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_REGEX = /^https?:\/\/[\w.-]+\.[a-zA-Z]{2,}(\/.*)?$/;
const PHONE_REGEX = /^(\+84|0)[3-9]\d{8}$/;

function validateReportInput(body: {
  title?: string;
  description?: string;
  reporterEmail?: string;
  targetValue?: string;
  type?: string;
}): { valid: boolean; error?: string } {
  const { title, description, reporterEmail, targetValue, type } = body;

  
  // Validate title length
  if (!title || title.length < 3 || title.length > 200) {
    return { valid: false, error: 'Title must be between 3 and 200 characters' };
  }
  
  // Validate description length
  if (!description || description.length < 10 || description.length > 5000) {
    return { valid: false, error: 'Description must be between 10 and 5000 characters' };
  }
  
  // Validate email format
  if (!reporterEmail || !EMAIL_REGEX.test(reporterEmail)) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  // Validate targetValue based on type
  if (!targetValue || targetValue.length > 500) {
    return { valid: false, error: 'Target value must be between 1 and 500 characters' };
  }
  
  if (type === 'website') {
    // Allow both URLs and domain names for website type
    const domainOrUrl = targetValue.toLowerCase();
    const isValidDomain = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(domainOrUrl);
    if (!URL_REGEX.test(targetValue) && !isValidDomain) {
      return { valid: false, error: 'Invalid website URL or domain' };
    }
  } else if (type === 'phone') {
    // Normalize phone number for validation
    const normalizedPhone = targetValue.replace(/[\s.-]/g, '');
    if (!PHONE_REGEX.test(normalizedPhone) && !/^\d{9,11}$/.test(normalizedPhone)) {
      return { valid: false, error: 'Invalid phone number format' };
    }
  }
  
  return { valid: true };
}

export async function GET(request: NextRequest) {
  const auth = getAdminAuth(request);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const status = parseStatus(searchParams.get('status'));
  const type = parseType(searchParams.get('type'));
  const page = Number.parseInt(searchParams.get('page') || '1', 10);
  const pageSize = Number.parseInt(searchParams.get('pageSize') || '10', 10);

  const data = listAdminReports({
    q,
    status,
    type,
    page: Number.isFinite(page) ? page : 1,
    pageSize: Number.isFinite(pageSize) ? pageSize : 10,
  });

  return NextResponse.json({
    success: true,
    ...data,
  });
}

export async function POST(request: NextRequest) {
  const auth = getAdminAuth(request);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    title?: string;
    type?: AdminReportType;
    riskLevel?: 'low' | 'medium' | 'high';
    description?: string;
    reporterName?: string;
    reporterEmail?: string;
    targetValue?: string;
    source?: string;
  } = {};

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
  }

  const title = (body.title || '').trim();
  const description = (body.description || '').trim();
  const reporterName = (body.reporterName || '').trim();
  const reporterEmail = (body.reporterEmail || '').trim();
  const targetValue = (body.targetValue || '').trim();
  const type = body.type;

  // Validate type separately as it needs to be a valid AdminReportType
  if (!type || !['website', 'phone', 'email', 'social', 'sms'].includes(type)) {
    return NextResponse.json({ success: false, error: 'Invalid or missing type' }, { status: 400 });
  }

  // Use enhanced validation for other fields
  const validation = validateReportInput({
    title,
    description,
    reporterEmail,
    targetValue,
    type: type as AdminReportType,
  });
  if (!validation.valid) {
    return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
  }

  const created = createAdminReport({
    title,
    type,
    riskLevel: body.riskLevel,
    description,
    reporterName,
    reporterEmail,
    targetValue,
    source: body.source || `admin:${auth.email}`,
  });
  recordAdminActivity({
    action: 'Tao bao cao',
    user: auth.email,
    target: created.id,
    status: 'success',
    ip: request.headers.get('x-forwarded-for') || undefined,
  });

  return NextResponse.json({
    success: true,
    item: created,
  });
}

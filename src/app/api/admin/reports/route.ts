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

  if (!title || !description || !reporterName || !reporterEmail || !targetValue || !type) {
    return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
  }

  if (!['website', 'phone', 'email', 'social', 'sms'].includes(type)) {
    return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
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

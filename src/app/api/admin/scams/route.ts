import { withApiObservability } from '@/lib/apiHandler';
import { NextRequest, NextResponse } from 'next/server';
import {
  type AdminScamRiskLevel,
  type AdminScamStatus,
  type AdminScamType,
  createAdminScam,
  listAdminScams,
} from '@/lib/adminManagementStore';
import { getAdminAuth } from '@/lib/adminApiAuth';

function parseType(value: string | null): 'all' | AdminScamType {
  if (!value) return 'all';
  if (value === 'website' || value === 'phone' || value === 'email' || value === 'bank') {
    return value;
  }
  return 'all';
}

function parseStatus(value: string | null): 'all' | AdminScamStatus {
  if (!value) return 'all';
  if (value === 'active' || value === 'investigating' || value === 'blocked') {
    return value;
  }
  return 'all';
}

function parseRiskLevel(value: string | null): 'all' | AdminScamRiskLevel {
  if (!value) return 'all';
  if (value === 'low' || value === 'medium' || value === 'high') {
    return value;
  }
  return 'all';
}

export const GET = withApiObservability(async (request: NextRequest) => {
  const auth = getAdminAuth(request);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const type = parseType(searchParams.get('type'));
  const status = parseStatus(searchParams.get('status'));
  const riskLevel = parseRiskLevel(searchParams.get('riskLevel'));
  const page = Number.parseInt(searchParams.get('page') || '1', 10);
  const pageSize = Number.parseInt(searchParams.get('pageSize') || '10', 10);

  const data = listAdminScams({
    q,
    type,
    status,
    riskLevel,
    page: Number.isFinite(page) ? page : 1,
    pageSize: Number.isFinite(pageSize) ? pageSize : 10,
  });

  return NextResponse.json({
    success: true,
    ...data,
  });
});

export const POST = withApiObservability(async (request: NextRequest) => {
  const auth = getAdminAuth(request);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    type?: AdminScamType;
    value?: string;
    description?: string;
    riskLevel?: AdminScamRiskLevel;
    status?: AdminScamStatus;
    source?: string;
    reportCount?: number;
  } = {};

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
  }

  const value = (body.value || '').trim();
  const description = (body.description || '').trim();
  const type = body.type;

  if (!value || !description || !type) {
    return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
  }

  if (!['website', 'phone', 'email', 'bank'].includes(type)) {
    return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
  }

  if (body.riskLevel && !['low', 'medium', 'high'].includes(body.riskLevel)) {
    return NextResponse.json({ success: false, error: 'Invalid riskLevel' }, { status: 400 });
  }

  if (body.status && !['active', 'investigating', 'blocked'].includes(body.status)) {
    return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
  }

  const created = createAdminScam({
    type,
    value,
    description,
    riskLevel: body.riskLevel,
    status: body.status,
    source: body.source || `admin:${auth.email}`,
    reportCount: body.reportCount,
    actor: auth.email,
    ip: request.headers.get('x-forwarded-for') || undefined,
  });

  return NextResponse.json({
    success: true,
    item: created,
  });
});


import { NextRequest, NextResponse } from 'next/server';
import {
  type AdminScamRiskLevel,
  type AdminScamStatus,
  deleteAdminScam,
  getAdminScamById,
  updateAdminScam,
} from '@/lib/adminManagementStore';
import { getAdminAuth } from '@/lib/adminApiAuth';

function extractIdFromRequest(request: NextRequest): string {
  const segments = request.nextUrl.pathname.split('/').filter(Boolean);
  return segments.at(-1) ?? '';
}

function parseStatus(input: unknown): AdminScamStatus | null {
  if (input === 'active' || input === 'investigating' || input === 'blocked') {
    return input;
  }
  return null;
}

function parseRiskLevel(input: unknown): AdminScamRiskLevel | null {
  if (input === 'low' || input === 'medium' || input === 'high') {
    return input;
  }
  return null;
}

export async function GET(request: NextRequest) {
  const auth = getAdminAuth(request);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const id = extractIdFromRequest(request).trim();
  if (!id) {
    return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
  }

  const item = getAdminScamById(id);
  if (!item) {
    return NextResponse.json({ success: false, error: 'Scam not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, item });
}

export async function PATCH(request: NextRequest) {
  const auth = getAdminAuth(request);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const id = extractIdFromRequest(request).trim();
  if (!id) {
    return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
  }

  let body: {
    description?: string;
    riskLevel?: AdminScamRiskLevel;
    status?: AdminScamStatus;
    reportCount?: number;
    source?: string;
  } = {};

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
  }

  const parsedStatus = body.status !== undefined ? parseStatus(body.status) : undefined;
  if (body.status !== undefined && !parsedStatus) {
    return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
  }
  const finalStatus: AdminScamStatus | undefined = parsedStatus || undefined;
  const parsedRiskLevel = body.riskLevel !== undefined ? parseRiskLevel(body.riskLevel) : undefined;
  if (body.riskLevel !== undefined && !parsedRiskLevel) {
    return NextResponse.json({ success: false, error: 'Invalid riskLevel' }, { status: 400 });
  }
  const finalRiskLevel: AdminScamRiskLevel | undefined = parsedRiskLevel || undefined;

  if (body.description !== undefined && typeof body.description !== 'string') {
    return NextResponse.json({ success: false, error: 'description must be a string' }, { status: 400 });
  }

  if (body.source !== undefined && typeof body.source !== 'string') {
    return NextResponse.json({ success: false, error: 'source must be a string' }, { status: 400 });
  }

  if (body.reportCount !== undefined && typeof body.reportCount !== 'number') {
    return NextResponse.json({ success: false, error: 'reportCount must be a number' }, { status: 400 });
  }

  const updated = updateAdminScam(id, {
    description: body.description,
    riskLevel: finalRiskLevel,
    status: finalStatus,
    reportCount: body.reportCount,
    source: body.source,
    actor: auth.email,
    ip: request.headers.get('x-forwarded-for') || undefined,
  });

  if (!updated) {
    return NextResponse.json({ success: false, error: 'Scam not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, item: updated });
}

export async function DELETE(request: NextRequest) {
  const auth = getAdminAuth(request);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const id = extractIdFromRequest(request).trim();
  if (!id) {
    return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
  }

  const deleted = deleteAdminScam(id, {
    actor: auth.email,
    ip: request.headers.get('x-forwarded-for') || undefined,
  });

  if (!deleted) {
    return NextResponse.json({ success: false, error: 'Scam not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

import { withApiObservability } from '@/lib/apiHandler';
import { NextRequest, NextResponse } from 'next/server';
import {
  AdminReportStatus,
  getAdminReportById,
  updateAdminReport,
} from '@/lib/adminDataStore';
import { recordAdminActivity } from '@/lib/adminManagementStore';
import { getAdminAuth } from '@/lib/adminApiAuth';

function extractIdFromRequest(request: NextRequest): string {
  const segments = request.nextUrl.pathname.split('/').filter(Boolean);
  return segments.at(-1) ?? '';
}

function parseStatus(input: unknown): AdminReportStatus | null {
  if (input === 'pending' || input === 'verified' || input === 'rejected') {
    return input;
  }
  return null;
}

export const GET = withApiObservability(async (request: NextRequest) => {
  const auth = getAdminAuth(request);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const id = extractIdFromRequest(request).trim();
  if (!id) {
    return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
  }

  const item = getAdminReportById(id);
  if (!item) {
    return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    item,
  });
});

export const PATCH = withApiObservability(async (request: NextRequest) => {
  const auth = getAdminAuth(request);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const id = extractIdFromRequest(request).trim();
  if (!id) {
    return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
  }

  let body: {
    status?: AdminReportStatus;
    adminNotes?: string;
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
  const nextStatus: AdminReportStatus | undefined = parsedStatus || undefined;

  if (body.adminNotes !== undefined && typeof body.adminNotes !== 'string') {
    return NextResponse.json({ success: false, error: 'adminNotes must be a string' }, { status: 400 });
  }

  if (nextStatus === undefined && body.adminNotes === undefined) {
    return NextResponse.json({ success: false, error: 'Nothing to update' }, { status: 400 });
  }

  const updated = updateAdminReport(id, {
    status: nextStatus,
    adminNotes: body.adminNotes,
    actor: auth.email,
  });

  if (!updated) {
    return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 });
  }
  recordAdminActivity({
    action: nextStatus ? 'Cap nhat trang thai bao cao' : 'Cap nhat ghi chu bao cao',
    user: auth.email,
    target: id,
    status: 'success',
    ip: request.headers.get('x-forwarded-for') || undefined,
  });

  return NextResponse.json({
    success: true,
    item: updated,
  });
});

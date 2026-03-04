import { withApiObservability } from '@/lib/apiHandler';
import { NextRequest, NextResponse } from 'next/server';
import {
  getReportById,
  updateReportAdminFields,
  type Report,
  type ReportStatus,
} from '@/lib/services/report.service';
import { getAdminAuthValidated } from '@/lib/adminApiAuth';

function extractIdFromRequest(request: NextRequest): string {
  const segments = request.nextUrl.pathname.split('/').filter(Boolean);
  return segments.at(-1) ?? '';
}

function parseStatus(input: unknown): ReportStatus | null {
  if (
    input === 'pending' ||
    input === 'processing' ||
    input === 'verified' ||
    input === 'rejected' ||
    input === 'completed'
  ) {
    return input;
  }
  return null;
}

function mapReportItem(report: Report) {
  const reporterEmail = report.reporter_email ?? '';
  const reporterName = report.reporter_name ?? (reporterEmail ? reporterEmail.split('@')[0] : 'Ẩn danh');
  return {
    id: report.id,
    title: `${report.type.toUpperCase()} - ${report.target}`,
    type: report.type,
    status: report.status,
    riskLevel: report.status === 'verified' || report.status === 'completed' ? 'low' : 'medium',
    description: report.description,
    createdAt: report.created_at,
    updatedAt: report.updated_at,
    reporter: {
      id: reporterEmail || `reporter:${report.id}`,
      name: reporterName,
      email: reporterEmail || 'anonymous@local',
    },
    target: {
      type: report.type,
      value: report.target,
      ip: report.ip || undefined,
    },
    source: report.source,
    adminNotes: report.admin_notes || '',
    history: [],
  };
}

export const GET = withApiObservability(async (request: NextRequest) => {
  const auth = await getAdminAuthValidated(request);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const id = extractIdFromRequest(request).trim();
  if (!id) {
    return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
  }

  const item = await getReportById(id);
  if (!item) {
    return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    item: mapReportItem(item),
  });
});

export const PATCH = withApiObservability(async (request: NextRequest) => {
  const auth = await getAdminAuthValidated(request);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const id = extractIdFromRequest(request).trim();
  if (!id) {
    return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
  }

  let body: {
    status?: ReportStatus;
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
  const nextStatus: ReportStatus | undefined = parsedStatus || undefined;

  if (body.adminNotes !== undefined && typeof body.adminNotes !== 'string') {
    return NextResponse.json({ success: false, error: 'adminNotes must be a string' }, { status: 400 });
  }

  if (nextStatus === undefined && body.adminNotes === undefined) {
    return NextResponse.json({ success: false, error: 'Nothing to update' }, { status: 400 });
  }

  const updated = await updateReportAdminFields({
    reportId: id,
    status: nextStatus,
    adminNotes: body.adminNotes,
    actor: auth.email,
    ip: request.headers.get('x-forwarded-for') || undefined,
  });

  if (!updated.success || !updated.item) {
    return NextResponse.json({ success: false, error: updated.error || 'Report not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    item: mapReportItem(updated.item),
  });
});

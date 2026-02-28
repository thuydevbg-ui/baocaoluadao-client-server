import { withApiObservability } from '@/lib/apiHandler';
import { NextRequest, NextResponse } from 'next/server';
import {
  listReports,
  getReportById,
  approveReport,
  rejectReport,
  type ReportType,
} from '@/lib/services/report.service';
import { recordAdminActivity } from '@/lib/adminManagementStore';
import { getAdminAuth } from '@/lib/adminApiAuth';
import { ReportTypeSchema, ReportStatusSchema } from '@/lib/validators';

/**
 * Parse status query param
 */
function parseStatus(value: string | null): 'all' | 'pending' | 'processing' | 'verified' | 'rejected' | 'completed' {
  if (!value) return 'all';
  const validStatuses = ['pending', 'processing', 'verified', 'rejected', 'completed'];
  if (validStatuses.includes(value)) return value as 'pending' | 'processing' | 'verified' | 'rejected' | 'completed';
  return 'all';
}

/**
 * Parse type query param
 */
function parseType(value: string | null): 'all' | ReportType {
  if (!value) return 'all';
  const validTypes = ['website', 'phone', 'email', 'social', 'sms', 'bank'];
  if (validTypes.includes(value)) return value as ReportType;
  return 'all';
}

/**
 * GET /api/admin/reports
 * List all reports with pagination
 */
export const GET = withApiObservability(async (request: NextRequest) => {
  const auth = getAdminAuth(request);
  if (!auth) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Unauthorized access',
        },
      },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const status = parseStatus(searchParams.get('status'));
  const type = parseType(searchParams.get('type'));
  const page = Number.parseInt(searchParams.get('page') || '1', 10);
  const pageSize = Number.parseInt(searchParams.get('pageSize') || '10', 10);

  try {
    const data = await listReports({
      search: q,
      status: status === 'all' ? undefined : status,
      type: type === 'all' ? undefined : type,
      page: Number.isFinite(page) ? page : 1,
      pageSize: Number.isFinite(pageSize) ? pageSize : 10,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[Admin Reports] GET error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'LIST_ERROR',
          message: 'Failed to fetch reports',
        },
      },
      { status: 500 }
    );
  }
});

/**
 * POST /api/admin/reports
 * Create a new report manually or approve/reject existing
 */
export const POST = withApiObservability(async (request: NextRequest) => {
  const auth = getAdminAuth(request);
  if (!auth) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Unauthorized access',
        },
      },
      { status: 401 }
    );
  }

  let body: {
    action?: 'approve' | 'reject' | 'create';
    reportId?: string;
    type?: string;
    riskLevel?: 'low' | 'medium' | 'high';
    target?: string;
    description?: string;
    reason?: string;
  } = {};

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_JSON',
          message: 'Invalid JSON payload',
        },
      },
      { status: 400 }
    );
  }

  const { action, reportId, riskLevel, reason } = body;
  const ip = request.headers.get('x-forwarded-for') || undefined;

  // Handle approve/reject actions
  if (action === 'approve' && reportId) {
    if (!riskLevel || !['low', 'medium', 'high'].includes(riskLevel)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_RISK_LEVEL',
            message: 'Invalid risk level',
          },
        },
        { status: 400 }
      );
    }

    const result = await approveReport({
      reportId,
      riskLevel,
      actor: auth.email,
      ip,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'APPROVE_ERROR',
            message: result.error || 'Failed to approve report',
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        reportId,
        scamId: result.scamId,
        message: 'Report approved successfully',
      },
    });
  }

  if (action === 'reject' && reportId) {
    const result = await rejectReport({
      reportId,
      reason,
      actor: auth.email,
      ip,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'REJECT_ERROR',
            message: result.error || 'Failed to reject report',
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        reportId,
        message: 'Report rejected successfully',
      },
    });
  }

  // If no action, return error
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INVALID_ACTION',
        message: 'Invalid or missing action. Use: approve, reject',
      },
    },
    { status: 400 }
  );
});

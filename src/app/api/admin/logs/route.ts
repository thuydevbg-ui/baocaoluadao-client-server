import { withApiObservability } from '@/lib/apiHandler';
import { NextRequest, NextResponse } from 'next/server';
import {
  type AdminActivityStatus,
  listAdminActivityLogs,
} from '@/lib/adminManagementStore';
import { getAdminAuth } from '@/lib/adminApiAuth';

function parseStatus(value: string | null): 'all' | AdminActivityStatus {
  if (!value) return 'all';
  if (value === 'success' || value === 'failed' || value === 'warning') {
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
  const status = parseStatus(searchParams.get('status'));
  const page = Number.parseInt(searchParams.get('page') || '1', 10);
  const pageSize = Number.parseInt(searchParams.get('pageSize') || '20', 10);

  const data = listAdminActivityLogs({
    q,
    status,
    page: Number.isFinite(page) ? page : 1,
    pageSize: Number.isFinite(pageSize) ? pageSize : 20,
  });

  return NextResponse.json({
    success: true,
    ...data,
  });
});


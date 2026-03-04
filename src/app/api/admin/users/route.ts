import { withApiObservability } from '@/lib/apiHandler';
import { NextRequest, NextResponse } from 'next/server';
import { type AdminUserRole, type AdminUserStatus } from '@/lib/adminManagementStore';
import { getAdminAuthValidated, requireRole } from '@/lib/adminApiAuth';
import { listAdminUsers } from '@/lib/dbQueries';

function parseRole(value: string | null): 'all' | AdminUserRole {
  if (!value) return 'all';
  if (value === 'super_admin' || value === 'admin' || value === 'moderator') {
    return value;
  }
  return 'all';
}

function parseStatus(value: string | null): 'all' | AdminUserStatus {
  if (!value) return 'all';
  if (value === 'active' || value === 'banned' || value === 'suspended') {
    return value;
  }
  return 'all';
}

export const GET = withApiObservability(async (request: NextRequest) => {
  const auth = await getAdminAuthValidated(request);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!requireRole(auth, ['admin', 'super_admin'])) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || searchParams.get('search') || '').trim();
  const role = parseRole(searchParams.get('role'));
  const status = parseStatus(searchParams.get('status'));
  const page = Number.parseInt(searchParams.get('page') || '1', 10);
  const pageSize = Number.parseInt(searchParams.get('pageSize') || '10', 10);

  try {
    const data = await listAdminUsers({
      q,
      role,
      status,
      page: Number.isFinite(page) ? page : 1,
      pageSize: Number.isFinite(pageSize) ? pageSize : 10,
    });

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error) {
    console.error('[Admin Users] GET error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
});

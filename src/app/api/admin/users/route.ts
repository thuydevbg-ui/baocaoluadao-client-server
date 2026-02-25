import { NextRequest, NextResponse } from 'next/server';
import {
  type AdminUserRole,
  type AdminUserStatus,
  listAdminUsers,
} from '@/lib/adminManagementStore';
import { getAdminAuth, requireRole } from '@/lib/adminApiAuth';

function parseRole(value: string | null): 'all' | AdminUserRole {
  if (!value) return 'all';
  if (value === 'super_admin' || value === 'admin' || value === 'moderator' || value === 'user') {
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

export async function GET(request: NextRequest) {
  const auth = getAdminAuth(request);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // View users list - requires at least moderator role
  if (!requireRole(auth, ['super_admin', 'admin', 'moderator'])) {
    return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const role = parseRole(searchParams.get('role'));
  const status = parseStatus(searchParams.get('status'));
  const page = Number.parseInt(searchParams.get('page') || '1', 10);
  const pageSize = Number.parseInt(searchParams.get('pageSize') || '10', 10);

  const data = listAdminUsers({
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
}


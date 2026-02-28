import { NextRequest, NextResponse } from 'next/server';
import {
  type AdminUserRole,
  type AdminUserStatus,
  getAdminUserById,
  updateAdminUser,
} from '@/lib/adminManagementStore';
import { getAdminAuth, requireRole, type AdminRole } from '@/lib/adminApiAuth';

function extractIdFromRequest(request: NextRequest): string {
  const segments = request.nextUrl.pathname.split('/').filter(Boolean);
  return segments.at(-1) ?? '';
}

function parseStatus(input: unknown): AdminUserStatus | null {
  if (input === 'active' || input === 'banned' || input === 'suspended') {
    return input;
  }
  return null;
}

function parseRole(input: unknown): AdminUserRole | null {
  if (input === 'super_admin' || input === 'admin' || input === 'moderator' || input === 'user') {
    return input;
  }
  return null;
}

export async function GET(request: NextRequest) {
  const auth = getAdminAuth(request);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  // View user info - requires at least moderator role
  if (!requireRole(auth, ['super_admin', 'admin', 'moderator'])) {
    return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions' }, { status: 403 });
  }

  const id = extractIdFromRequest(request).trim();
  if (!id) {
    return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
  }

  const item = getAdminUserById(id);
  if (!item) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
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
    status?: AdminUserStatus;
    role?: AdminUserRole;
  } = {};

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
  }

  // Role change requires super_admin
  if (body.role !== undefined) {
    if (!requireRole(auth, ['super_admin'])) {
      return NextResponse.json({ success: false, error: 'Forbidden: Only super_admin can change roles' }, { status: 403 });
    }
  }

  // Status change requires at least admin
  if (body.status !== undefined) {
    if (!requireRole(auth, ['super_admin', 'admin'])) {
      return NextResponse.json({ success: false, error: 'Forbidden: Only admin and super_admin can change status' }, { status: 403 });
    }
  }

  const nextStatus = body.status !== undefined ? parseStatus(body.status) : undefined;
  if (body.status !== undefined && !nextStatus) {
    return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
  }
  const finalStatus: AdminUserStatus | undefined = nextStatus || undefined;

  const nextRole = body.role !== undefined ? parseRole(body.role) : undefined;
  if (body.role !== undefined && !nextRole) {
    return NextResponse.json({ success: false, error: 'Invalid role' }, { status: 400 });
  }
  const finalRole: AdminUserRole | undefined = nextRole || undefined;

  if (finalStatus === undefined && finalRole === undefined) {
    return NextResponse.json({ success: false, error: 'Nothing to update' }, { status: 400 });
  }

  const updated = updateAdminUser(id, {
    status: finalStatus,
    role: finalRole,
    actor: auth.email,
    ip: request.headers.get('x-forwarded-for') || undefined,
  });

  if (!updated) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, item: updated });
}

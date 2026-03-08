import { NextRequest, NextResponse } from 'next/server';
import { AdminContentStatus, createContent, listAdminContent } from '@/lib/adminContentStore';
import { getAdminAuth, requireRole } from '@/lib/adminApiAuth';

type CreateContentBody = {
  title: string;
  summary: string;
  status: AdminContentStatus;
};

export async function GET(request: NextRequest) {
  const auth = await getAdminAuth(request);
  if (!requireRole(auth, ['super_admin', 'admin', 'moderator'])) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const items = listAdminContent();
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const auth = await getAdminAuth(request);
  if (!requireRole(auth, ['super_admin', 'admin'])) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.title || !body.summary || !body.status) {
    return NextResponse.json({ error: 'Missing data' }, { status: 400 });
  }

  const data: CreateContentBody = {
    title: String(body.title).trim(),
    summary: String(body.summary).trim(),
    status: body.status as AdminContentStatus,
  };

  const created = createContent({
    ...data,
    author: auth.email || 'admin',
  });

  return NextResponse.json({ item: created }, { status: 201 });
}

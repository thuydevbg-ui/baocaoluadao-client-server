import { NextRequest, NextResponse } from 'next/server';
import { AdminContentStatus, upsertContent } from '@/lib/adminContentStore';
import { getAdminAuth, requireRole } from '@/lib/adminApiAuth';

type UpdateBody = {
  title?: string;
  summary?: string;
  status?: AdminContentStatus;
};

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getAdminAuth(request);
  if (!requireRole(auth, ['super_admin', 'admin'])) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const payload: UpdateBody = {
    title: body.title ? String(body.title).trim() : undefined,
    summary: body.summary ? String(body.summary).trim() : undefined,
    status: body.status as AdminContentStatus | undefined,
  };

  if (!payload.title && !payload.summary && !payload.status) {
    return NextResponse.json({ error: 'No update fields provided' }, { status: 400 });
  }

  const existingItem = await import('@/lib/adminContentStore').then((mod) => mod.listAdminContent().find((i) => i.id === params.id));
  if (!existingItem) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const updated = upsertContent({
    ...existingItem,
    ...payload,
    updatedAt: new Date().toISOString(),
    author: auth.email || existingItem.author,
  });

  return NextResponse.json({ item: updated });
}

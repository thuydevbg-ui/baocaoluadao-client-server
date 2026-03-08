import { NextRequest, NextResponse } from 'next/server';
import { AdminContentStatus, upsertContent, listAdminContent } from '@/lib/adminContentStore';
import { getAdminAuth, requireRole } from '@/lib/adminApiAuth';

type UpdateBody = {
  title?: string;
  summary?: string;
  status?: AdminContentStatus;
};

export async function PATCH(request: NextRequest, context: any) {
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

  const { id } = context.params;
  const existingItem = listAdminContent().find((i) => i.id === id);
  if (!existingItem) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const userEmail = auth?.email || existingItem.author;
  const updated = upsertContent({
    ...existingItem,
    ...payload,
    updatedAt: new Date().toISOString(),
    author: userEmail,
  });

  return NextResponse.json({ item: updated });
}

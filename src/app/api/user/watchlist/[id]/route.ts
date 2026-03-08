import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextAuthOptions';
import { withApiObservability } from '@/lib/apiHandler';
import { ensureUserInfra } from '@/lib/userInfra';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const DELETE = withApiObservability(async (_req, _ctx, { params }: { params: Promise<{ id: string }> }) => {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await ensureUserInfra();
  const db = getDb();
  const [userRows] = await db.query<any[]>(`SELECT id FROM users WHERE email = ? LIMIT 1`, [email]);
  const userId = userRows?.[0]?.id;
  if (!userId) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

  await db.query(`DELETE FROM watchlist WHERE id = ? AND userId = ? LIMIT 1`, [id, userId]);
  return NextResponse.json({ success: true });
});

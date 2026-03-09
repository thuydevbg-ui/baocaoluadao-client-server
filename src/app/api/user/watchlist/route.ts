import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import crypto from 'crypto';
import { authOptions } from '@/lib/nextAuthOptions';
import { withApiObservability } from '@/lib/apiHandler';
import { ensureUserInfra } from '@/lib/userInfra';
import { getDb } from '@/lib/db';
import { adjustProfileSummary, ensureProfileSummary } from '@/lib/userSummary';

export const dynamic = 'force-dynamic';

async function getUserId(email: string) {
  const db = getDb();
  const [rows] = await db.query<any[]>(`SELECT id FROM users WHERE email = ? LIMIT 1`, [email]);
  return rows?.[0]?.id as string | undefined;
}

export const GET = withApiObservability(async () => {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  await ensureUserInfra();
  const userId = await getUserId(email);
  if (!userId) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

  const db = getDb();
  const [rows] = await db.query<any[]>(
    `SELECT id, target, type, createdAt FROM watchlist WHERE userId = ? ORDER BY createdAt DESC`,
    [userId]
  );
  return NextResponse.json({ success: true, items: rows || [] });
});

export const POST = withApiObservability(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  await ensureUserInfra();
  const userId = await getUserId(email);
  if (!userId) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

  let body: { target?: string; type?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const target = (body.target || '').trim().slice(0, 300);
  const type = (body.type || 'website').slice(0, 40);
  if (!target) return NextResponse.json({ success: false, error: 'target required' }, { status: 400 });

  const db = getDb();
  await ensureProfileSummary(userId);
  await db.query(
    `INSERT INTO watchlist (id, userId, target, type, createdAt) VALUES (?, ?, ?, ?, NOW())`,
    [crypto.randomUUID(), userId, target, type]
  );
  await adjustProfileSummary(userId, { watchlistCount: 1, alertCount: 1 });
  return NextResponse.json({ success: true });
});

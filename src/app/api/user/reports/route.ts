import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import crypto from 'crypto';
import { authOptions } from '@/lib/nextAuthOptions';
import { withApiObservability } from '@/lib/apiHandler';
import { ensureUserInfra } from '@/lib/userInfra';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function getUserId(email: string) {
  const db = getDb();
  const [rows] = await db.query<any[]>(`SELECT id FROM users WHERE email = ? LIMIT 1`, [email]);
  return rows?.[0]?.id as string | undefined;
}

export const GET = withApiObservability(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  await ensureUserInfra();
  const userId = await getUserId(email);
  if (!userId) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get('limit') || 50), 100);

  const db = getDb();
  const [rows] = await db.query<any[]>(
    `SELECT id, type, target, riskScore, status, createdAt
     FROM user_reports
     WHERE userId = ?
     ORDER BY createdAt DESC
     LIMIT ?`,
    [userId, limit]
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

  let body: { type?: string; target?: string; riskScore?: number } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const type = (body.type || 'website').slice(0, 40);
  const target = (body.target || '').trim().slice(0, 500);
  const riskScore = Number.isFinite(body.riskScore) ? Math.max(0, Math.min(100, Number(body.riskScore))) : 0;

  if (!target) return NextResponse.json({ success: false, error: 'target required' }, { status: 400 });

  const db = getDb();
  const id = crypto.randomUUID();
  await db.query(
    `INSERT INTO user_reports (id, userId, type, target, riskScore, status, createdAt)
     VALUES (?, ?, ?, ?, ?, 'pending', NOW())`,
    [id, userId, type, target, riskScore]
  );

  await db.query(
    `INSERT INTO user_activity (id, userId, type, description, createdAt) VALUES (?, ?, 'report', ?, NOW())`,
    [crypto.randomUUID(), userId, `Gửi báo cáo ${target}`]
  );

  return NextResponse.json({ success: true, id });
});


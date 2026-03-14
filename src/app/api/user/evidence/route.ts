import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { withApiObservability } from '@/lib/apiHandler';
import { ensureUserInfra } from '@/lib/userInfra';
import { getDb } from '@/lib/db';
import { getSessionEmail } from '@/lib/sessionEmail';

const isDevOrTest = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
const isMockEnabled = isDevOrTest && process.env.MOCK_DB === '1';
// SECURITY: Explicitly disable auto-create in production
const canAutoCreateUser = isDevOrTest && process.env.NODE_ENV !== 'production' && process.env.ALLOW_TEST_IMPERSONATION === '1' && process.env.TEST_AUTO_CREATE_USER === '1';

const MOCK_USER_ID = 'USER-MOCK';
const MOCK_REPORT_ID = 'RPT-MOCK-1';

async function getUserId(email: string) {
  if (isMockEnabled) return MOCK_USER_ID;
  const db = getDb();
  const [rows] = await db.query<any[]>(`SELECT id FROM users WHERE email = ? LIMIT 1`, [email]);
  const found = rows?.[0]?.id as string | undefined;
  if (found) return found;
  if (canAutoCreateUser) {
    const newId = crypto.randomUUID();
    await db.query(
      `INSERT IGNORE INTO users (id, email, name, provider, role, created_at, updated_at) VALUES (?, ?, ?, 'credentials', 'user', NOW(), NOW())`,
      [newId, email, email.split('@')[0] || 'Test User']
    );
    return newId;
  }
  return undefined;
}

function validateBody(body: any) {
  const reportId = typeof body.reportId === 'string' ? body.reportId.trim() : '';
  const fileUrl = typeof body.fileUrl === 'string' ? body.fileUrl.trim() : '';
  const mime = typeof body.mime === 'string' ? body.mime.trim().slice(0, 120) : null;
  const sizeBytes = Number.isFinite(body.sizeBytes) ? Number(body.sizeBytes) : null;
  const sha256 = typeof body.sha256 === 'string' ? body.sha256.trim().slice(0, 128) : null;

  if (!reportId || !fileUrl) {
    return { error: 'reportId và fileUrl là bắt buộc' };
  }
  return { reportId, fileUrl, mime, sizeBytes, sha256 };
}

export const GET = withApiObservability(async (req: NextRequest) => {
  const email = isMockEnabled ? 'mock@local' : await getSessionEmail(req);
  if (!email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  await ensureUserInfra();
  const userId = await getUserId(email);
  if (!userId) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const reportId = searchParams.get('reportId');

  if (isMockEnabled) {
    return NextResponse.json({
      success: true,
      items: [
        {
          id: 'EV-MOCK-1',
          reportId: reportId || MOCK_REPORT_ID,
          fileUrl: 'https://example.com/evidence.png',
          mime: 'image/png',
          sizeBytes: 123456,
          sha256: 'mockhash',
          createdAt: new Date().toISOString(),
        },
      ],
    });
  }

  const db = getDb();
  const params: any[] = [userId];
  let where = 'userId = ?';
  if (reportId) {
    where += ' AND reportId = ?';
    params.push(reportId);
  }

  const [rows] = await db.query<any[]>(
    `SELECT id, reportId, fileUrl, mime, sizeBytes, sha256, createdAt
     FROM evidence_files
     WHERE ${where}
     ORDER BY createdAt DESC
     LIMIT 50`,
    params
  );

  return NextResponse.json({ success: true, items: rows || [] });
});

export const POST = withApiObservability(async (req: NextRequest) => {
  const email = isMockEnabled ? 'mock@local' : await getSessionEmail(req);
  if (!email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  await ensureUserInfra();
  const userId = await getUserId(email);
  if (!userId) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const validated = validateBody(body);
  if ('error' in validated) {
    return NextResponse.json({ success: false, error: validated.error }, { status: 400 });
  }

  const { reportId, fileUrl, mime, sizeBytes, sha256 } = validated;

  if (isMockEnabled) {
    return NextResponse.json({ success: true, id: `EV-MOCK-${crypto.randomUUID().slice(0, 6)}` });
  }

  const db = getDb();
  const id = crypto.randomUUID();

  // Ensure user owns the report
  const [ownerRows] = await db.query<any[]>(`SELECT id FROM user_reports WHERE id = ? AND userId = ? LIMIT 1`, [reportId, userId]);
  if (!ownerRows?.length) {
    return NextResponse.json({ success: false, error: 'Report not found or not owned by user' }, { status: 404 });
  }

  await db.query(
    `INSERT INTO evidence_files (id, userId, reportId, fileUrl, mime, sizeBytes, sha256, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
    [id, userId, reportId, fileUrl, mime, sizeBytes, sha256]
  );

  return NextResponse.json({ success: true, id });
});

export const runtime = 'nodejs';

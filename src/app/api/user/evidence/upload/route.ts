import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { withApiObservability } from '@/lib/apiHandler';
import { getSessionEmail } from '@/lib/sessionEmail';

export const runtime = 'nodejs';

function buildSignedUrl(fileName: string, contentType?: string) {
  // Placeholder signed URL. Replace with real S3/R2 generation when creds available.
  const token = crypto.randomBytes(12).toString('hex');
  const expires = Date.now() + 10 * 60 * 1000; // 10 minutes
  const url = `https://upload.mock.local/${encodeURIComponent(fileName)}?token=${token}&expires=${expires}`;
  return { uploadUrl: url, fields: {}, contentType, expiresAt: new Date(expires).toISOString() };
}

export const POST = withApiObservability(async (req: NextRequest) => {
  const email = process.env.MOCK_DB === '1' ? 'mock@local' : await getSessionEmail(req);
  if (!email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const fileName = typeof body.fileName === 'string' ? body.fileName.trim() : '';
  const contentType = typeof body.contentType === 'string' ? body.contentType.trim() : undefined;
  if (!fileName) return NextResponse.json({ success: false, error: 'fileName required' }, { status: 400 });

  const signed = buildSignedUrl(fileName, contentType);
  return NextResponse.json({ success: true, ...signed });
});

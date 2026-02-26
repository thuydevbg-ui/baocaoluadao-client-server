import { NextRequest, NextResponse } from 'next/server';
import { getSiteSettings } from '@/lib/siteSettings';
import { getClientIp, isIpBanned, banIp } from '@/lib/ipBan';

export const dynamic = 'force-dynamic';

function parseAllowedIps(raw: string | null): string[] {
  if (!raw) return [];
  return raw.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (await isIpBanned(ip)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const settings = await getSiteSettings();
  const allowed = parseAllowedIps(settings.allowedDocsIps);
  if (!(ip && allowed.includes(ip))) {
    await banIp(ip, 'api-docs.yaml unauthorized');
    return new NextResponse('Not Found', { status: 404 });
  }

  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
  const scheme = (req.headers.get('x-forwarded-proto') || 'http').split(',')[0];
  const serverUrl = `${scheme}://${host}`;

  const yaml = `openapi: 3.0.3
info:
  title: ScamGuard API
  version: 1.0.0
servers:
  - url: ${serverUrl}
paths:
  /api/settings/public:
    get:
      summary: Public site settings
      responses:
        '200': { description: OK }
  /api/admin/settings:
    get: { summary: Admin settings (auth required), responses: { '200': { description: OK } } }
    put: { summary: Update admin settings (auth required), responses: { '200': { description: Updated } } }
  /api/auth/register:
    post:
      summary: Ðang ký ngu?i dùng
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name: { type: string }
                email: { type: string }
                password: { type: string }
      responses:
        '201': { description: Created }
  /api/auth/[...nextauth]:
    get:
      summary: NextAuth routes (credentials + Google)
      responses:
        '200': { description: OK }
`;

  return new NextResponse(yaml, {
    status: 200,
    headers: {
      'Content-Type': 'text/yaml; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { withApiObservability } from '@/lib/apiHandler';

function normalizeIp(raw: string | null | undefined): string {
  if (!raw) return '';
  const first = raw.split(',')[0]?.trim() || '';
  const noBrackets = first.replace(/^\[|\]$/g, '');
  const withoutPort = noBrackets.includes(':') && !noBrackets.includes('::')
    ? noBrackets.split(':')[0]
    : noBrackets;
  return withoutPort.toLowerCase();
}

function getClientIp(req: NextRequest): string {
  const candidates = [
    req.headers.get('cf-connecting-ip'),
    req.headers.get('true-client-ip'),
    req.headers.get('x-forwarded-for'),
    req.headers.get('x-client-ip'),
    req.headers.get('x-real-ip'),
    (req as any).ip,
  ];

  for (const raw of candidates) {
    const normalized = normalizeIp(typeof raw === 'string' ? raw : String(raw || ''));
    if (normalized) return normalized;
  }
  return '';
}

function isIpAllowed(ip: string): boolean {
  const allowList = process.env.ADMIN_ALLOWED_IPS?.split(',').map((i) => i.trim()).filter(Boolean) || [];
  if (allowList.length === 0) return true;
  if (!ip) return false;
  if (allowList.some((a) => a.trim() === '*' || a.trim().toLowerCase() === 'all')) return true;
  const lowered = normalizeIp(ip);
  return allowList.some((allowed) => normalizeIp(allowed) === lowered);
}

export const GET = withApiObservability(async (req: NextRequest) => {
  const clientIp = getClientIp(req);
  const allowList =
    process.env.ADMIN_ALLOWED_IPS?.split(',').map((i) => i.trim()).filter(Boolean) || [];

  return NextResponse.json({
    ip: clientIp || null,
    allowed: isIpAllowed(clientIp),
    allowListSize: allowList.length,
    allowList,
    debug: {
      cfConnectingIp: req.headers.get('cf-connecting-ip') || null,
      trueClientIp: req.headers.get('true-client-ip') || null,
      xForwardedFor: req.headers.get('x-forwarded-for') || null,
      xClientIp: req.headers.get('x-client-ip') || null,
      xRealIp: req.headers.get('x-real-ip') || null,
    },
  });
});

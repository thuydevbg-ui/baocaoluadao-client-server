import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { runDomainExpiryBackfill } from '@/lib/services/domainExpiry.service';

function safeCompare(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  if (a.length !== b.length) {
    createHash('sha256').update(b).digest();
    return false;
  }
  return createHash('sha256').update(a).digest().equals(createHash('sha256').update(b).digest());
}

function getProvidedToken(request: NextRequest): string | null {
  const auth = request.headers.get('authorization') || '';
  if (auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }
  return request.headers.get('x-sync-token');
}

function parsePositiveInt(raw: string | null): number | undefined {
  if (!raw) return undefined;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value <= 0) return undefined;
  return value;
}

export async function POST(request: NextRequest) {
  const expected = process.env.INTERNAL_SYNC_TOKEN;
  if (!expected) {
    return NextResponse.json(
      { success: false, error: 'INTERNAL_SYNC_TOKEN not configured' },
      { status: 500 }
    );
  }

  const provided = getProvidedToken(request);
  if (!provided || !safeCompare(provided, expected)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = parsePositiveInt(url.searchParams.get('limit'));
  const concurrency = parsePositiveInt(url.searchParams.get('concurrency'));
  const cooldownDays = parsePositiveInt(url.searchParams.get('cooldownDays'));

  const options = {
    limit,
    concurrency,
    cooldownDays,
  };

  setTimeout(() => {
    void runDomainExpiryBackfill(options)
      .then((summary) => {
        console.log('[domain-expiry] backfill summary', summary);
      })
      .catch((error) => {
        console.error('[domain-expiry] backfill failed:', error);
      });
  }, 0);

  return NextResponse.json(
    {
      success: true,
      message: 'Domain expiry backfill started in background.',
      options,
    },
    { status: 202 }
  );
}

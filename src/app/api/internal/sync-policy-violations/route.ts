import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { getPolicyViolationSyncSnapshot, syncPolicyViolationList } from '@/lib/services/policyViolation.service';

/**
 * Constant-time string comparison to prevent timing attacks.
 */
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

  // Fire-and-forget to avoid long-running HTTP requests.
  setTimeout(() => {
    void syncPolicyViolationList().catch((error) => {
      console.error('[internal-policy-sync] background sync failed:', error);
    });
  }, 0);

  const snapshot = await getPolicyViolationSyncSnapshot().catch(() => null);

  return NextResponse.json(
    {
      success: true,
      message: 'Policy violation sync started in background.',
      snapshot,
    },
    { status: 202 }
  );
}


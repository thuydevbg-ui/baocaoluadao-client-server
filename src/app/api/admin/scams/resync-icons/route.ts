import { NextRequest, NextResponse } from 'next/server';
import { withApiObservability } from '@/lib/apiHandler';
import { getAdminAuthValidated, requireRole } from '@/lib/adminApiAuth';
import { getTinnhiemIconBackfillSnapshot, runTinnhiemIconBackfill } from '@/lib/services/tinnhiemSync.service';

function parseLimit(value: unknown): number | undefined {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed) || parsed < 1) return undefined;
  return parsed;
}

export const GET = withApiObservability(async (request: NextRequest) => {
  const auth = await getAdminAuthValidated(request);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (!requireRole(auth, ['admin', 'super_admin'])) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const snapshot = getTinnhiemIconBackfillSnapshot();
  return NextResponse.json({ success: true, snapshot }, { status: 200 });
});

export const POST = withApiObservability(async (request: NextRequest) => {
  const auth = await getAdminAuthValidated(request);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (!requireRole(auth, ['admin', 'super_admin'])) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  let limit: number | undefined;
  try {
    const payload = await request.json().catch(() => ({}));
    limit = parseLimit(payload?.limit);
  } catch {
    limit = undefined;
  }

  // Run in background to avoid request timeout.
  setTimeout(() => {
    void runTinnhiemIconBackfill(limit).catch((error) => {
      console.error('[admin-icon-backfill] failed:', error);
    });
  }, 0);

  const snapshot = getTinnhiemIconBackfillSnapshot();
  return NextResponse.json(
    {
      success: true,
      message: snapshot.running ? 'Icon backfill is running in background.' : 'Icon backfill started in background.',
      snapshot,
    },
    { status: 202 }
  );
});


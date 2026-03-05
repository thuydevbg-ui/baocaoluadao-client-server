import { NextRequest, NextResponse } from 'next/server';
import { withApiObservability } from '@/lib/apiHandler';
import { getAdminAuthValidated, requireRole } from '@/lib/adminApiAuth';
import { runTinnhiemFullSync, getTinnhiemSyncSnapshot } from '@/lib/services/tinnhiemSync.service';

export const POST = withApiObservability(async (request: NextRequest) => {
  const auth = await getAdminAuthValidated(request);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (!requireRole(auth, ['admin', 'super_admin'])) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  // Fire-and-forget to avoid edge timeout / 504 (schedule next tick)
  setTimeout(() => {
    void runTinnhiemFullSync().catch((error) => {
      console.error('[admin-sync] background sync failed:', error);
    });
  }, 0);

  // Return current snapshot immediately (no kickoff logic to keep response instant)
  const snapshot = await getTinnhiemSyncSnapshot().catch(() => null);

  return NextResponse.json({
    success: true,
    message: snapshot?.syncing
      ? 'Sync already running, continuing in background.'
      : 'Sync started in background.',
    snapshot,
  }, { status: 202 });
});

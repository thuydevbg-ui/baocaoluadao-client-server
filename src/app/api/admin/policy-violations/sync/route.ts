import { NextRequest, NextResponse } from 'next/server';
import { withApiObservability } from '@/lib/apiHandler';
import { getAdminAuthValidated, requireRole } from '@/lib/adminApiAuth';
import { getPolicyViolationSyncSnapshot, syncPolicyViolationList } from '@/lib/services/policyViolation.service';

export const POST = withApiObservability(async (request: NextRequest) => {
  const auth = await getAdminAuthValidated(request);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (!requireRole(auth, ['admin', 'super_admin'])) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  setTimeout(() => {
    void syncPolicyViolationList().catch((error) => {
      console.error('[policy-violations] background sync failed:', error);
    });
  }, 0);

  const snapshot = await getPolicyViolationSyncSnapshot().catch(() => null);
  return NextResponse.json({
    success: true,
    message: 'Policy violation sync started in background.',
    snapshot,
  }, { status: 202 });
});

export const GET = withApiObservability(async (request: NextRequest) => {
  const auth = await getAdminAuthValidated(request);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (!requireRole(auth, ['admin', 'super_admin'])) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const snapshot = await getPolicyViolationSyncSnapshot().catch(() => null);
  return NextResponse.json({ success: true, snapshot }, { status: 200 });
});


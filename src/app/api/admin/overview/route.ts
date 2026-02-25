import { NextRequest, NextResponse } from 'next/server';
import { getAdminOverview } from '@/lib/adminDataStore';
import { getAdminAuth } from '@/lib/adminApiAuth';

export async function GET(request: NextRequest) {
  const auth = getAdminAuth(request);
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const data = getAdminOverview();
  return NextResponse.json({
    success: true,
    ...data,
  });
}


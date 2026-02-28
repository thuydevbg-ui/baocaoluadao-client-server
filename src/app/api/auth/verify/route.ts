import { withApiObservability } from '@/lib/apiHandler';
import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, parseSignedCookie, type AdminAuthPayload } from '@/lib/auth';

export const POST = withApiObservability(async (request: NextRequest) => {
  try {
    const adminAuthCookie = request.cookies.get(COOKIE_NAME);
    if (!adminAuthCookie?.value) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const authData = parseSignedCookie(adminAuthCookie.value);
    if (!authData) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    return NextResponse.json({
      authenticated: true,
      email: authData.email,
      name: authData.name,
      role: authData.role
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
});

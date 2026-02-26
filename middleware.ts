import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const TMP_HTML_ROUTE = /^\/tm_.*\.html$/i;

export function middleware(request: NextRequest) {
  if (TMP_HTML_ROUTE.test(request.nextUrl.pathname)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};

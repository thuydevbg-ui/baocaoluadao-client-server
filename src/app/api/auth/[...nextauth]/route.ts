import NextAuth from 'next-auth';
import { authOptions } from '@/lib/nextAuthOptions';
import { NextRequest } from 'next/server';
import { withApiObservability } from '@/lib/apiHandler';

const nextAuthHandler = NextAuth(authOptions);
const handler = withApiObservability<Response, any>(
  async (request: NextRequest, _apiContext, routeContext) => nextAuthHandler(request, routeContext)
);

export { handler as GET, handler as POST };

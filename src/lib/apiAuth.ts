import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from './nextAuthOptions';
import { verifyAccessToken, AUTH_CONFIG } from './auth';
import { canAccessRoute, isAdmin, type UserRole } from './permissions';
import { findUserByEmail } from './userRepository';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  image: string | null;
}

export interface AuthContext {
  user: AuthUser;
  isAuthenticated: boolean;
}

/**
 * Get current authenticated user from request
 */
export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  // First try NextAuth session
  const session = await getServerSession(authOptions);
  if (session?.user) {
    return {
      id: session.user.id || '',
      email: session.user.email || '',
      name: session.user.name || null,
      role: (session.user.role as UserRole) || 'user',
      image: session.user.image || null,
    };
  }

  // Fallback: check JWT token from header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    if (payload) {
      const user = await findUserByEmail(payload.email);
      if (user) {
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        };
      }
    }
  }

  return null;
}

/**
 * Require authentication - returns 401 if not authenticated
 */
export async function requireAuth(request: NextRequest): Promise<AuthContext> {
  const user = await getAuthUser(request);
  
  if (!user) {
    throw new AuthError('Unauthorized', 401);
  }
  
  return {
    user,
    isAuthenticated: true,
  };
}

/**
 * Require specific role
 */
export async function requireRole(request: NextRequest, allowedRoles: UserRole[]): Promise<AuthContext> {
  const auth = await requireAuth(request);
  
  if (!allowedRoles.includes(auth.user.role)) {
    throw new AuthError('Forbidden', 403);
  }
  
  return auth;
}

/**
 * Require admin role
 */
export async function requireAdmin(request: NextRequest): Promise<AuthContext> {
  return requireRole(request, ['admin']);
}

/**
 * Require moderator or admin role
 */
export async function requireModerator(request: NextRequest): Promise<AuthContext> {
  return requireRole(request, ['moderator', 'admin']);
}

/**
 * Check if user can access route
 */
export async function checkRouteAccess(
  request: NextRequest,
  pathname: string
): Promise<{ allowed: boolean; redirect?: string }> {
  const user = await getAuthUser(request);
  
  // No session - redirect to login for protected routes
  if (!user) {
    const protectedPaths = ['/profile', '/dashboard', '/reports', '/watchlist', '/settings', '/admin'];
    const isProtected = protectedPaths.some(p => pathname.startsWith(p));
    
    if (isProtected) {
      return { allowed: false, redirect: '/login' };
    }
    return { allowed: true };
  }
  
  // Check role-based access
  if (pathname.startsWith('/admin')) {
    if (!isAdmin(user.role)) {
      return { allowed: false, redirect: '/profile' };
    }
  }
  
  return { allowed: true };
}

/**
 * Auth error class
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Handle auth errors in API routes
 */
export function handleAuthError(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }
  
  console.error('[API Auth] Unexpected error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}

/**
 * Wrapper for protected API route handlers
 */
export async function withAuth<T>(
  request: NextRequest,
  handler: (auth: AuthContext) => Promise<T>
): Promise<NextResponse> {
  try {
    const auth = await requireAuth(request);
    await handler(auth);
    return NextResponse.json(await handler(auth));
  } catch (error) {
    if (error instanceof AuthError) {
      return handleAuthError(error);
    }
    return handleAuthError(error);
  }
}

/**
 * Wrapper for admin-only API route handlers
 */
export async function withAdminAuth<T>(
  request: NextRequest,
  handler: (auth: AuthContext) => Promise<T>
): Promise<NextResponse> {
  try {
    const auth = await requireAdmin(request);
    return NextResponse.json(await handler(auth));
  } catch (error) {
    return handleAuthError(error);
  }
}

/**
 * Wrapper for moderator+ API route handlers
 */
export async function withModeratorAuth<T>(
  request: NextRequest,
  handler: (auth: AuthContext) => Promise<T>
): Promise<NextResponse> {
  try {
    const auth = await requireModerator(request);
    return NextResponse.json(await handler(auth));
  } catch (error) {
    return handleAuthError(error);
  }
}

// ============================================
// MIDDLEWARE COMPATIBLE FUNCTIONS (for use in route.ts)\n// ============================================

/**
 * Get auth from request (for use in route handlers)
 */
export async function getRequestAuth(request: NextRequest): Promise<AuthUser | null> {
  return getAuthUser(request);
}

/**
 * Validate JWT token from cookie
 */
export function validateTokenFromCookie(request: NextRequest): string | null {
  const token = request.cookies.get(AUTH_CONFIG.ACCESS_TOKEN_COOKIE)?.value;
  if (!token) return null;
  
  const payload = verifyAccessToken(token);
  return payload?.sub || null;
}

/**
 * Create auth headers for downstream requests
 */
export function createAuthHeaders(user: AuthUser): Record<string, string> {
  return {
    'X-User-ID': user.id,
    'X-User-Email': user.email,
    'X-User-Role': user.role,
  };
}

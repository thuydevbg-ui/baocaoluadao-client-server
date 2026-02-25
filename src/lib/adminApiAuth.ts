import { NextRequest } from 'next/server';
import { COOKIE_NAME, parseSignedCookie, type AdminAuthPayload } from '@/lib/auth';

export type AdminRole = 'super_admin' | 'admin' | 'moderator' | 'user';

export function getAdminAuth(request: NextRequest): AdminAuthPayload | null {
  const rawCookie = request.cookies.get(COOKIE_NAME)?.value;
  if (!rawCookie) return null;

  const candidates = [rawCookie];
  try {
    const decoded = decodeURIComponent(rawCookie);
    if (decoded !== rawCookie) {
      candidates.push(decoded);
    }
  } catch {
    // Ignore decode error and continue.
  }

  for (const candidate of candidates) {
    const parsed = parseSignedCookie(candidate);
    if (parsed) {
      return parsed;
    }
  }

  return null;
}

/**
 * Check if the authenticated user has one of the required roles
 */
export function requireRole(auth: AdminAuthPayload | null, allowedRoles: AdminRole[]): boolean {
  if (!auth) return false;
  return allowedRoles.includes(auth.role as AdminRole);
}


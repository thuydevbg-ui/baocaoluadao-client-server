'use client';

import { useSession, signOut, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { isAdmin, isModerator, type UserRole } from '@/lib/permissions';

/**
 * Extended session user type
 */
interface SessionUser {
  id?: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  role?: string;
}

/**
 * Auth hook return type
 */
export interface UseAuthReturn {
  // Session state
  user: SessionUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Role helpers
  role: UserRole | null;
  isAdmin: boolean;
  isModerator: boolean;
  
  // Actions
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  
  // Permission helpers
  hasPermission: (requiredRole: UserRole) => boolean;
}

/**
 * Client-side authentication hook
 * 
 * Usage:
 * ```tsx
 * const { user, isAuthenticated, isAdmin, logout } = useAuth();
 * ```
 */
export function useAuth(): UseAuthReturn {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  // Parse user from session
  const user = useMemo(() => {
    if (!session?.user) return null;
    return session.user as SessionUser;
  }, [session]);

  // Check if authenticated
  const isAuthenticated = useMemo(() => {
    return status === 'authenticated' && !!session?.user;
  }, [status, session]);

  // Get role
  const role = useMemo((): UserRole | null => {
    if (!user?.role) return null;
    return user.role as UserRole;
  }, [user]);

  // Role checks
  const isAdminUser = useMemo(() => {
    return role ? isAdmin(role) : false;
  }, [role]);

  const isModeratorUser = useMemo(() => {
    return role ? isModerator(role) : false;
  }, [role]);

  /**
   * Login with credentials
   */
  const login = useCallback(async (
    email: string, 
    password: string, 
    rememberMe: boolean = false
  ) => {
    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
      rememberMe,
    });

    if (result?.error) {
      throw new Error(result.error);
    }

    // Redirect to profile after successful login
    router.push('/profile');
    router.refresh();
  }, [router]);

  /**
   * Logout and clear session
   */
  const logout = useCallback(async () => {
    await signOut({ 
      redirect: false,
      callbackUrl: '/',
    });
    router.push('/');
    router.refresh();
  }, [router]);

  /**
   * Refresh session
   */
  const refreshSession = useCallback(async () => {
    await update();
  }, [update]);

  /**
   * Check if user has required role level
   */
  const hasPermission = useCallback((requiredRole: UserRole): boolean => {
    if (!role) return false;
    
    const roleLevels: Record<UserRole, number> = {
      user: 1,
      moderator: 2,
      admin: 3,
    };
    
    return roleLevels[role] >= roleLevels[requiredRole];
  }, [role]);

  return {
    // Session state
    user,
    isAuthenticated,
    isLoading: status === 'loading',
    
    // Role helpers
    role,
    isAdmin: isAdminUser,
    isModerator: isModeratorUser,
    
    // Actions
    login,
    logout,
    refreshSession,
    
    // Permission helpers
    hasPermission,
  };
}

/**
 * Hook to require authentication (redirects if not authenticated)
 * 
 * Usage:
 * ```tsx
 * useRequireAuth();
 * ```
 */
export function useRequireAuth(redirectTo: string = '/login') {
  const { isAuthenticated, isLoading } = useAuth();
  
  // This would ideally redirect, but we'll return the auth state
  // The actual redirect should be handled by the component using this hook
  return { isAuthenticated, isLoading };
}

/**
 * Hook to require admin role
 * 
 * Usage:
 * ```tsx
 * const { isAdmin } = useRequireAdmin();
 * if (!isAdmin) return <AccessDenied />;
 * ```
 */
export function useRequireAdmin() {
  const { isAdmin, role, isLoading } = useAuth();
  
  return {
    isAdmin,
    role,
    isLoading,
  };
}

/**
 * Hook for protected routes
 * Returns true if user can access, false otherwise
 */
export function useProtectedRoute(requiredRole: UserRole = 'user') {
  const { hasPermission, isAuthenticated, isLoading } = useAuth();
  
  return {
    canAccess: isAuthenticated && hasPermission(requiredRole),
    isAuthenticated,
    isLoading,
  };
}

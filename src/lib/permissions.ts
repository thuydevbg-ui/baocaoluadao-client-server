import type { UserRole } from './auth';

// ============================================
// ROLE DEFINITIONS
// ============================================

/**
 * User roles in the system
 */
export type Role = UserRole;
export type { UserRole };

/**
 * Permission categories
 */
export type PermissionCategory = 
  | 'users' 
  | 'reports' 
  | 'scams' 
  | 'admin' 
  | 'analytics' 
  | 'settings';

/**
 * Specific permissions
 */
export type Permission =
  // User management
  | 'users:read'
  | 'users:create'
  | 'users:update'
  | 'users:delete'
  | 'users:manage-roles'
  
  // Report management
  | 'reports:read'
  | 'reports:create'
  | 'reports:update'
  | 'reports:delete'
  | 'reports:review'
  | 'reports:approve'
  | 'reports:reject'
  
  // Scam management
  | 'scams:read'
  | 'scams:create'
  | 'scams:update'
  | 'scams:delete'
  | 'scams:verify'
  | 'scams:block'
  
  // Admin features
  | 'admin:access'
  | 'admin:dashboard'
  | 'admin:settings'
  | 'admin:logs'
  
  // Analytics
  | 'analytics:read'
  | 'analytics:export'
  
  // Settings
  | 'settings:read'
  | 'settings:update'
  | 'settings:email'
  | 'settings:security';

// ============================================
// ROLE-PERMISSION MAPPING
// ============================================

/**
 * Define which permissions each role has
 */
function getRolePermissions(role: Role): Permission[] {
  switch (role) {
    case 'user':
      return [
        // Own profile
        'users:read',
        'users:update',
        
        // Own reports
        'reports:read',
        'reports:create',
        'reports:update',
        
        // Public scam data
        'scams:read',
        
        // Own analytics
        'analytics:read',
      ];
    
    case 'moderator':
      return [
        // All user permissions
        ...getRolePermissions('user'),
        
        // Report moderation
        'reports:read',
        'reports:update',
        'reports:review',
        'reports:approve',
        'reports:reject',
        
        // Scam management
        'scams:read',
        'scams:update',
        'scams:verify',
        
        // Basic analytics
        'analytics:read',
      ];
    
    case 'admin':
      return [
        // All user permissions
        'users:read',
        'users:create',
        'users:update',
        'users:delete',
        'users:manage-roles',
        
        'reports:read',
        'reports:create',
        'reports:update',
        'reports:delete',
        'reports:review',
        'reports:approve',
        'reports:reject',
        
        'scams:read',
        'scams:create',
        'scams:update',
        'scams:delete',
        'scams:verify',
        'scams:block',
        
        'admin:access',
        'admin:dashboard',
        'admin:settings',
        'admin:logs',
        
        'analytics:read',
        'analytics:export',
        
        'settings:read',
        'settings:update',
        'settings:email',
        'settings:security',
      ];
    
    default:
      return [];
  }
}

// ============================================
// PERMISSION CHECKS
// ============================================

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = getRolePermissions(role);
  return permissions.includes(permission);
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: Role): Permission[] {
  return getRolePermissions(role);
}

/**
 * Check if role can manage users
 */
export function canManageUsers(role: Role): boolean {
  return hasPermission(role, 'users:manage-roles');
}

/**
 * Check if role can access admin panel
 */
export function canAccessAdmin(role: Role): boolean {
  return hasPermission(role, 'admin:access');
}

/**
 * Check if role can manage reports
 */
export function canManageReports(role: Role): boolean {
  return hasPermission(role, 'reports:update');
}

/**
 * Check if role can review reports
 */
export function canReviewReports(role: Role): boolean {
  return hasPermission(role, 'reports:review');
}

/**
 * Check if role can verify scams
 */
export function canVerifyScams(role: Role): boolean {
  return hasPermission(role, 'scams:verify');
}

/**
 * Check if role can block scams
 */
export function canBlockScams(role: Role): boolean {
  return hasPermission(role, 'scams:block');
}

/**
 * Check if role can view analytics
 */
export function canViewAnalytics(role: Role): boolean {
  return hasPermission(role, 'analytics:read');
}

/**
 * Check if role can export analytics
 */
export function canExportAnalytics(role: Role): boolean {
  return hasPermission(role, 'analytics:export');
}

/**
 * Check if role can manage settings
 */
export function canManageSettings(role: Role): boolean {
  return hasPermission(role, 'settings:update');
}

/**
 * Check if role can delete content
 */
export function canDeleteContent(role: Role): boolean {
  return hasPermission(role, 'reports:delete') || hasPermission(role, 'scams:delete');
}

// ============================================
// ROLE HIERARCHY CHECKS
// ============================================

/**
 * Role hierarchy levels (higher = more privileges)
 */
const ROLE_LEVELS: Record<Role, number> = {
  user: 1,
  moderator: 2,
  admin: 3,
};

/**
 * Check if current role is at least as high as required role
 */
export function hasRoleLevel(role: Role, requiredRole: Role): boolean {
  return ROLE_LEVELS[role] >= ROLE_LEVELS[requiredRole];
}

/**
 * Check if role is admin
 */
export function isAdmin(role: Role): boolean {
  return role === 'admin';
}

/**
 * Check if role is moderator or above
 */
export function isModerator(role: Role): boolean {
  return role === 'moderator' || role === 'admin';
}

/**
 * Check if role is regular user
 */
export function isRegularUser(role: Role): boolean {
  return role === 'user';
}

// ============================================
// MIDDLEWARE HELPERS
// ============================================

/**
 * Require specific permission - throws if not authorized
 */
export function requirePermission(role: Role, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Permission denied: ${permission}`);
  }
}

/**
 * Require admin role
 */
export function requireAdmin(role: Role): void {
  if (!isAdmin(role)) {
    throw new Error('Admin access required');
  }
}

/**
 * Require moderator role or above
 */
export function requireModerator(role: Role): void {
  if (!isModerator(role)) {
    throw new Error('Moderator access required');
  }
}

// ============================================
// ROUTE PERMISSIONS
// ============================================

/**
 * Define which roles can access specific routes
 */
export const ROUTE_PERMISSIONS: Record<string, Role[]> = {
  // Admin routes
  '/admin': ['admin'],
  '/admin/dashboard': ['admin'],
  '/admin/users': ['admin'],
  '/admin/reports': ['admin', 'moderator'],
  '/admin/settings': ['admin'],
  '/admin/analytics': ['admin', 'moderator'],
  '/admin/logs': ['admin'],
  
  // User routes
  '/profile': ['user', 'moderator', 'admin'],
  '/dashboard': ['user', 'moderator', 'admin'],
  '/reports': ['user', 'moderator', 'admin'],
  '/watchlist': ['user', 'moderator', 'admin'],
  '/settings': ['user', 'moderator', 'admin'],
};

/**
 * Check if role can access route
 */
export function canAccessRoute(role: Role, pathname: string): boolean {
  // Check exact match first
  if (ROUTE_PERMISSIONS[pathname]) {
    return ROUTE_PERMISSIONS[pathname].includes(role);
  }
  
  // Check prefix matches
  for (const [route, allowedRoles] of Object.entries(ROUTE_PERMISSIONS)) {
    if (pathname.startsWith(route)) {
      return allowedRoles.includes(role);
    }
  }
  
  // Default: allow access to user-facing routes
  return true;
}

// ============================================
// PERMISSION GROUPS
// ============================================

/**
 * Get grouped permissions for UI display
 */
export function getPermissionGroups(role: Role): Record<PermissionCategory, Permission[]> {
  const permissions = getPermissions(role);
  
  return {
    users: permissions.filter(p => p.startsWith('users:')),
    reports: permissions.filter(p => p.startsWith('reports:')),
    scams: permissions.filter(p => p.startsWith('scams:')),
    admin: permissions.filter(p => p.startsWith('admin:')),
    analytics: permissions.filter(p => p.startsWith('analytics:')),
    settings: permissions.filter(p => p.startsWith('settings:')),
  };
}

/**
 * Get role display name in Vietnamese
 */
export function getRoleDisplayName(role: Role): string {
  const names: Record<Role, string> = {
    user: 'Người dùng',
    moderator: 'Điều hành viên',
    admin: 'Quản trị viên',
  };
  return names[role] || role;
}

/**
 * Get permission display name in Vietnamese
 */
export function getPermissionDisplayName(permission: Permission): string {
  const names: Record<Permission, string> = {
    'users:read': 'Xem người dùng',
    'users:create': 'Tạo người dùng',
    'users:update': 'Cập nhật người dùng',
    'users:delete': 'Xóa người dùng',
    'users:manage-roles': 'Quản lý vai trò',
    
    'reports:read': 'Xem báo cáo',
    'reports:create': 'Tạo báo cáo',
    'reports:update': 'Cập nhật báo cáo',
    'reports:delete': 'Xóa báo cáo',
    'reports:review': 'Duyệt báo cáo',
    'reports:approve': 'Phê duyệt báo cáo',
    'reports:reject': 'Từ chối báo cáo',
    
    'scams:read': 'Xem lừa đảo',
    'scams:create': 'Tạo lừa đảo',
    'scams:update': 'Cập nhật lừa đảo',
    'scams:delete': 'Xóa lừa đảo',
    'scams:verify': 'Xác minh lừa đảo',
    'scams:block': 'Chặn lừa đảo',
    
    'admin:access': 'Truy cập admin',
    'admin:dashboard': 'Dashboard admin',
    'admin:settings': 'Cài đặt admin',
    'admin:logs': 'Xem logs',
    
    'analytics:read': 'Xem phân tích',
    'analytics:export': 'Xuất phân tích',
    
    'settings:read': 'Xem cài đặt',
    'settings:update': 'Cập nhật cài đặt',
    'settings:email': 'Cài đặt email',
    'settings:security': 'Cài đặt bảo mật',
  };
  return names[permission] || permission;
}

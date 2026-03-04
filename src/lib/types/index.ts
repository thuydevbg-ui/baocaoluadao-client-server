/**
 * Shared Type Definitions
 * Centralized types for admin scam management system
 * Production-grade implementation for baocaoluadao.com
 */

// ============= Scam Types =============

export type ScamType = 
  | 'website'
  | 'phone'
  | 'email'
  | 'bank'
  | 'social'
  | 'sms'
  | 'device'
  | 'system'
  | 'application'
  | 'organization';

// Aliases for backward compatibility
export type AdminScamType = ScamType;
export type ReportType = ScamType;

// ============= Risk Level =============

export type RiskLevel = 'low' | 'medium' | 'high';

// Aliases for backward compatibility  
export type AdminScamRiskLevel = RiskLevel;

// ============= Scam Status =============

export type ScamStatus = 'active' | 'investigating' | 'blocked';

// Aliases for backward compatibility
export type AdminScamStatus = ScamStatus;

// ============= Report Status =============

export type ReportStatus = 'pending' | 'processing' | 'verified' | 'rejected' | 'completed';

// ============= User Types =============

export type UserRole = 'super_admin' | 'admin' | 'moderator' | 'user';
export type UserStatus = 'active' | 'banned' | 'suspended';

// Aliases for backward compatibility
export type AdminUserRole = UserRole;
export type AdminUserStatus = UserStatus;

// ============= Activity Types =============

export type ActivityStatus = 'success' | 'failed' | 'warning';

// Alias for backward compatibility
export type AdminActivityStatus = ActivityStatus;

// ============= Interfaces =============

export interface ScamRecord {
  id: string;
  type: ScamType;
  value: string;
  description: string;
  reportCount: number;
  riskLevel: RiskLevel;
  status: ScamStatus;
  source: string;
  createdAt: string;
  updatedAt: string;
}

// Aliases for backward compatibility
export interface AdminScamRecord extends ScamRecord {}

export interface Report {
  id: string;
  type: ReportType;
  target: string;
  description: string;
  reporter_name: string | null;
  reporter_email: string | null;
  source: string;
  status: ReportStatus;
  admin_notes: string | null;
  ip: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  reputationScore: number;
  reportCount: number;
  verifiedReportCount: number;
  joinedAt: string;
  lastActiveAt: string;
  updatedAt: string;
}

// Alias for backward compatibility
export interface AdminUserRecord extends UserRecord {}

export interface ActivityRecord {
  id: string;
  action: string;
  user: string;
  ip: string;
  target: string;
  status: ActivityStatus;
  timestamp: string;
}

// Alias for backward compatibility
export interface AdminActivityRecord extends ActivityRecord {}

// ============= Report List Options =============

export interface ReportListOptions {
  page?: number;
  pageSize?: number;
  status?: ReportStatus;
  type?: ReportType;
  search?: string;
}

export interface ReportListResult {
  items: Report[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: {
    pending: number;
    processing: number;
    verified: number;
    rejected: number;
    completed: number;
  };
}

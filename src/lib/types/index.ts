/**
 * Shared Type Definitions
 * Centralized types for admin management, reports, and scams
 */

// ==========================================
// Scam Types
// ==========================================

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

export type RiskLevel = 'low' | 'medium' | 'high';
export type ScamStatus = 'active' | 'investigating' | 'blocked';

// ==========================================
// Report Types
// ==========================================

export type ReportStatus = 'pending' | 'processing' | 'verified' | 'rejected' | 'completed';

// ==========================================
// User Types
// ==========================================

export type UserRole = 'super_admin' | 'admin' | 'moderator' | 'user';
export type UserStatus = 'active' | 'banned' | 'suspended';

// ==========================================
// Activity Types
// ==========================================

export type ActivityStatus = 'success' | 'failed' | 'warning';

// ==========================================
// Interfaces
// ==========================================

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

export type ReportType = ScamType;

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

export interface ActivityRecord {
  id: string;
  action: string;
  user: string;
  ip: string;
  target: string;
  status: ActivityStatus;
  timestamp: string;
}

// ==========================================
// Backward Compatibility Aliases
// ==========================================

// Admin management store aliases
export type AdminScamType = ScamType;
export type AdminScamRiskLevel = RiskLevel;
export type AdminScamStatus = ScamStatus;
export type AdminUserRole = UserRole;
export type AdminUserStatus = UserStatus;
export type AdminActivityStatus = ActivityStatus;

export type AdminScamRecord = ScamRecord;
export type AdminUserRecord = UserRecord;
export type AdminActivityRecord = ActivityRecord;

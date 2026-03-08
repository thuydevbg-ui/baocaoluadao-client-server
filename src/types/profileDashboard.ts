import { ReactNode } from 'react';

export interface UserProfileSummary {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: 'admin' | 'member' | string;
  status: 'active' | 'dormant' | string;
  statusLabel: string;
  joinedAt: string;
}

export interface UserStats {
  submittedReports: number;
  resolvedReports: number;
  activeAlerts: number;
  trustScore: number;
}

export interface SecurityCheckItem {
  id: string;
  title: string;
  subtitle: string;
  status: 'good' | 'warning' | 'pending';
  statusLabel: string;
  actionLabel: string;
  lastUpdated: string;
  buttonLabel?: string;
}

export interface SecurityOverview {
  score: number;
  checks: SecurityCheckItem[];
  trustBreakdown: { label: string; value: string }[];
}

export interface ActivityEvent {
  id: string;
  title: string;
  description: string;
  timeAgo: string;
  icon: ReactNode;
}

export interface UserReportRow {
  id: string;
  type: string;
  risk: 'low' | 'medium' | 'high';
  status: string;
  createdAt: string;
}

export interface WatchlistItem {
  id: string;
  target: string;
  type: 'website' | 'phone' | 'bank' | 'crypto';
  notificationsEnabled: boolean;
}

export interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

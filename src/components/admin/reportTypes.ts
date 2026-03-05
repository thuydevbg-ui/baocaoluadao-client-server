export type ReportStatus = 'pending' | 'processing' | 'verified' | 'rejected' | 'completed';
export type ReportType =
  | 'website'
  | 'phone'
  | 'email'
  | 'social'
  | 'sms'
  | 'bank'
  | 'device'
  | 'system'
  | 'application'
  | 'organization';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface ModerationReport {
  id: string;
  title: string;
  type: ReportType;
  status: ReportStatus;
  riskLevel: RiskLevel;
  description: string;
  createdAt: string;
  updatedAt: string;
  reporter: {
    id: string;
    name: string;
    email: string;
  };
  target: {
    type: ReportType;
    value: string;
    ip?: string;
    platform?: string;
  };
  source: string;
  adminNotes: string;
  history: Array<{
    action: string;
    user: string;
    date: string;
    note?: string;
  }>;
}

export type ReportSortKey = 'id' | 'target' | 'type' | 'risk' | 'status' | 'reporter' | 'created';
export type SortDirection = 'asc' | 'desc';

export type ReportAction = 'approve' | 'reject' | 'mark_scam' | 'delete';

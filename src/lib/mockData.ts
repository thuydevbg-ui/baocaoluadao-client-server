import { SearchResult, ScamDetail, Comment } from './utils';

// Production: no mock data. These placeholders stay empty until real data comes from API/DB.
export const mockSearchResults: SearchResult[] = [];
export const mockNotifications: { id: number; text: string; unread?: boolean }[] = [];
export const mockCategories: { name: string; slug: string; count: number; icon?: string; description?: string; color?: string }[] = [];
export const mockStats = {
  totalReports: '0',
  totalReportsNum: 0,
  verifiedCases: '0',
  verifiedCasesNum: 0,
  verifiedPercent: 0,
  totalMembers: '0',
  totalMembersNum: 0,
  protectedAmount: '0',
  protectedAmountNum: 0,
};
export const mockPopularSearches: { type: string; value: string; risk: string }[] = [];
export const mockSearchHistory: string[] = [];
export const mockTrendingScams: ScamDetail[] = [];
export const mockSafetyTips: { id: number; title: string; description: string; icon?: string; category?: string }[] = [];
export const mockRecentAlerts: ScamDetail[] = [];
export const mockComments: Comment[] = [];

/**
 * Type definitions for Cloudflare Workers
 */

export interface Env {
  // D1 Database (Cloudflare's SQL database)
  DB?: D1Database;
  
  // Database connection (via Cloudflare Tunnel or private network)
  DB_HOST?: string;
  DB_USER?: string;
  DB_PASSWORD?: string;
  DB_NAME?: string;
  
  // Optional: KV store for caching
  CACHE?: KVNamespace;
  
  // Environment
  ENVIRONMENT?: string;
  
  // API keys
  WEB_RISK_API_KEY?: string;
  PHISHTANK_API_KEY?: string;
}

export interface ScamType {
  id: string;
  type: 'website' | 'phone' | 'email' | 'bank' | 'social' | 'sms' | 'organization' | 'device' | 'system' | 'application';
  value: string;
  description: string;
  reportCount: number;
  status: string;
  riskLevel: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

export interface ReportRequest {
  type: 'website' | 'phone' | 'email' | 'social' | 'sms';
  target: string;
  description: string;
  reporterEmail?: string;
  reporterName?: string;
  source?: 'community' | 'manual';
}

export interface Category {
  name: string;
  slug: string;
  count: number;
  icon: string;
  description: string;
}

export interface Stats {
  website: number;
  organization: number;
  device: number;
  phone: number;
  email: number;
  social: number;
  sms: number;
  bank: number;
  total: number;
  lastUpdated: string;
}

export interface PolicyViolationLookupRequest {
  url?: string;
  domain?: string;
}

export interface RiskAnalyzeRequest {
  type: 'website' | 'phone' | 'email';
  value: string;
}

export interface DetailFeedbackRequest {
  action: 'rate' | 'comment' | 'helpful';
  detailKey: string;
  score?: number;
  comment?: string;
  identityType?: 'user' | 'ip' | 'visitor';
}

export interface DetailViewsRequest {
  detailKey: string;
}

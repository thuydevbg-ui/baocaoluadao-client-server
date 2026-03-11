/**
 * API Client for Cloudflare Workers
 * 
 * This utility provides functions to call the API through Cloudflare Workers
 * instead of the Next.js server directly.
 * 
 * Usage:
 * - In production: calls https://api.baocaoluadao.com
 * - In development: calls /api (Next.js server)
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (
  process.env.NODE_ENV === 'production' 
    ? 'https://api.baocaoluadao.com' 
    : '/api'
);

const API_TIMEOUT = 30000; // 30 seconds

interface FetchOptions extends RequestInit {
  timeout?: number;
}

/**
 * Make API request with error handling
 */
async function fetchApi<T = unknown>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { timeout = API_TIMEOUT, ...fetchOptions } = options;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
    
    throw new Error('Unknown error occurred');
  }
}

// Report API
export const reportApi = {
  submit: (data: {
    type: string;
    target: string;
    description: string;
    reporterEmail?: string;
    reporterName?: string;
  }) => 
    fetchApi<{ success: boolean; reportId: string; status: string }>('/report', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Scan API
export const scanApi = {
  scan: (data: { url: string; domain?: string }) =>
    fetchApi<{
      success: boolean;
      domain: string;
      threatDetected: boolean;
      threatTypes: string[];
      riskScore: number;
    }>('/scan', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Scams API
export const scamsApi = {
  list: (params?: { page?: number; limit?: number; type?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.type) query.set('type', params.type);
    if (params?.search) query.set('search', params.search);
    
    const queryString = query.toString();
    return fetchApi<{
      success: boolean;
      data: unknown[];
      pagination: { page: number; limit: number; total: number };
    }>(`/scams${queryString ? `?${queryString}` : ''}`);
  },
};

// Categories API
export const categoriesApi = {
  list: () => 
    fetchApi<{ success: boolean; data: unknown[] }>('/categories'),
  
  search: (data: { category?: string; search?: string; page?: number; limit?: number }) =>
    fetchApi<{ success: boolean; data: unknown[]; pagination: unknown }>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Stats API
export const statsApi = {
  get: () => 
    fetchApi<{ success: boolean; total: number; lastUpdated: string }>('/stats'),
};

// Health API
export const healthApi = {
  check: () => 
    fetchApi<{ success: boolean; status: string }>('/health'),
};

// Policy Violation API
export const policyViolationApi = {
  lookup: (data: { url?: string; domain?: string }) =>
    fetchApi<{
      success: boolean;
      domain: string;
      found: boolean;
      violation: unknown;
    }>('/policy-violations/lookup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// SEO Health Check API
export const seoApi = {
  healthCheck: () => 
    fetchApi<{
      status: string;
      score: number;
      checks: unknown[];
      recommendations: string[];
    }>('/seo/health-check'),
};

// Public Settings API
export const settingsApi = {
  public: () => 
    fetchApi<{ success: boolean; siteName: string }>('/settings/public'),
};

// Detail Feedback API
export const feedbackApi = {
  submit: (data: {
    action: 'rate' | 'comment' | 'helpful';
    detailKey: string;
    score?: number;
    comment?: string;
    identityType?: 'user' | 'ip' | 'visitor';
  }) =>
    fetchApi<{ success: boolean }>('/detail-feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Detail Views API
export const viewsApi = {
  track: (detailKey: string) =>
    fetchApi<{ success: boolean; detailKey: string }>('/detail-views', {
      method: 'POST',
      body: JSON.stringify({ detailKey }),
    }),
};

// Risk Analysis API
export const riskApi = {
  analyze: (data: { type: 'website' | 'phone' | 'email'; value: string }) =>
    fetchApi<{
      success: boolean;
      type: string;
      value: string;
      riskLevel: string;
      riskScore: number;
    }>('/risk/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

const apiClient = {
  report: reportApi,
  scan: scanApi,
  scams: scamsApi,
  categories: categoriesApi,
  stats: statsApi,
  health: healthApi,
  policyViolation: policyViolationApi,
  seo: seoApi,
  settings: settingsApi,
  feedback: feedbackApi,
  views: viewsApi,
  risk: riskApi,
};

export default apiClient;

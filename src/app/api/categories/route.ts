import { NextRequest } from 'next/server';
import { fetchCategoryDirectory, type TinnhiemCategory } from '@/lib/dataSources/tinnhiemmang';
import { createSecureJsonResponse, isRequestFromSameOrigin, rateLimitRequest } from '@/lib/apiSecurity';

const VALID_CATEGORIES: TinnhiemCategory[] = ['organizations', 'websites', 'devices', 'systems', 'apps'];

function parseCategory(value: unknown): TinnhiemCategory {
  const category = typeof value === 'string' ? value : '';
  if (VALID_CATEGORIES.includes(category as TinnhiemCategory)) {
    return category as TinnhiemCategory;
  }
  return 'websites';
}

function parsePage(value: unknown): number {
  const page = typeof value === 'number' ? value : Number.parseInt(String(value ?? '1'), 10);
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.floor(page);
}

function parseQuery(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, 120);
}

export async function POST(request: NextRequest) {
  if (!isRequestFromSameOrigin(request)) {
    return createSecureJsonResponse({ success: false, error: 'Forbidden request origin', items: [] }, { status: 403 });
  }

  const rateLimit = rateLimitRequest(request, {
    keyPrefix: 'categories:post',
    windowMs: 60_000,
    maxRequests: 40,
  });
  if (!rateLimit.ok) {
    return createSecureJsonResponse({ success: false, error: 'Too many requests', items: [] }, { status: 429 }, rateLimit);
  }

  try {
    const payload = await request.json();
    const category = parseCategory(payload?.category);
    const page = parsePage(payload?.page);
    const query = parseQuery(payload?.query);

    const directory = await fetchCategoryDirectory(category, page, query);

    return createSecureJsonResponse({
      success: true,
      source: 'tinnhiemmang.vn',
      category,
      mode: directory.mode,
      page: directory.page,
      maxPage: directory.maxPage,
      total: directory.totalEstimate,
      query,
      items: directory.items,
    }, { status: 200 }, rateLimit);
  } catch (error) {
    console.error('Error fetching category data:', error);
    return createSecureJsonResponse(
      { success: false, error: 'Failed to fetch data', items: [] },
      { status: 500 },
      rateLimit
    );
  }
}

export async function GET(request: NextRequest) {
  if (!isRequestFromSameOrigin(request)) {
    return createSecureJsonResponse({ error: 'Forbidden request origin' }, { status: 403 });
  }
  const rateLimit = rateLimitRequest(request, {
    keyPrefix: 'categories:get',
    windowMs: 60_000,
    maxRequests: 60,
  });
  if (!rateLimit.ok) {
    return createSecureJsonResponse({ error: 'Too many requests' }, { status: 429 }, rateLimit);
  }

  return createSecureJsonResponse({
    message: 'Use POST to fetch category data',
    categories: VALID_CATEGORIES,
    example: {
      category: 'websites',
      page: 1,
    },
  }, { status: 200 }, rateLimit);
}

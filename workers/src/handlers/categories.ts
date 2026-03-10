/**
 * Categories handler
 * GET/POST /api/categories
 */

import { createJsonResponse, createErrorResponse, getCacheHeaders, parseQueryParams } from '../utils';
import type { Env } from '../types';
import type { Category } from '../types';

// Fallback categories (used if D1 is unavailable)
const FALLBACK_CATEGORIES: Category[] = [
  { name: 'Website lừa đảo', slug: 'website', count: 0, icon: 'globe', description: 'Các website giả mạo, lừa đảo trực tuyến' },
  { name: 'Tổ chức/Doanh nghiệp', slug: 'organization', count: 0, icon: 'building', description: 'Tổ chức, doanh nghiệp lừa đảo' },
  { name: 'Thiết bị điện tử', slug: 'device', count: 0, icon: 'smartphone', description: 'Thiết bị điện tử lừa đảo' },
  { name: 'Số điện thoại', slug: 'phone', count: 0, icon: 'phone', description: 'Số điện thoại lừa đảo' },
  { name: 'Email', slug: 'email', count: 0, icon: 'mail', description: 'Email lừa đảo' },
  { name: 'Mạng xã hội', slug: 'social', count: 0, icon: 'facebook', description: 'Tài khoản mạng xã hội lừa đảo' },
  { name: 'SMS', slug: 'sms', count: 0, icon: 'message', description: 'Tin nhắn SMS lừa đảo' },
  { name: 'Ngân hàng', slug: 'bank', count: 0, icon: 'credit-card', description: 'Tài khoản ngân hàng lừa đảo' },
];

// Map D1 category types to API slugs
const TYPE_TO_SLUG: Record<string, string> = {
  'website': 'website',
  'organization': 'organization',
  'device': 'device',
  'phone': 'phone',
  'email': 'email',
  'social': 'social',
  'sms': 'sms',
  'bank': 'bank',
  'application': 'device',
  'system': 'device',
};

export async function handleCategories(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const origin = request.headers.get('Origin');
  const url = new URL(request.url);
  const params = parseQueryParams(url);

  if (request.method === 'POST') {
    // Search/filter categories
    return handleCategoriesSearch(request, env, ctx, corsHeaders);
  }

  // GET - Return all categories with caching
  const cacheKey = 'categories:all';
  
  if (env.CACHE) {
    try {
      const cached = await env.CACHE.get(cacheKey);
      if (cached) {
        return createJsonResponse(JSON.parse(cached), 200, origin, {
          ...corsHeaders,
          ...getCacheHeaders(3600), // 1 hour cache
          'X-Cache': 'HIT',
        });
      }
    } catch (e) {
      // Continue to fetch
    }
  }

  // Try to fetch from D1
  let categories = FALLBACK_CATEGORIES;
  
  try {
    if (env.DB) {
      console.log('Querying D1 for categories...');
      const stmt = env.DB.prepare(`
        SELECT id, name, slug, type, description, icon, color, is_active, display_order
        FROM categories 
        WHERE is_active = 1 
        ORDER BY display_order ASC
      `);
      const results = await stmt.all();
      console.log('D1 results:', JSON.stringify(results));
      
      if (results.success && results.results && results.results.length > 0) {
        // Map D1 results to API format
        categories = results.results.map((row: any) => ({
          name: row.name,
          slug: TYPE_TO_SLUG[row.type] || row.slug || row.type,
          count: 0,
          icon: row.icon || 'globe',
          description: row.description || '',
        }));
        console.log('Mapped categories:', JSON.stringify(categories));
      } else {
        console.log('No categories found in D1, using fallback');
      }
    }
  } catch (error) {
    console.error('Error fetching categories from D1:', error);
    // Fall back to hardcoded categories
  }

  const response = {
    success: true,
    data: categories,
    lastUpdated: new Date().toISOString(),
  };

  // Cache the response
  if (env.CACHE) {
    ctx.waitUntil(env.CACHE.put(cacheKey, JSON.stringify(response), { expirationTtl: 3600 }));
  }

  return createJsonResponse(response, 200, origin, {
    ...corsHeaders,
    ...getCacheHeaders(3600),
  });
}

async function handleCategoriesSearch(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const origin = request.headers.get('Origin');

  try {
    const body = await request.json() as Record<string, any>;
    const category = typeof body.category === 'string' ? body.category : '';
    const search = typeof body.search === 'string' ? body.search : '';
    const page = parseInt(body.page || '1', 10);
    const limit = Math.min(parseInt(body.limit || '20', 10), 100);

    // Query from D1
    let data: any[] = [];
    let total = 0;

    try {
      if (env.DB) {
        let query = 'SELECT * FROM categories WHERE is_active = 1';
        const params: any[] = [];

        if (category) {
          query += ' AND (type = ? OR slug = ?)';
          params.push(category, category);
        }

        if (search) {
          query += ' AND (name LIKE ? OR description LIKE ?)';
          params.push(`%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY display_order ASC LIMIT ? OFFSET ?';
        params.push(limit, (page - 1) * limit);

        const stmt = env.DB.prepare(query);
        const results = await stmt.bind(...params).all();
        
        if (results.success && results.results) {
          data = results.results;
        }

        // Get total count
        let countQuery = 'SELECT COUNT(*) as count FROM categories WHERE is_active = 1';
        const countParams: any[] = [];

        if (category) {
          countQuery += ' AND (type = ? OR slug = ?)';
          countParams.push(category, category);
        }

        if (search) {
          countQuery += ' AND (name LIKE ? OR description LIKE ?)';
          countParams.push(`%${search}%`, `%${search}%`);
        }

        const countStmt = env.DB.prepare(countQuery);
        const countResult = await countStmt.bind(...countParams).first() as any;
        
        if (countResult && countResult.success && (countResult.results as any[])) {
          total = ((countResult.results as any[])[0] as any)?.count || 0;
        }
      }
    } catch (error) {
      console.error('Error searching categories in D1:', error);
    }

    const response = {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    return createJsonResponse(response, 200, origin, corsHeaders);

  } catch (error) {
    if (error instanceof SyntaxError) {
      return createErrorResponse('Invalid JSON body', 400, origin, corsHeaders);
    }
    throw error;
  }
}

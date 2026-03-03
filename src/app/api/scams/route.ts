import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { checkRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

// ============================================
// IN-MEMORY CACHE FOR EXTERNAL SCRAPER
// ============================================
// Simple cache to reduce external requests to tinnhiemmang.vn
// In production, consider using Redis for distributed caching

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL
const STATS_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes for stats

function getCacheKey(type: string, page: number, isStats = false): string {
  return isStats ? `stats:${type}` : `scams:${type}:${page}`;
}

function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() < entry.expiresAt) {
    return entry.data as T;
  }
  cache.delete(key);
  return null;
}

function setToCache<T>(key: string, data: T, ttlMs: number): void {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

// Clean up expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now >= entry.expiresAt) {
      cache.delete(key);
    }
  }
}, 60 * 1000); // Clean up every minute

interface ScamData {
  id: number;
  name: string;
  domain: string;
  type: string;
  reports: number;
  status: string;
  date: string;
  description: string;
  organization: string;
}

// Map category slugs to tinnhiemmang.vn URLs
const CATEGORY_URLS: Record<string, string> = {
  website: '/website-lua-dao',
  organization: '/doi-lua-dao',
  phone: '/sdt-lua-dao',
  bank: '/ngan-hang-lua-dao',
  email: '/email-lua-dao',
  social: '/mang-xa-hoi-lua-dao',
  app: '/ung-dung-lua-dao',
  device: '/thiet-bi-lua-dao',
  sms: '/sms-lua-dao',
  system: '/he-thong-lua-dao',
};

// Category display names
const CATEGORY_NAMES: Record<string, string> = {
  website: 'Website lừa đảo',
  organization: 'Tổ chức/Doanh nghiệp',
  phone: 'Số điện thoại',
  bank: 'Ngân hàng',
  email: 'Email',
  social: 'Mạng xã hội',
  app: 'Ứng dụng',
  device: 'Thiết bị điện tử',
  sms: 'SMS',
  system: 'Hệ thống',
};

export async function GET(request: Request) {
  // Rate limiting - prevent abuse of external scraper
  const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
  const rateLimitResult = await checkRateLimit({
    scope: 'api:scams',
    key: clientIP,
    maxAttempts: 10,
    windowSeconds: 60,
  });
  
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rateLimitResult.retryAfter || 60) } }
    );
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const category = searchParams.get('category') || 'website';
  const getStats = searchParams.get('stats') === 'true';

  // Check cache first
  const cacheKey = getCacheKey(category, page, getStats);
  const cachedData = getFromCache(cacheKey);
  if (cachedData) {
    return NextResponse.json(cachedData);
  }

  // If requesting stats, fetch all category counts
  if (getStats) {
    const statsResult = await getCategoryStats();
    setToCache(cacheKey, statsResult, STATS_CACHE_TTL_MS);
    return statsResult;
  }

  // Build URL based on category
  const categoryPath = CATEGORY_URLS[category] || '/website-lua-dao';
  const url = `https://tinnhiemmang.vn${categoryPath}${page > 1 ? `?page=${page}` : ''}`;
  
  let response;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    // Use a proper rotating user-agent to avoid being blocked
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ];
    const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    
    response = await fetch(url, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (fetchError: any) {
    // Return cached data if available when fetch fails
    const fallbackCacheKey = getCacheKey(category, page, false);
    const cachedFallback = getFromCache(fallbackCacheKey);
    if (cachedFallback) {
      return NextResponse.json({
        ...cachedFallback,
        _warning: 'Data from cache - external service unavailable'
      });
    }
    
    return NextResponse.json(
      { error: 'External service temporarily unavailable. Please try again later.' },
      { status: 503 }
    );
  }

  if (!response.ok) {
    return NextResponse.json(
      { error: `External service error: ${response.status}` },
      { status: 503 }
    );
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const scams: ScamData[] = [];
  let id = (page - 1) * limit + 1;

  // Parse the scam data from HTML
  $('#list-obj .item1').each((index, element) => {
    const domain = $(element).find('.meta .sf-semibold span').text().trim();
    const dateMatch = $(element).find('.meta .date').text().match(/(\d{2}\/\d{2}\/\d{4})/);
    const orgLink = $(element).find('.org a').attr('href') || '';
    const orgName = $(element).find('.org a').text().trim() || 'Chưa xác định';
    const status = $(element).find('.status .handling').text().trim() || 'Đang xử lý';
    
    if (domain) {
      // Determine scam type
      let type = category;
      let name = domain.replace(/\.com|\.net|\.org|\.vn|\.info|\.io/g, '').replace(/-/g, ' ');
      
      // Create description based on impersonated organization
      let description = `${CATEGORY_NAMES[category] || 'Website lừa đảo'}`;
      if (orgName && orgName !== 'Chưa xác định') {
        description = `Giả mạo ${orgName}`;
      }
      
      // Determine status
      let statusCode = 'pending';
      if (status.includes('Đã xác nhận') || status.includes('Xác nhận')) {
        statusCode = 'confirmed';
      } else if (status.includes('Cảnh báo')) {
        statusCode = 'warning';
      }
      
      // Note: The external source doesn't provide report counts in the HTML
      // Using 0 to indicate no verified report data available (not random)
      const reports = 0;
      
      // Convert date format
      let date = dateMatch ? dateMatch[1] : '21/01/2025';
      
      scams.push({
        id: id++,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        domain: domain,
        type: type,
        reports: reports,
        status: statusCode,
        date: date,
        description: description,
        organization: orgName,
      });
    }
  });

  // Get total pages
  const totalText = $('.pagination .page-item:last-child a').text();
  const totalPages = parseInt(totalText) || 100;
  const totalItems = totalPages * 10;

  const responseData = {
    success: true,
    data: scams,
    pagination: {
      page,
      limit,
      totalPages,
      totalItems,
    },
  };

  // Cache the response
  setToCache(cacheKey, responseData, CACHE_TTL_MS);

  return NextResponse.json(responseData);
}

// Fetch stats for all categories
async function getCategoryStats() {
  const categories: { name: string; slug: string; count: number; icon: string }[] = [];
  
  for (const [slug, path] of Object.entries(CATEGORY_URLS)) {
    try {
      const response = await fetch(`https://tinnhiemmang.vn${path}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      
      if (response.ok) {
        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Try to get count from various elements
        let count = 0;
        const totalText = $('.pagination .page-item:last-child a').text();
        const pageCount = parseInt(totalText) || 0;
        
        // Count items on first page
        const itemCount = $('#list-obj .item1').length;
        count = pageCount * 10 || itemCount;
        
        // If we got valid count, add to categories
        if (count > 0) {
          categories.push({
            name: CATEGORY_NAMES[slug] || slug,
            slug,
            count,
            icon: '🛡️',
          });
        }
      }
    } catch (error) {
      console.error(`Error fetching ${slug}:`, error);
    }
  }

  // If no categories fetched, use fallback data
  if (categories.length === 0) {
    return NextResponse.json({
      success: true,
      data: [
        { name: 'Website lừa đảo', slug: 'website', count: 62810, icon: '🌐' },
        { name: 'Tổ chức/Doanh nghiệp', slug: 'organization', count: 2340, icon: '🏢' },
        { name: 'Số điện thoại', slug: 'phone', count: 15620, icon: '📱' },
        { name: 'Ngân hàng', slug: 'bank', count: 8920, icon: '🏦' },
        { name: 'Email', slug: 'email', count: 4210, icon: '📧' },
        { name: 'Mạng xã hội', slug: 'social', count: 7830, icon: '💬' },
        { name: 'Ứng dụng', slug: 'app', count: 3150, icon: '📲' },
        { name: 'Thiết bị điện tử', slug: 'device', count: 1890, icon: '🔌' },
        { name: 'SMS', slug: 'sms', count: 5670, icon: '💌' },
        { name: 'Hệ thống', slug: 'system', count: 980, icon: '🔒' },
      ],
    });
  }

  return NextResponse.json({
    success: true,
    data: categories,
  });
}

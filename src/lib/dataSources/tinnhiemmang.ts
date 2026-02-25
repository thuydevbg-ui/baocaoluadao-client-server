export type TinnhiemCategory = 'organizations' | 'websites' | 'devices' | 'systems' | 'apps';
export type TinnhiemMode = 'scam' | 'trusted';

export interface TinnhiemDirectoryItem {
  id: string;
  name: string;
  type: TinnhiemCategory;
  description: string;
  icon?: string;
  organization_icon?: string;
  organization?: string;
  count_report?: string;
  status?: string;
  created_at?: string;
  link?: string;
}

export interface TinnhiemDirectoryResult {
  category: TinnhiemCategory;
  mode: TinnhiemMode;
  page: number;
  maxPage: number;
  totalEstimate: number;
  items: TinnhiemDirectoryItem[];
}

interface CategoryConfig {
  path: string;
  mode: TinnhiemMode;
}

const BASE_URL = 'https://tinnhiemmang.vn';

// SSRF Protection: Whitelist of allowed domains
// This prevents attacks that try to access internal/private networks
const ALLOWED_DOMAINS = [
  'tinnhiemmang.vn',
  'www.tinnhiemmang.vn',
];

// Block internal/private IP ranges and localhost
const BLOCKED_IP_PATTERNS = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^0\.\d+\.\d+\.\d+$/,
  /^::1$/,
  /^fe80:/i,
];

/**
 * Validate that a URL's hostname is in the allowed domains list
 * and not a private/internal IP address
 */
function isUrlAllowed(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase();

    // Check if hostname is an IP address (block all IP accesses)
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipPattern.test(hostname)) {
      return false;
    }

    // Check against blocked IP patterns (IPv6, etc.)
    if (BLOCKED_IP_PATTERNS.some(pattern => pattern.test(hostname))) {
      return false;
    }

    // Check if hostname is in allowed domains
    return ALLOWED_DOMAINS.some(allowed =>
      hostname === allowed || hostname.endsWith('.' + allowed)
    );
  } catch {
    return false;
  }
}

const CATEGORY_CONFIG: Record<TinnhiemCategory, CategoryConfig> = {
  websites: { path: '/website-lua-dao', mode: 'scam' },
  organizations: { path: '/to-chuc-tin-nhiem', mode: 'trusted' },
  devices: { path: '/thiet-bi-tin-nhiem', mode: 'trusted' },
  systems: { path: '/he-thong-tin-nhiem', mode: 'trusted' },
  apps: { path: '/ung-dung-tin-nhiem', mode: 'trusted' },
};

const REQUEST_HEADERS: HeadersInit = {
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
};

function cleanText(input: string): string {
  return input
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x2F;/gi, '/')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toAbsoluteUrl(maybeUrl: string): string {
  if (!maybeUrl) return '';
  if (maybeUrl.startsWith('http://') || maybeUrl.startsWith('https://')) return maybeUrl;
  return `${BASE_URL}${maybeUrl.startsWith('/') ? maybeUrl : `/${maybeUrl}`}`;
}

function normalizeHost(input: string): string {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return '';

  let host = trimmed;
  if (host.startsWith('http://') || host.startsWith('https://')) {
    try {
      host = new URL(host).hostname.toLowerCase();
    } catch {
      // Keep best-effort parsing below.
    }
  }

  host = host.replace(/^www\./, '').split('/')[0].split('?')[0].split('#')[0];
  return host;
}

function extractDomainFromText(input: string): string {
  const normalized = normalizeHost(input);
  const domainMatch = normalized.match(
    /[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+/i
  );
  return domainMatch ? domainMatch[0].toLowerCase() : '';
}

function normalizeForMatch(input: string): string {
  return cleanText(input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0111/g, 'd')
    .replace(/\u0110/g, 'D')
    .toLowerCase();
}

function extractListSection(html: string): string {
  const listMatch = html.match(
    /<div id="list-obj">[\s\S]*?<ul>([\s\S]*)<\/ul>\s*(?=<div id="pagination"|<\/div>\s*<\/div>)/i
  );
  if (listMatch) return listMatch[1];

  // /filterObj responses may return only canonical + <ul>...</ul> without #list-obj
  const filterObjMatch = html.match(/<link rel="canonical"[\s\S]*?<ul>([\s\S]*?)<\/ul>/i);
  if (filterObjMatch) return filterObjMatch[1];

  // Last fallback: find the first <ul> that contains item rows
  const genericMatch = html.match(/<ul>([\s\S]*?<li[^>]*class="[^"]*\bitem\d*\b[^"]*"[\s\S]*?)<\/ul>/i);
  if (genericMatch) return genericMatch[1];

  return '';
}

function extractPaginationSection(html: string): string {
  const match = html.match(/<div id="pagination"[\s\S]*?<\/div>\s*<\/div>/i);
  return match ? match[0] : '';
}

function extractMaxPage(html: string): number {
  const pagination = extractPaginationSection(html);
  if (!pagination) return 1;

  let maxPage = 1;
  const pageRegex = /[?&]page=(\d+)/g;
  let pageMatch: RegExpExecArray | null;
  while ((pageMatch = pageRegex.exec(pagination)) !== null) {
    const value = Number.parseInt(pageMatch[1], 10);
    if (Number.isFinite(value) && value > maxPage) {
      maxPage = value;
    }
  }
  return maxPage;
}

function extractItemBlocks(listSection: string): string[] {
  if (!listSection) return [];
  const blocks: string[] = [];
  const regex = /<li[^>]*class="[^"]*\bitem\d*\b[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(listSection)) !== null) {
    blocks.push(match[1]);
  }
  return blocks;
}

function parseDate(rawDate: string): string {
  const text = cleanText(rawDate);
  const dateMatch = text.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
  return dateMatch ? dateMatch[1] : text;
}

function parseItemBlock(
  block: string,
  category: TinnhiemCategory,
  mode: TinnhiemMode,
  index: number
): TinnhiemDirectoryItem | null {
  const compact = block.replace(/\r?\n/g, ' ');
  const normalizedCompact = normalizeForMatch(compact);
  const allImageSources = Array.from(compact.matchAll(/<img[^>]+src="([^"]+)"/gi))
    .map((match) => toAbsoluteUrl(match[1]))
    .filter(Boolean);

  const nameRaw =
    compact.match(/class="[^"]*webkit-box-2[^"]*"[^>]*>\s*([^<]+?)\s*<\/span>/i)?.[1] ||
    compact.match(/class="[^"]*webkit-box-1[^"]*"[^>]*>\s*<span[^>]*>\s*([^<]+?)\s*<\/span>/i)?.[1] ||
    compact.match(/class="sf-semibold[^"]*"[^>]*>\s*<span[^>]*>\s*([^<]+?)\s*<\/span>/i)?.[1] ||
    compact.match(/<a[^>]*class="[^"]*(?:sf-semibold|webkit-box-2|name_obj|name)[^"]*"[^>]*>\s*([^<]+?)\s*<\/a>/i)?.[1] ||
    compact.match(/<a[^>]*>\s*([a-z0-9][a-z0-9.-]+\.[a-z]{2,})\s*<\/a>/i)?.[1] ||
    '';
  const domainCandidates = (cleanText(compact).match(/[a-z0-9][a-z0-9.-]+\.[a-z]{2,}/gi) || [])
    .map((candidate) => candidate.toLowerCase())
    .filter((candidate) => !candidate.endsWith('tinnhiemmang.vn'));
  const fallbackName = cleanText(nameRaw) || domainCandidates[0] || '';
  if (!fallbackName) return null;

  const normalizedDomain = extractDomainFromText(fallbackName);
  const displayName = mode === 'scam' && normalizedDomain ? normalizedDomain : fallbackName;

  const dateRaw = compact.match(/class="date[^"]*"[^>]*>\s*([^<]+?)\s*<\/div>/i)?.[1] || '';
  const createdAt = parseDate(dateRaw);

  const orgRaw =
    compact.match(/class="hidden-lg-down[^"]*org[^"]*"[\s\S]*?<a[^>]*>\s*([^<]+?)\s*<\/a>/i)?.[1] ||
    compact.match(/class="[^"]*(?:name_org|obj_org|org-name)[^"]*"[^>]*>\s*([^<]+?)\s*<\/(?:a|span|div)>/i)?.[1] ||
    compact.match(/<label[^>]*>[^<]*(?:Mạo danh|Sở hữu)[^<]*<\/label>\s*([^<]+?)</i)?.[1] ||
    '';
  const organization = cleanText(orgRaw);

  const iconRaw =
    compact.match(/class="icon[23][^"]*"[\s\S]*?<img src="([^"]+)"/i)?.[1] ||
    compact.match(/<img src="([^"]+)"[^>]*alt="logo"/i)?.[1] ||
    '';
  const icon = toAbsoluteUrl(iconRaw) || allImageSources[0] || '';

  const organizationIconRaw =
    compact.match(/class="[^"]*(?:name_org|obj_org|org)[^"]*"[\s\S]*?<img[^>]+src="([^"]+)"/i)?.[1] ||
    compact.match(/(?:Mạo danh|Sở hữu)[\s\S]*?<img[^>]+src="([^"]+)"/i)?.[1] ||
    '';
  const organizationIcon = toAbsoluteUrl(organizationIconRaw) || allImageSources.find((src) => src !== icon) || '';

  const detailLinkRaw =
    compact.match(/<a href="([^"]+)"[^>]*class="sf-semibold/i)?.[1] ||
    compact.match(/<a href="([^"]+)"/i)?.[1] ||
    '';
  const link = toAbsoluteUrl(detailLinkRaw);

  const reportMatch = normalizedCompact.match(/(\d+)\s*bao cao/);
  const countReport = reportMatch ? reportMatch[1] : '0';

  const status = mode === 'scam'
    ? (normalizedCompact.includes('da xac nhan') || normalizedCompact.includes('da xu ly'))
      ? 'confirmed'
      : (normalizedCompact.includes('dang xu ly') || normalizedCompact.includes('chua xac dinh'))
        ? 'suspected'
        : 'suspected'
    : 'trusted';

  const description = mode === 'scam'
    ? organization
      ? `Mạo danh: ${organization}${createdAt ? ` - Phát hiện ngày ${createdAt}` : ''}`
      : createdAt
        ? `Phát hiện ngày ${createdAt}`
        : 'Phát hiện trong cơ sở dữ liệu cảnh báo của tinnhiemmang.vn'
    : organization
      ? `Sở hữu bởi: ${organization}`
      : createdAt
        ? `Thông tin xác minh ngày ${createdAt}`
        : 'Mục xác minh từ tinnhiemmang.vn';

  const idBase = `${displayName}-${createdAt || status || index}`;

  return {
    id: idBase.replace(/\s+/g, '-').toLowerCase(),
    name: displayName,
    type: category,
    description,
    icon,
    organization_icon: organizationIcon,
    organization,
    count_report: countReport,
    status,
    created_at: createdAt || '',
    link,
  };
}

function parseDirectoryHtml(html: string, category: TinnhiemCategory, mode: TinnhiemMode): TinnhiemDirectoryItem[] {
  const listSection = extractListSection(html);
  if (!listSection) {
    return [];
  }

  const blocks = extractItemBlocks(listSection);
  const items: TinnhiemDirectoryItem[] = [];

  blocks.forEach((block, index) => {
    const parsed = parseItemBlock(block, category, mode, index);
    if (parsed) items.push(parsed);
  });

  return items;
}

const FETCH_TIMEOUT_MS = 10000; // 10 seconds timeout
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

// Simple in-memory cache
const htmlCache = new Map<string, { html: string; timestamp: number }>();

function getCachedHtml(url: string): string | null {
  const cached = htmlCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.html;
  }
  htmlCache.delete(url);
  return null;
}

function setCachedHtml(url: string, html: string): void {
  // Limit cache size
  if (htmlCache.size >= 100) {
    const oldestKey = htmlCache.keys().next().value;
    if (oldestKey) htmlCache.delete(oldestKey);
  }
  htmlCache.set(url, { html, timestamp: Date.now() });
}

async function fetchHtml(url: string): Promise<string> {
  // SSRF Protection: Validate URL is allowed before fetching
  if (!isUrlAllowed(url)) {
    throw new Error(`URL not allowed for security reasons: ${url}`);
  }

  // Check cache first
  const cachedHtml = getCachedHtml(url);
  if (cachedHtml) {
    return cachedHtml;
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: REQUEST_HEADERS,
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}. Status: ${response.status}`);
    }

    // Validate content-type to ensure we get HTML
    const contentType = response.headers.get('content-type');
    if (!contentType || (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml'))) {
      throw new Error(`Unexpected content-type for ${url}: ${contentType}`);
    }

    const html = await response.text();
    
    // Cache the result
    setCachedHtml(url, html);
    
    return html;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request to ${url} timed out after ${FETCH_TIMEOUT_MS}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function getTinnhiemCategoryConfig(category: TinnhiemCategory): CategoryConfig {
  return CATEGORY_CONFIG[category];
}

export async function fetchCategoryDirectory(
  category: TinnhiemCategory,
  page: number = 1
): Promise<TinnhiemDirectoryResult> {
  const config = CATEGORY_CONFIG[category];
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const pageSuffix = safePage > 1 ? `?page=${safePage}` : '';
  const firstTryUrl = `${BASE_URL}${config.path}${pageSuffix}`;

  let html = await fetchHtml(firstTryUrl);
  let items = parseDirectoryHtml(html, category, config.mode);

  // Some pages return an anti-bot/interstitial-like response when forcing ?page.
  // Fallback to page 1 to ensure we still return useful data.
  if (safePage > 1 && items.length === 0) {
    html = await fetchHtml(`${BASE_URL}${config.path}`);
    items = parseDirectoryHtml(html, category, config.mode);
  }

  const maxPage = extractMaxPage(html);
  const perPage = items.length;
  const totalEstimate = maxPage > 1 && perPage > 0 ? maxPage * perPage : perPage;

  return {
    category,
    mode: config.mode,
    page: safePage,
    maxPage,
    totalEstimate,
    items,
  };
}

async function fetchScamLookupHtml(domain: string): Promise<string> {
  const entryHtml = await fetchHtml(`${BASE_URL}/website-lua-dao`);
  const tokenMatch = entryHtml.match(/name="_token"\s+value="([^"]+)"/i);
  const csrfToken = tokenMatch ? tokenMatch[1] : '';

  if (!csrfToken) {
    throw new Error('Unable to extract CSRF token from tinnhiemmang.vn');
  }

  const params = new URLSearchParams();
  params.set('_token', csrfToken);
  params.set('name_obj', domain);
  params.set('type', 'fake');
  params.append('fakeType[]', 'web');

  const extractHtmlPayload = (payload: string): string => {
    const trimmed = payload.trim();
    if (!trimmed) return '';
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return trimmed;

    const findHtmlString = (input: unknown): string => {
      if (typeof input === 'string') {
        return /<(ul|li|div|a)\b/i.test(input) ? input : '';
      }
      if (Array.isArray(input)) {
        for (const value of input) {
          const found = findHtmlString(value);
          if (found) return found;
        }
        return '';
      }
      if (input && typeof input === 'object') {
        for (const value of Object.values(input as Record<string, unknown>)) {
          const found = findHtmlString(value);
          if (found) return found;
        }
      }
      return '';
    };

    try {
      const parsed = JSON.parse(trimmed);
      return findHtmlString(parsed) || trimmed;
    } catch {
      return trimmed;
    }
  };

  const postResponse = await fetch(`${BASE_URL}/filterObj`, {
    method: 'POST',
    headers: {
      ...REQUEST_HEADERS,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': `${BASE_URL}/website-lua-dao`,
      'Origin': BASE_URL,
    },
    body: params.toString(),
    cache: 'no-store',
  });

  if (postResponse.ok) {
    const postHtml = extractHtmlPayload(await postResponse.text());
    if (postHtml.includes('<li') || postHtml.includes('item')) {
      return postHtml;
    }
  }

  const url = `${BASE_URL}/filterObj?${params.toString()}`;
  const response = await fetch(url, {
    headers: {
      ...REQUEST_HEADERS,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': `${BASE_URL}/website-lua-dao`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Lookup request failed with status ${response.status}`);
  }

  return extractHtmlPayload(await response.text());
}

export async function findScamWebsiteByDomain(domain: string): Promise<TinnhiemDirectoryItem | null> {
  const normalizedTarget = extractDomainFromText(domain);
  if (!normalizedTarget) return null;

  const isExactDomain = (item: TinnhiemDirectoryItem): boolean => {
    const nameDomain = extractDomainFromText(item.name);
    const linkDomain = extractDomainFromText(item.link || '');
    
    // Exact match
    if (nameDomain === normalizedTarget || linkDomain === normalizedTarget) {
      return true;
    }
    
    // Subdomain matching: check if the target domain is a subdomain of the item domain
    // e.g., fake-shopee.com.vn should match shopee.com.vn
    const isSubdomain = (target: string, base: string): boolean => {
      if (target === base) return false; // Already checked exact match
      return target.endsWith('.' + base);
    };
    
    if (isSubdomain(normalizedTarget, nameDomain) || isSubdomain(normalizedTarget, linkDomain)) {
      return true;
    }
    
    // Also check reverse: if item is subdomain of target
    // e.g., shopee.com.vn should match if user searches for fake-shopee.com.vn
    if (isSubdomain(nameDomain, normalizedTarget) || isSubdomain(linkDomain, normalizedTarget)) {
      return true;
    }
    
    return false;
  };

  try {
    const html = await fetchScamLookupHtml(normalizedTarget);
    const items = parseDirectoryHtml(html, 'websites', 'scam');
    const exactMatch = items.find(isExactDomain);
    if (exactMatch) return exactMatch;
  } catch {
    // Continue with paginated fallback below.
  }

  try {
    const firstPage = await fetchCategoryDirectory('websites', 1);
    const firstHit = firstPage.items.find(isExactDomain);
    if (firstHit) return firstHit;

    const pageLimit = Math.min(Math.max(firstPage.maxPage, 1), 100);
    for (let page = 2; page <= pageLimit; page += 1) {
      const pageResult = await fetchCategoryDirectory('websites', page);
      const hit = pageResult.items.find(isExactDomain);
      if (hit) return hit;
    }
  } catch {
    // Ignore and return null if everything fails.
  }

  return null;
}

export function normalizeDomainInput(urlOrDomain: string): string {
  if (!urlOrDomain || typeof urlOrDomain !== 'string') return '';
  const trimmed = urlOrDomain.trim();
  if (!trimmed) return '';

  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    return extractDomainFromText(parsed.hostname);
  } catch {
    return extractDomainFromText(trimmed);
  }
}

import * as cheerio from 'cheerio';
import { RowDataPacket } from 'mysql2/promise';
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { getDb } from '@/lib/db';

type ScamType =
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

type SyncCategorySlug = 
  // Scam categories
  | 'website-scam' | 'organization-scam' | 'phone-scam' | 'bank-scam' | 'email-scam' 
  | 'social-scam' | 'app-scam' | 'device-scam' | 'sms-scam' | 'system-scam'
  // Trusted categories
  | 'website-trusted' | 'organization-trusted' | 'app-trusted' | 'device-trusted' | 'system-trusted';

interface SyncCategoryConfig {
  slug: SyncCategorySlug;
  dbType: ScamType;
  path: string;
  label: string;
}

interface ScrapedScamItem {
  value: string;
  statusText: string;
  organization: string;
  organizationIcon: string | null;
  description: string;
  reportCount: number;
  createdAt: string | null;
  sourceUrl: string;
  icon: string | null;
  isScam: boolean;
}

interface SyncStateRow extends RowDataPacket {
  source: string;
  last_sync_started_at: string | null;
  last_sync_completed_at: string | null;
  last_success_at: string | null;
  last_error: string | null;
  pages_synced: number;
  records_synced: number;
}

interface CountRow extends RowDataPacket {
  count: number;
}

interface LocalWebsiteScamRow extends RowDataPacket {
  value: string;
  description: string;
  reportCount: number;
  status: 'active' | 'investigating' | 'blocked';
  externalStatus: string | null;
  organizationName: string | null;
  sourceUrl: string | null;
  externalCreatedAt: string | null;
}

interface SyncSummary {
  source: string;
  startedAt: string;
  completedAt: string;
  pagesSynced: number;
  recordsSynced: number;
  categories: Array<{ slug: SyncCategorySlug; pages: number; records: number }>;
}

interface EnsureSyncResult {
  source: string;
  totalRecords: number;
  syncing: boolean;
  lastSuccessAt: string | null;
  lastError: string | null;
}

interface IconBackfillTargetRow extends RowDataPacket {
  external_hash: string;
  icon: string | null;
  organization_icon: string | null;
  external_category: string | null;
}

interface IconBackfillStatusRow extends RowDataPacket {
  icon: string | null;
  organization_icon: string | null;
}

interface IconBackfillSummary {
  source: string;
  startedAt: string;
  completedAt: string;
  totalTargets: number;
  resolvedTargets: number;
  remainingTargets: number;
  scannedPages: number;
  updatedRows: number;
  categoriesScanned: string[];
}

const SOURCE_NAME = 'tinnhiemmang.vn';
const BASE_URL = 'https://tinnhiemmang.vn';

const CATEGORY_CONFIGS: SyncCategoryConfig[] = [
  // Danh sách lừa đảo (scam)
  { slug: 'website-scam', dbType: 'website', path: '/website-lua-dao', label: 'Website lừa đảo' },
  { slug: 'organization-scam', dbType: 'organization', path: '/doi-lua-dao', label: 'Tổ chức lừa đảo' },
  { slug: 'phone-scam', dbType: 'phone', path: '/sdt-lua-dao', label: 'Số điện thoại lừa đảo' },
  { slug: 'bank-scam', dbType: 'bank', path: '/ngan-hang-lua-dao', label: 'Ngân hàng lừa đảo' },
  { slug: 'email-scam', dbType: 'email', path: '/email-lua-dao', label: 'Email lừa đảo' },
  { slug: 'social-scam', dbType: 'social', path: '/mang-xa-hoi-lua-dao', label: 'Mạng xã hội lừa đảo' },
  { slug: 'app-scam', dbType: 'application', path: '/ung-dung-lua-dao', label: 'Ứng dụng lừa đảo' },
  { slug: 'device-scam', dbType: 'device', path: '/thiet-bi-lua-dao', label: 'Thiết bị lừa đảo' },
  { slug: 'sms-scam', dbType: 'sms', path: '/sms-lua-dao', label: 'SMS lừa đảo' },
  { slug: 'system-scam', dbType: 'system', path: '/he-thong-lua-dao', label: 'Hệ thống lừa đảo' },
  // Danh bạ tin nhiệm (trusted)
  { slug: 'website-trusted', dbType: 'website', path: '/website-tin-nhiem', label: 'Website tin nhiệm' },
  { slug: 'organization-trusted', dbType: 'organization', path: '/to-chuc-tin-nhiem', label: 'Tổ chức tin nhiệm' },
  { slug: 'app-trusted', dbType: 'application', path: '/ung-dung-tin-nhiem', label: 'Ứng dụng tin nhiệm' },
  { slug: 'device-trusted', dbType: 'device', path: '/thiet-bi-tin-nhiem', label: 'Thiết bị tin nhiệm' },
  { slug: 'system-trusted', dbType: 'system', path: '/he-thong-tin-nhiem', label: 'Hệ thống tin nhiệm' },
];

const CATEGORY_NAME_MAP: Record<ScamType, string> = {
  website: 'Website lừa đảo',
  organization: 'Tổ chức/Doanh nghiệp',
  phone: 'Số điện thoại',
  bank: 'Ngân hàng',
  email: 'Email',
  social: 'Mạng xã hội',
  application: 'Ứng dụng',
  device: 'Thiết bị điện tử',
  sms: 'SMS',
  system: 'Hệ thống',
};

const CATEGORY_SLUG_MAP: Record<ScamType, string> = {
  website: 'website',
  organization: 'organization',
  phone: 'phone',
  bank: 'bank',
  email: 'email',
  social: 'social',
  application: 'app',
  device: 'device',
  sms: 'sms',
  system: 'system',
};

const FETCH_TIMEOUT_MS = 15_000;
const AUTO_SYNC_HOURS = Number.parseInt(process.env.TINNHIEM_AUTO_SYNC_HOURS || '6', 10) || 6;
const AUTO_SYNC_INTERVAL_MS = Math.max(30, AUTO_SYNC_HOURS) * 60 * 60 * 1000;
const MAX_PAGES_PER_CATEGORY = Math.max(
  1,
  Number.parseInt(process.env.TINNHIEM_MAX_PAGES_PER_CATEGORY || '10000', 10) || 10000
);
const SYNC_CONCURRENCY = Math.max(
  1,
  Math.min(12, Number.parseInt(process.env.TINNHIEM_SYNC_CONCURRENCY || '6', 10) || 6)
);
const ICON_BACKFILL_LIMIT_DEFAULT = Math.max(
  50,
  Math.min(5000, Number.parseInt(process.env.TINNHIEM_ICON_BACKFILL_LIMIT || '500', 10) || 500)
);
const ICON_BACKFILL_LIMIT_MAX = 5000;
const ICON_STORAGE_DIR = path.join(process.cwd(), 'public', 'uploads', 'tinnhiem-icons');
const ICON_PUBLIC_PREFIX = '/uploads/tinnhiem-icons/';
const ICON_DOWNLOAD_TIMEOUT_MS = 10_000;

let syncInFlight: Promise<SyncSummary> | null = null;
let iconBackfillInFlight: Promise<IconBackfillSummary> | null = null;
let lastEnsureCheckAt = 0;
let lastEnsureSnapshot: EnsureSyncResult | null = null;
let lastIconBackfillSummary: IconBackfillSummary | null = null;
const iconLocalizePromiseByUrl = new Map<string, Promise<string | null>>();

function getRandomUserAgent(): string {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)] || userAgents[0];
}

function cleanText(input: string): string {
  return (input || '').replace(/\s+/g, ' ').trim();
}

function resolveImageUrl(raw?: string | null): string | null {
  if (!raw) return null;

  // Srcset: take the first URL before whitespace/descriptor
  const primary = (raw.split(',')[0] || raw).trim();
  const src = primary.includes(' ') ? primary.split(/\s+/)[0] : primary;

  if (!src) return null;
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  if (src.startsWith('//')) return `https:${src}`;

  // Handle relative paths coming from tinnhiemmang.vn
  return `${BASE_URL}${src.startsWith('/') ? '' : '/'}${src}`;
}

function isLocalIconUrl(value: string | null | undefined): boolean {
  const normalized = cleanText(value || '');
  return normalized.startsWith(ICON_PUBLIC_PREFIX);
}

function inferIconExtension(url: string, contentType: string | null): string {
  const byContentType = (contentType || '').toLowerCase();
  if (byContentType.includes('image/svg')) return 'svg';
  if (byContentType.includes('image/webp')) return 'webp';
  if (byContentType.includes('image/jpeg')) return 'jpg';
  if (byContentType.includes('image/png')) return 'png';
  if (byContentType.includes('image/gif')) return 'gif';
  if (byContentType.includes('image/x-icon') || byContentType.includes('image/vnd.microsoft.icon')) return 'ico';

  try {
    const pathname = new URL(url).pathname.toLowerCase();
    const ext = pathname.split('.').pop() || '';
    if (['svg', 'webp', 'jpg', 'jpeg', 'png', 'gif', 'ico'].includes(ext)) {
      return ext === 'jpeg' ? 'jpg' : ext;
    }
  } catch {
    // Ignore malformed URL and fallback to png.
  }

  return 'png';
}

async function localizeIconToPublic(url: string | null | undefined): Promise<string | null> {
  const remoteUrl = cleanText(url || '');
  if (!remoteUrl) return null;
  if (isLocalIconUrl(remoteUrl)) return remoteUrl;
  if (!/^https?:\/\//i.test(remoteUrl)) return remoteUrl;

  const existing = iconLocalizePromiseByUrl.get(remoteUrl);
  if (existing) {
    return existing;
  }

  const promise = (async (): Promise<string | null> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ICON_DOWNLOAD_TIMEOUT_MS);

    try {
      const response = await fetch(remoteUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': getRandomUserAgent(),
          Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          Referer: BASE_URL,
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        return remoteUrl;
      }

      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.toLowerCase().startsWith('image/')) {
        return remoteUrl;
      }

      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length === 0) {
        return remoteUrl;
      }

      const ext = inferIconExtension(remoteUrl, contentType);
      const filename = `${createHash('sha1').update(remoteUrl).digest('hex')}.${ext}`;
      const diskPath = path.join(ICON_STORAGE_DIR, filename);
      const publicUrl = `${ICON_PUBLIC_PREFIX}${filename}`;

      await fs.mkdir(ICON_STORAGE_DIR, { recursive: true });
      try {
        await fs.access(diskPath);
      } catch {
        await fs.writeFile(diskPath, bytes);
      }

      return publicUrl;
    } catch {
      return remoteUrl;
    } finally {
      clearTimeout(timeoutId);
    }
  })();

  iconLocalizePromiseByUrl.set(remoteUrl, promise);
  try {
    return await promise;
  } finally {
    iconLocalizePromiseByUrl.delete(remoteUrl);
  }
}

function parseVietnamDate(dateText: string): string | null {
  const raw = cleanText(dateText);
  const match = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!match) return null;

  const day = match[1].padStart(2, '0');
  const month = match[2].padStart(2, '0');
  const yearRaw = match[3];
  const year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw;

  const iso = `${year}-${month}-${day} 00:00:00`;
  return Number.isNaN(new Date(iso).getTime()) ? null : iso;
}

function normalizeValue(type: ScamType, value: string): string {
  const normalized = cleanText(value).slice(0, 500);
  if (!normalized) return '';

  if (type === 'website') {
    return normalized
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      .split('?')[0]
      .split('#')[0]
      .trim();
  }

  if (type === 'email') {
    return normalized.toLowerCase();
  }

  if (type === 'phone') {
    return normalized.replace(/[^\d+]/g, '').slice(0, 30) || normalized;
  }

  return normalized;
}

function detectStatus(statusText: string): { externalStatus: string; status: 'active' | 'investigating' | 'blocked'; riskLevel: 'low' | 'medium' | 'high' } {
  const normalized = cleanText(statusText).toLowerCase();

  if (normalized.includes('xác nhận') || normalized.includes('da xac nhan')) {
    return { externalStatus: statusText || 'confirmed', status: 'blocked', riskLevel: 'high' };
  }

  if (normalized.includes('đang xử lý') || normalized.includes('dang xu ly') || normalized.includes('cảnh báo') || normalized.includes('canh bao')) {
    return { externalStatus: statusText || 'suspected', status: 'investigating', riskLevel: 'high' };
  }

  if (normalized.includes('an toàn') || normalized.includes('an toan')) {
    return { externalStatus: statusText || 'safe', status: 'active', riskLevel: 'low' };
  }

  return { externalStatus: statusText || 'unknown', status: 'investigating', riskLevel: 'medium' };
}

function parseTotalPages($: cheerio.CheerioAPI): number {
  let maxPage = 1;

  $('.pagination a').each((_, element) => {
    const text = cleanText($(element).text());
    const pageFromText = Number.parseInt(text, 10);
    if (Number.isFinite(pageFromText) && pageFromText > maxPage) {
      maxPage = pageFromText;
    }

    const href = ($(element).attr('href') || '').trim();
    const pageMatch = href.match(/[?&]page=(\d+)/i);
    if (pageMatch) {
      const pageFromHref = Number.parseInt(pageMatch[1], 10);
      if (Number.isFinite(pageFromHref) && pageFromHref > maxPage) {
        maxPage = pageFromHref;
      }
    }
  });

  return Math.max(1, Math.min(maxPage, MAX_PAGES_PER_CATEGORY));
}

function parseScamItems(html: string, config: SyncCategoryConfig): { items: ScrapedScamItem[]; totalPages: number } {
  const $ = cheerio.load(html);
  const totalPages = parseTotalPages($);
  const items: ScrapedScamItem[] = [];

  // page=1 can return full page (#list-obj .item1/.item2), while page>=2 can return fragment only.
  const records =
    $('#list-obj .item1, #list-obj .item2').length > 0
      ? $('#list-obj .item1, #list-obj .item2')
      : $('.item1, .item2');

  records.each((_, element) => {
    const valueRaw =
      cleanText($(element).find('.meta .sf-semibold span').first().text()) ||
      cleanText($(element).find('.meta .sf-semibold').first().text()) ||
      cleanText($(element).find('a').first().text());

    const value = normalizeValue(config.dbType, valueRaw);
    if (!value) return;

    const organization = cleanText($(element).find('.org a').first().text());
    const statusText = cleanText($(element).find('.status .handling').first().text());
    const dateText = cleanText($(element).find('.meta .date').first().text());
    const createdAt = parseVietnamDate(dateText);

    const reportMatch = cleanText($(element).text()).match(/(\d{1,7})\s*(?:báo cáo|bao cao)/i);
    const reportCount = reportMatch ? Math.max(0, Number.parseInt(reportMatch[1], 10) || 0) : 0;

    const sourceHref =
      $(element).find('.meta .sf-semibold').first().attr('href') ||
      $(element).find('a').first().attr('href') ||
      '';

    const sourceUrl = sourceHref
      ? sourceHref.startsWith('http')
        ? sourceHref
        : `${BASE_URL}${sourceHref.startsWith('/') ? '' : '/'}${sourceHref}`
      : '';

    // Parse icon (item icon) – the site uses .icon3 class for item icons
    const iconImg = $(element).find('.icon3 img').first().length
      ? $(element).find('.icon3 img').first()
      : $(element).find('.img img').first().length
        ? $(element).find('.img img').first()
        : $(element).find('.icon img').first().length
          ? $(element).find('.icon img').first()
          : $(element).find('img').first();

    const iconHref =
      iconImg.attr('data-src') ||
      iconImg.attr('data-original') ||
      iconImg.attr('data-lazy') ||
      iconImg.attr('data-thumb') ||
      iconImg.attr('srcset') ||
      iconImg.attr('src') ||
      '';
    const icon = resolveImageUrl(iconHref);

    // Parse organization icon (also lazy-loaded). TinNhiem HTML differs across pages,
    // so try CSS selectors first, then regex fallback over raw item HTML.
    let orgImg = $(element).find('.org img, .name_org img, .obj_org img').first();
    let orgIconFromRegex: string | null = null;
    if (!orgImg || orgImg.length === 0) {
      const rawHtml = $(element).html() || '';
      const regexHit =
        rawHtml.match(/class="[^"]*(?:org|name_org|obj_org)[^"]*"[\s\S]*?<img[^>]+(?:data-src|data-original|src)=["']([^"']+)["']/i)?.[1] ||
        rawHtml.match(/(?:Mạo danh|Giả mạo|Sở hữu)[\s\S]*?<img[^>]+(?:data-src|data-original|src)=["']([^"']+)["']/i)?.[1] ||
        '';
      if (regexHit) {
        orgIconFromRegex = regexHit;
      }
    }
    const itemClass = cleanText($(element).attr('class') || '');
    const shouldUseImgFallback = itemClass.includes('item1');
    if (shouldUseImgFallback && (!orgImg || orgImg.length === 0)) {
      const imgs = $(element).find('img');
      if (imgs.length > 1) {
        orgImg = imgs.eq(1);
      }
    }
    const orgIconHref =
      orgImg?.attr('data-src') ||
      orgImg?.attr('data-original') ||
      orgImg?.attr('data-lazy') ||
      orgImg?.attr('data-thumb') ||
      orgImg?.attr('srcset') ||
      orgImg?.attr('src') ||
      orgIconFromRegex ||
      '';
    const organizationIcon = resolveImageUrl(orgIconHref);

    // Determine if this is scam or trusted based on category slug
    const isScam = config.slug.endsWith('-scam');

    const description = organization
      ? isScam ? `Giả mạo ${organization}` : `Sở hữu bởi: ${organization}`
      : `${config.label}${createdAt ? ` (${isScam ? 'phát hiện' : 'cập nhật'} ${createdAt.slice(0, 10)})` : ''}`;

    items.push({
      value,
      statusText,
      organization,
      organizationIcon,
      description,
      reportCount,
      createdAt,
      sourceUrl,
      icon,
      isScam,
    });
  });

  return { items, totalPages };
}

async function fetchCategoryPage(config: SyncCategoryConfig, page: number): Promise<{ items: ScrapedScamItem[]; totalPages: number }> {
  const url = `${BASE_URL}${config.path}${page > 1 ? `?page=${page}` : ''}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        'User-Agent': getRandomUserAgent(),
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
        Connection: 'keep-alive',
      },
    });

    if (!response.ok) {
      throw new Error(`Fetch ${url} failed with status ${response.status}`);
    }

    const html = await response.text();
    return parseScamItems(html, config);
  } finally {
    clearTimeout(timeoutId);
  }
}

function buildExternalHash(type: ScamType, value: string): string {
  return createHash('sha1').update(`${type}|${value.toLowerCase()}`).digest('hex');
}

function buildStableId(externalHash: string): string {
  return `TM${externalHash.slice(0, 18).toUpperCase()}`;
}

async function upsertScamBatch(config: SyncCategoryConfig, items: ScrapedScamItem[]): Promise<number> {
  if (items.length === 0) return 0;

  const db = getDb();
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  const rows = await Promise.all(items.map(async (item) => {
    const normalizedValue = normalizeValue(config.dbType, item.value);
    const externalHash = buildExternalHash(config.dbType, normalizedValue);
    const stableId = buildStableId(externalHash);
    const statusInfo = item.isScam ? detectStatus(item.statusText) : {
      externalStatus: 'trusted',
      status: 'active',
      riskLevel: 'low',
    };
    const localizedIcon = await localizeIconToPublic(item.icon);
    const localizedOrganizationIcon = await localizeIconToPublic(item.organizationIcon);

    return {
      id: stableId,
      type: config.dbType,
      value: normalizedValue,
      description: cleanText(item.description).slice(0, 2000),
      reportCount: item.reportCount,
      riskLevel: item.isScam ? statusInfo.riskLevel : 'low', // Trusted items have low risk
      status: item.isScam ? statusInfo.status : 'active',    // Trusted items are active
      source: SOURCE_NAME,
      createdAt: item.createdAt || now,
      updatedAt: now,
      externalStatus: statusInfo.externalStatus.slice(0, 64),
      externalCreatedAt: item.createdAt,
      organizationName: cleanText(item.organization).slice(0, 255),
      sourceUrl: cleanText(item.sourceUrl).slice(0, 500),
      externalHash,
      externalCategory: config.slug,
      icon: localizedIcon ? cleanText(localizedIcon).slice(0, 500) : null,
      organizationIcon: localizedOrganizationIcon ? cleanText(localizedOrganizationIcon).slice(0, 500) : null,
      isScam: item.isScam,
    };
  }));

  const placeholders = rows.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
  const values: Array<string | number | null | boolean> = [];

  for (const row of rows) {
    values.push(
      row.id,
      row.type,
      row.value,
      row.description,
      row.reportCount,
      row.riskLevel,
      row.status,
      row.source,
      row.createdAt,
      row.updatedAt,
      row.externalStatus || null,
      row.externalCreatedAt || null,
      row.organizationName || null,
      row.sourceUrl || null,
      row.externalHash,
      row.externalCategory,
      row.icon,
      row.organizationIcon,
      row.isScam ? 1 : 0
    );
  }

  await db.query(
    `
      INSERT INTO scams (
        id,
        type,
        value,
        description,
        report_count,
        risk_level,
        status,
        source,
        created_at,
        updated_at,
        external_status,
        external_created_at,
        organization_name,
        source_url,
        external_hash,
        external_category,
        icon,
        organization_icon,
        is_scam
      ) VALUES ${placeholders}
      ON DUPLICATE KEY UPDATE
        type = VALUES(type),
        value = VALUES(value),
        description = VALUES(description),
        report_count = GREATEST(report_count, VALUES(report_count)),
        risk_level = VALUES(risk_level),
        status = VALUES(status),
        source = VALUES(source),
        updated_at = VALUES(updated_at),
        external_status = VALUES(external_status),
        external_created_at = COALESCE(VALUES(external_created_at), external_created_at),
        organization_name = VALUES(organization_name),
        source_url = VALUES(source_url),
        external_hash = VALUES(external_hash),
        external_category = VALUES(external_category),
        icon = VALUES(icon),
        organization_icon = VALUES(organization_icon),
        is_scam = VALUES(is_scam)
    `,
    values
  );

  return rows.length;
}

async function getSyncState(): Promise<SyncStateRow | null> {
  const db = getDb();
  const [rows] = await db.query<SyncStateRow[]>(
    'SELECT source, last_sync_started_at, last_sync_completed_at, last_success_at, last_error, pages_synced, records_synced FROM external_sync_state WHERE source = ? LIMIT 1',
    [SOURCE_NAME]
  );
  return rows[0] || null;
}

async function markSyncStart(): Promise<void> {
  const db = getDb();
  await db.query(
    `
      INSERT INTO external_sync_state (
        source,
        last_sync_started_at,
        last_error,
        pages_synced,
        records_synced
      ) VALUES (?, NOW(), NULL, 0, 0)
      ON DUPLICATE KEY UPDATE
        last_sync_started_at = NOW(),
        last_error = NULL,
        pages_synced = 0,
        records_synced = 0
    `,
    [SOURCE_NAME]
  );
}

async function markSyncDone(summary: { pagesSynced: number; recordsSynced: number; error?: string }): Promise<void> {
  const db = getDb();
  await db.query(
    `
      INSERT INTO external_sync_state (
        source,
        last_sync_completed_at,
        last_success_at,
        last_error,
        pages_synced,
        records_synced
      ) VALUES (?, NOW(), ${summary.error ? 'NULL' : 'NOW()'}, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        last_sync_completed_at = NOW(),
        last_success_at = ${summary.error ? 'last_success_at' : 'NOW()'},
        last_error = VALUES(last_error),
        pages_synced = VALUES(pages_synced),
        records_synced = VALUES(records_synced)
    `,
    [SOURCE_NAME, summary.error || null, summary.pagesSynced, summary.recordsSynced]
  );
}

async function countImportedRecords(): Promise<number> {
  const db = getDb();
  const [rows] = await db.query<CountRow[]>('SELECT COUNT(*) AS count FROM scams WHERE source = ?', [SOURCE_NAME]);
  return rows[0]?.count || 0;
}

export async function runTinnhiemFullSync(): Promise<SyncSummary> {
  if (syncInFlight) {
    return syncInFlight;
  }

  syncInFlight = (async () => {
    const startedAt = new Date().toISOString();
    let pagesSynced = 0;
    let recordsSynced = 0;
    const categories: SyncSummary['categories'] = [];

    await markSyncStart();

    try {
      for (const config of CATEGORY_CONFIGS) {
        let categoryPages = 0;
        let categoryRecords = 0;

        const firstPage = await fetchCategoryPage(config, 1);
        const totalPages = Math.min(firstPage.totalPages, MAX_PAGES_PER_CATEGORY);

        const firstCount = await upsertScamBatch(config, firstPage.items);
        categoryPages += 1;
        categoryRecords += firstCount;
        let emptyPageStreak = firstPage.items.length === 0 ? 1 : 0;

        let stopCategory = false;
        for (let page = 2; page <= totalPages && !stopCategory; page += SYNC_CONCURRENCY) {
          const batchPages = Array.from(
            { length: Math.min(SYNC_CONCURRENCY, totalPages - page + 1) },
            (_, index) => page + index
          );

          const batchResults = await Promise.all(
            batchPages.map(async (pageNo) => {
              try {
                const pageData = await fetchCategoryPage(config, pageNo);
                return { ok: true as const, pageData };
              } catch {
                return { ok: false as const, pageData: null };
              }
            })
          );

          for (const result of batchResults) {
            if (!result.ok || !result.pageData || result.pageData.items.length === 0) {
              emptyPageStreak += 1;
              if (emptyPageStreak >= 3) {
                stopCategory = true;
                break;
              }
              continue;
            }

            emptyPageStreak = 0;
            const inserted = await upsertScamBatch(config, result.pageData.items);
            categoryPages += 1;
            categoryRecords += inserted;
          }
        }

        pagesSynced += categoryPages;
        recordsSynced += categoryRecords;
        categories.push({ slug: config.slug, pages: categoryPages, records: categoryRecords });
      }

      await markSyncDone({ pagesSynced, recordsSynced });

      return {
        source: SOURCE_NAME,
        startedAt,
        completedAt: new Date().toISOString(),
        pagesSynced,
        recordsSynced,
        categories,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown sync error';
      await markSyncDone({ pagesSynced, recordsSynced, error: message });
      throw error;
    } finally {
      syncInFlight = null;
    }
  })();

  return syncInFlight;
}

export async function ensureTinnhiemScamsSynced(): Promise<EnsureSyncResult> {
  const now = Date.now();
  const disableAutoSync =
    process.env.STATIC_DATA_MODE === '1' || process.env.TINNHIEM_DISABLE_AUTO_SYNC === '1';

  // Avoid hammering DB state checks on high traffic.
  if (lastEnsureSnapshot && now - lastEnsureCheckAt < 10_000) {
    return { ...lastEnsureSnapshot, syncing: Boolean(syncInFlight) };
  }

  const [state, totalRecords] = await Promise.all([getSyncState(), countImportedRecords()]);
  const lastSuccessAt = state?.last_success_at || null;
  const lastError = state?.last_error || null;

  const stale = !lastSuccessAt || now - new Date(lastSuccessAt).getTime() >= AUTO_SYNC_INTERVAL_MS;

  if (totalRecords === 0) {
    try {
      if (!disableAutoSync) {
        await runTinnhiemFullSync();
      }
    } catch (error) {
      console.error('[tinnhiem-sync] Initial full sync failed:', error);
    }
  } else if (stale && !syncInFlight) {
    // Fire-and-forget scheduled refresh.
    if (!disableAutoSync) {
      void runTinnhiemFullSync().catch((error) => {
        console.error('[tinnhiem-sync] Background refresh failed:', error);
      });
    }
  }

  const snapshot: EnsureSyncResult = {
    source: SOURCE_NAME,
    totalRecords,
    syncing: Boolean(syncInFlight),
    lastSuccessAt,
    lastError,
  };

  lastEnsureCheckAt = now;
  lastEnsureSnapshot = snapshot;
  return snapshot;
}

// Lightweight snapshot without triggering sync; useful for API responses to avoid timeouts.
export async function getTinnhiemSyncSnapshot(): Promise<EnsureSyncResult> {
  const [state, totalRecords] = await Promise.all([getSyncState(), countImportedRecords()]);
  const lastSuccessAt = state?.last_success_at || null;
  const lastError = state?.last_error || null;

  const snapshot: EnsureSyncResult = {
    source: SOURCE_NAME,
    totalRecords,
    syncing: Boolean(syncInFlight),
    lastSuccessAt,
    lastError,
  };

  return snapshot;
}

function isMissingIconValue(value: string | null | undefined): boolean {
  return !value || cleanText(value) === '';
}

async function loadIconBackfillTargets(limit: number): Promise<{
  targets: Map<string, { needsIcon: boolean; needsOrganizationIcon: boolean }>;
  categoryHints: Set<SyncCategorySlug>;
}> {
  const db = getDb();
  const [rows] = await db.query<IconBackfillTargetRow[]>(
    `
      SELECT external_hash, icon, organization_icon, external_category
      FROM scams
      WHERE source = ?
        AND external_hash IS NOT NULL
        AND (
          icon IS NULL OR icon = '' OR
          organization_icon IS NULL OR organization_icon = ''
        )
      ORDER BY updated_at DESC
      LIMIT ?
    `,
    [SOURCE_NAME, limit]
  );

  const targets = new Map<string, { needsIcon: boolean; needsOrganizationIcon: boolean }>();
  const categoryHints = new Set<SyncCategorySlug>();

  for (const row of rows || []) {
    if (!row.external_hash) continue;
    targets.set(row.external_hash, {
      needsIcon: isMissingIconValue(row.icon),
      needsOrganizationIcon: isMissingIconValue(row.organization_icon),
    });
    const category = cleanText(row.external_category || '') as SyncCategorySlug;
    if (category) {
      categoryHints.add(category);
    }
  }

  return { targets, categoryHints };
}

async function fillMissingIconsForHash(
  externalHash: string,
  icon: string | null,
  organizationIcon: string | null
): Promise<{ iconFilled: boolean; organizationIconFilled: boolean; updated: boolean }> {
  const db = getDb();
  const localizedIcon = await localizeIconToPublic(icon);
  const localizedOrganizationIcon = await localizeIconToPublic(organizationIcon);
  const iconValue = cleanText(localizedIcon || '');
  const orgIconValue = cleanText(localizedOrganizationIcon || '');

  await db.query(
    `
      UPDATE scams
      SET
        icon = CASE
          WHEN (icon IS NULL OR icon = '') AND ? <> '' THEN ?
          ELSE icon
        END,
        organization_icon = CASE
          WHEN (organization_icon IS NULL OR organization_icon = '') AND ? <> '' THEN ?
          ELSE organization_icon
        END,
        updated_at = NOW()
      WHERE source = ?
        AND external_hash = ?
    `,
    [iconValue, iconValue, orgIconValue, orgIconValue, SOURCE_NAME, externalHash]
  );

  const [rows] = await db.query<IconBackfillStatusRow[]>(
    'SELECT icon, organization_icon FROM scams WHERE source = ? AND external_hash = ? LIMIT 1',
    [SOURCE_NAME, externalHash]
  );
  const current = rows[0];
  const iconFilled = !isMissingIconValue(current?.icon);
  const organizationIconFilled = !isMissingIconValue(current?.organization_icon);

  return {
    iconFilled,
    organizationIconFilled,
    updated: (iconValue !== '' || orgIconValue !== ''),
  };
}

async function localizeStoredIconUrls(limit: number): Promise<number> {
  const db = getDb();
  const [rows] = await db.query<IconBackfillTargetRow[]>(
    `
      SELECT external_hash, icon, organization_icon
      FROM scams
      WHERE source = ?
        AND external_hash IS NOT NULL
        AND (
          (icon IS NOT NULL AND icon <> '' AND icon NOT LIKE ?) OR
          (organization_icon IS NOT NULL AND organization_icon <> '' AND organization_icon NOT LIKE ?)
        )
      ORDER BY updated_at DESC
      LIMIT ?
    `,
    [SOURCE_NAME, `${ICON_PUBLIC_PREFIX}%`, `${ICON_PUBLIC_PREFIX}%`, limit]
  );

  let updated = 0;
  for (const row of rows || []) {
    if (!row.external_hash) continue;
    const currentIcon = cleanText(row.icon || '');
    const currentOrgIcon = cleanText(row.organization_icon || '');
    const nextIcon = await localizeIconToPublic(currentIcon);
    const nextOrgIcon = await localizeIconToPublic(currentOrgIcon);
    const resolvedIcon = cleanText(nextIcon || '');
    const resolvedOrgIcon = cleanText(nextOrgIcon || '');

    if (resolvedIcon === currentIcon && resolvedOrgIcon === currentOrgIcon) {
      continue;
    }

    await db.query(
      `
        UPDATE scams
        SET icon = ?, organization_icon = ?, updated_at = NOW()
        WHERE source = ? AND external_hash = ?
      `,
      [resolvedIcon || null, resolvedOrgIcon || null, SOURCE_NAME, row.external_hash]
    );
    updated += 1;
  }

  return updated;
}

export function getTinnhiemIconBackfillSnapshot(): {
  running: boolean;
  lastSummary: IconBackfillSummary | null;
} {
  return {
    running: Boolean(iconBackfillInFlight),
    lastSummary: lastIconBackfillSummary,
  };
}

export async function runTinnhiemIconBackfill(limitRaw?: number): Promise<IconBackfillSummary> {
  if (iconBackfillInFlight) {
    return iconBackfillInFlight;
  }

  const limit = Math.max(
    1,
    Math.min(
      ICON_BACKFILL_LIMIT_MAX,
      Number.isFinite(Number(limitRaw)) ? Number(limitRaw) : ICON_BACKFILL_LIMIT_DEFAULT
    )
  );

  iconBackfillInFlight = (async () => {
    const startedAt = new Date().toISOString();
    let scannedPages = 0;
    let updatedRows = 0;

    // Step 1: localize already stored remote icon URLs into local static files.
    updatedRows += await localizeStoredIconUrls(limit);

    const { targets, categoryHints } = await loadIconBackfillTargets(limit);
    const totalTargets = targets.size;

    if (totalTargets === 0) {
      const summary: IconBackfillSummary = {
        source: SOURCE_NAME,
        startedAt,
        completedAt: new Date().toISOString(),
        totalTargets: 0,
        resolvedTargets: 0,
        remainingTargets: 0,
        scannedPages: 0,
        updatedRows,
        categoriesScanned: [],
      };
      lastIconBackfillSummary = summary;
      return summary;
    }

    const configs =
      categoryHints.size > 0
        ? CATEGORY_CONFIGS.filter((config) => categoryHints.has(config.slug))
        : CATEGORY_CONFIGS;

    const categoriesScanned: string[] = [];

    for (const config of configs) {
      if (targets.size === 0) break;
      categoriesScanned.push(config.slug);

      let page = 1;
      let maxPage = 1;
      let emptyStreak = 0;

      while (page <= maxPage && emptyStreak < 3 && targets.size > 0) {
        let pageData: { items: ScrapedScamItem[]; totalPages: number } | null = null;
        try {
          pageData = await fetchCategoryPage(config, page);
          scannedPages += 1;
          maxPage = Math.min(pageData.totalPages, MAX_PAGES_PER_CATEGORY);
        } catch {
          emptyStreak += 1;
          page += 1;
          continue;
        }

        if (!pageData || pageData.items.length === 0) {
          emptyStreak += 1;
          page += 1;
          continue;
        }

        emptyStreak = 0;
        for (const item of pageData.items) {
          const normalizedValue = normalizeValue(config.dbType, item.value);
          if (!normalizedValue) continue;
          const hash = buildExternalHash(config.dbType, normalizedValue);
          const target = targets.get(hash);
          if (!target) continue;

          const shouldTryFill =
            (target.needsIcon && !isMissingIconValue(item.icon)) ||
            (target.needsOrganizationIcon && !isMissingIconValue(item.organizationIcon));
          if (!shouldTryFill) continue;

          const fill = await fillMissingIconsForHash(hash, item.icon, item.organizationIcon);
          if (fill.updated) {
            updatedRows += 1;
          }

          const nextState = {
            needsIcon: !fill.iconFilled,
            needsOrganizationIcon: !fill.organizationIconFilled,
          };

          if (!nextState.needsIcon && !nextState.needsOrganizationIcon) {
            targets.delete(hash);
          } else {
            targets.set(hash, nextState);
          }
        }

        page += 1;
      }
    }

    const summary: IconBackfillSummary = {
      source: SOURCE_NAME,
      startedAt,
      completedAt: new Date().toISOString(),
      totalTargets,
      resolvedTargets: totalTargets - targets.size,
      remainingTargets: targets.size,
      scannedPages,
      updatedRows,
      categoriesScanned,
    };
    lastIconBackfillSummary = summary;
    return summary;
  })().finally(() => {
    iconBackfillInFlight = null;
  });

  return iconBackfillInFlight;
}

export function getCategoryNameByType(type: ScamType): string {
  return CATEGORY_NAME_MAP[type] || type;
}

export function getCategorySlugByType(type: ScamType): string {
  return CATEGORY_SLUG_MAP[type] || type;
}

export function mapCategoryParamToScamType(categoryParam: string): ScamType | null {
  const normalized = cleanText(categoryParam).toLowerCase();
  if (!normalized || normalized === 'all') return null;

  const aliasMap: Record<string, ScamType> = {
    websites: 'website',
    organizations: 'organization',
    phones: 'phone',
    banks: 'bank',
    emails: 'email',
    socials: 'social',
    apps: 'application',
    devices: 'device',
    systems: 'system',
  };

  if (aliasMap[normalized]) {
    return aliasMap[normalized];
  }

  const entry = CATEGORY_CONFIGS.find((item) => item.slug === normalized || item.dbType === normalized);
  return entry ? entry.dbType : null;
}

export function mapScamTypeToLegacyType(type: ScamType): string {
  if (type === 'website') return 'web';
  if (type === 'application') return 'app';
  return type;
}

export function buildDetailKeyFromScam(type: ScamType, value: string): string {
  const slug = cleanText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return slug ? `${type}:${slug}` : '';
}

export async function findWebsiteScamInLocalDb(domain: string): Promise<{
  value: string;
  description: string;
  reportCount: number;
  status: 'active' | 'investigating' | 'blocked';
  externalStatus: string | null;
  organizationName: string | null;
  sourceUrl: string | null;
  externalCreatedAt: string | null;
} | null> {
  const normalized = normalizeValue('website', domain);
  if (!normalized) return null;

  const db = getDb();
  const [rows] = await db.query<LocalWebsiteScamRow[]>(
    `
      SELECT
        value,
        description,
        report_count AS reportCount,
        status,
        external_status AS externalStatus,
        organization_name AS organizationName,
        source_url AS sourceUrl,
        external_created_at AS externalCreatedAt
      FROM scams
      WHERE type = 'website'
        AND source = ?
        AND (
          LOWER(value) = ?
          OR LOWER(value) = CONCAT('www.', ?)
          OR ? LIKE CONCAT('%.', LOWER(value))
        )
      ORDER BY
        CASE status
          WHEN 'blocked' THEN 1
          WHEN 'investigating' THEN 2
          ELSE 3
        END,
        report_count DESC,
        updated_at DESC
      LIMIT 1
    `,
    [SOURCE_NAME, normalized, normalized, normalized]
  );

  const row = rows[0];
  if (!row) return null;

  return {
    value: row.value,
    description: row.description,
    reportCount: row.reportCount || 0,
    status: row.status,
    externalStatus: row.externalStatus,
    organizationName: row.organizationName,
    sourceUrl: row.sourceUrl,
    externalCreatedAt: row.externalCreatedAt,
  };
}

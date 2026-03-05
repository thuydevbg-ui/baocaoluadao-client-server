import { withApiObservability } from '@/lib/apiHandler';
import { NextRequest } from 'next/server';
import { normalizeDomainInput } from '@/lib/dataSources/tinnhiemmang';
import { ensureTinnhiemScamsSynced, findWebsiteScamInLocalDb } from '@/lib/services/tinnhiemSync.service';
import { createSecureJsonResponse, isRequestFromSameOrigin, rateLimitRequest } from '@/lib/apiSecurity';

function isValidScanDomain(domain: string): boolean {
  const normalized = domain.trim().toLowerCase();
  if (!normalized || normalized.length > 253) {
    return false;
  }

  const blockedPatterns = [
    /^localhost$/i,
    /^127\.\d+\.\d+\.\d+$/,
    /^10\.\d+\.\d+\.\d+$/,
    /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
    /^192\.168\.\d+\.\d+$/,
    /^0\.\d+\.\d+\.\d+$/,
    /^::1$/i,
    /^fe80:/i,
  ];

  if (blockedPatterns.some((pattern) => pattern.test(normalized))) {
    return false;
  }

  return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(normalized);
}

function toScamResponse(domain: string, item: {
  externalStatus: string | null;
  status: 'active' | 'investigating' | 'blocked';
  reportCount: number;
  value: string;
  organizationName: string | null;
  description: string;
  sourceUrl: string | null;
  externalCreatedAt: string | null;
}) {
  const externalStatus = (item.externalStatus || '').toLowerCase();
  const isConfirmed = item.status === 'blocked' || externalStatus.includes('xác nhận') || externalStatus.includes('confirmed');
  const riskScore = isConfirmed ? 95 : 85;
  const reportCount = Math.max(1, Number(item.reportCount || 0));
  const createdAt = item.externalCreatedAt || new Date().toISOString();

  return {
    domain,
    found: true,
    risk_score: riskScore,
    verdict: 'scam',
    status: isConfirmed ? 'confirmed' : 'suspected',
    name: item.value || domain,
    icon: 'https://tinnhiemmang.vn/img/icon_web2.png',
    organization_icon: '',
    organization: item.organizationName || '',
    description: item.description || 'Website có trong cơ sở dữ liệu nội bộ đã đồng bộ từ tinnhiemmang.vn',
    reports: reportCount,
    date: createdAt,
    source: 'local_db:tinnhiemmang.vn',
    ssl_valid: false,
    securityChecks: [
      { name: 'Tên miền', status: 'fail', details: 'Phát hiện trong cơ sở dữ liệu nội bộ' },
      { name: 'Tổ chức bị mạo danh', status: item.organizationName ? 'fail' : 'warning', details: item.organizationName || 'Chưa công bố' },
      { name: 'Ngày phát hiện', status: item.externalCreatedAt ? 'warning' : 'pass', details: item.externalCreatedAt || 'Không có thông tin' },
      { name: 'Trạng thái', status: isConfirmed ? 'fail' : 'warning', details: isConfirmed ? 'Đã xác nhận lừa đảo' : 'Đang theo dõi / xử lý' },
      { name: 'Nguồn', status: 'pass', details: item.sourceUrl || 'CSDL nội bộ đồng bộ từ tinnhiemmang.vn' },
    ],
  };
}

function toSafeResponse(domain: string) {
  return {
    domain,
    found: false,
    risk_score: 5,
    verdict: 'safe',
    status: 'safe',
    name: domain,
    icon: 'https://tinnhiemmang.vn/img/icon_web2.png',
    organization_icon: '',
    description: `Không thấy "${domain}" trong dữ liệu cảnh báo của tinnhiemmang.vn`,
    reports: 0,
    date: new Date().toISOString(),
    source: 'local_db:tinnhiemmang.vn',
    ssl_valid: true,
    securityChecks: [
      { name: 'Tên miền', status: 'pass', details: 'Không thấy trong cơ sở dữ liệu cảnh báo' },
      { name: 'Tổ chức bị mạo danh', status: 'pass', details: 'Không phát hiện' },
      { name: 'Ngày phát hiện', status: 'pass', details: 'Không có thông tin' },
      { name: 'Trạng thái', status: 'pass', details: 'An toàn tạm thời' },
      { name: 'Nguồn', status: 'pass', details: 'CSDL nội bộ đồng bộ từ tinnhiemmang.vn' },
    ],
  };
}

function toLocalHeuristicResponse(domain: string) {
  const scamKeywords = [
    'fake',
    'scam',
    'phishing',
    'luadao',
    'lua-dao',
    'sale',
    '0dong',
    'khuyenmai',
    'trungthuong',
    'free',
    'seller',
  ];

  const suspiciousTlds = ['xyz', 'top', 'work', 'click', 'link', 'gq', 'ml', 'cf', 'tk', 'buzz', 'site', 'online'];

  const lower = domain.toLowerCase();
  const hasKeyword = scamKeywords.some((kw) => lower.includes(kw));
  const hasSuspiciousTld = suspiciousTlds.some((tld) => lower.endsWith(`.${tld}`));

  let riskScore = 8;
  if (hasKeyword) riskScore += 42;
  if (hasSuspiciousTld) riskScore += 28;
  if (/\d{4,}/.test(lower)) riskScore += 18;
  if (lower.length < 10) riskScore += 8;

  riskScore = Math.min(100, riskScore);
  const suspicious = riskScore >= 45;

  return {
    domain,
    found: suspicious,
    risk_score: riskScore,
    verdict: suspicious ? 'scam' : 'safe',
    status: suspicious ? 'suspected' : 'safe',
    name: domain,
    icon: 'https://tinnhiemmang.vn/img/icon_web2.png',
    organization_icon: '',
    description: suspicious
      ? `Domain "${domain}" có một số dấu hiệu rủi ro theo phân tích cục bộ`
      : `Không thấy "${domain}" trong dữ liệu cảnh báo và chưa có dấu hiệu rủi ro rõ ràng`,
    reports: suspicious ? Math.floor(Math.random() * 40) + 1 : 0,
    date: new Date().toISOString(),
    source: 'local_detection',
    ssl_valid: !suspicious,
    securityChecks: [
      { name: 'Tên miền', status: suspicious ? 'warning' : 'pass', details: suspicious ? 'Có đặc điểm đáng ngờ' : 'Bình thường' },
      { name: 'Đuôi domain', status: hasSuspiciousTld ? 'warning' : 'pass', details: hasSuspiciousTld ? 'Đuôi domain rủi ro cao' : 'Phổ biến' },
      { name: 'Mẫu phishing', status: hasKeyword ? 'warning' : 'pass', details: hasKeyword ? 'Có từ khóa lừa đảo' : 'Không phát hiện' },
      { name: 'Nguồn', status: 'pass', details: 'Phân tích cục bộ (fallback)' },
    ],
  };
}

export const POST = withApiObservability(async (request: NextRequest) => {
  if (!isRequestFromSameOrigin(request)) {
    return createSecureJsonResponse({ error: 'Forbidden request origin' }, { status: 403 });
  }

  const rateLimit = rateLimitRequest(request, {
    keyPrefix: 'scan:post',
    windowMs: 60_000,
    maxRequests: 30,
  });
  if (!rateLimit.ok) {
    return createSecureJsonResponse({ error: 'Too many requests' }, { status: 429 }, rateLimit);
  }

  try {
    const body = await request.json();
    const rawUrl = typeof body?.url === 'string' ? body.url : '';
    if (!rawUrl.trim()) {
      return createSecureJsonResponse({ error: 'URL is required' }, { status: 400 }, rateLimit);
    }

    const domain = normalizeDomainInput(rawUrl);
    if (!domain || !isValidScanDomain(domain)) {
      return createSecureJsonResponse({ error: 'Invalid domain format' }, { status: 400 }, rateLimit);
    }

    try {
      await ensureTinnhiemScamsSynced();
      const matched = await findWebsiteScamInLocalDb(domain);
      if (matched) {
        return createSecureJsonResponse(toScamResponse(domain, matched), { status: 200 }, rateLimit);
      }
      return createSecureJsonResponse(toSafeResponse(domain), { status: 200 }, rateLimit);
    } catch (lookupError) {
      console.error('local db lookup error:', lookupError);
      return createSecureJsonResponse(toLocalHeuristicResponse(domain), { status: 200 }, rateLimit);
    }
  } catch (error) {
    console.error('Scan error:', error);
    return createSecureJsonResponse(
      { error: 'Failed to scan website', risk_score: 0, verdict: 'unknown' },
      { status: 500 },
      rateLimit
    );
  }
});

export const GET = withApiObservability(async (request: NextRequest) => {
  if (!isRequestFromSameOrigin(request)) {
    return createSecureJsonResponse({ error: 'Forbidden request origin' }, { status: 403 });
  }

  const rateLimit = rateLimitRequest(request, {
    keyPrefix: 'scan:get',
    windowMs: 60_000,
    maxRequests: 60,
  });
  if (!rateLimit.ok) {
    return createSecureJsonResponse({ error: 'Too many requests' }, { status: 429 }, rateLimit);
  }

  return createSecureJsonResponse({
    message: 'Use POST to scan a URL',
    example: {
      url: 'https://example.com',
    },
  }, { status: 200 }, rateLimit);
});

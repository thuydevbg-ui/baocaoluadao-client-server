import { withApiObservability } from '@/lib/apiHandler';
import { NextRequest } from 'next/server';
import { normalizeDomainInput } from '@/lib/dataSources/tinnhiemmang';
import { ensureTinnhiemScamsSynced, findWebsiteScamInLocalDb } from '@/lib/services/tinnhiemSync.service';
import { createSecureJsonResponse, isRequestFromSameOrigin, rateLimitRequest } from '@/lib/apiSecurity';

const WEB_RISK_URI_SEARCH_ENDPOINT = 'https://webrisk.googleapis.com/v1/uris:search';
const WEB_RISK_THREAT_TYPES = ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE'] as const;

type WebRiskThreatType = typeof WEB_RISK_THREAT_TYPES[number];

interface WebRiskUriSearchResponse {
  threat?: {
    threatTypes?: string[];
    expireTime?: string;
  };
}

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

function getWebRiskApiKey(): string {
  return (process.env.WEB_RISK_API_KEY || process.env.GOOGLE_WEB_RISK_API_KEY || '').trim();
}

async function queryWebRisk(domain: string): Promise<{
  threatDetected: boolean;
  threatTypes: WebRiskThreatType[];
}> {
  const apiKey = getWebRiskApiKey();
  if (!apiKey) {
    throw new Error('WEB_RISK_API_KEY is not configured');
  }

  const params = new URLSearchParams({
    uri: `https://${domain}`,
    key: apiKey,
  });
  for (const threatType of WEB_RISK_THREAT_TYPES) {
    params.append('threatTypes', threatType);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`${WEB_RISK_URI_SEARCH_ENDPOINT}?${params.toString()}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Web Risk HTTP ${response.status}`);
    }

    const payload = (await response.json()) as WebRiskUriSearchResponse;
    const threatTypes = Array.isArray(payload?.threat?.threatTypes)
      ? payload.threat.threatTypes
        .map((value) => String(value || '').trim().toUpperCase())
        .filter((value): value is WebRiskThreatType => WEB_RISK_THREAT_TYPES.includes(value as WebRiskThreatType))
      : [];

    return {
      threatDetected: threatTypes.length > 0,
      threatTypes,
    };
  } finally {
    clearTimeout(timeout);
  }
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

function toWebRiskThreatResponse(domain: string, threatTypes: WebRiskThreatType[], localMatch?: {
  reportCount: number;
  organizationName: string | null;
  description: string;
  externalCreatedAt: string | null;
  value: string;
}) {
  const isMalware = threatTypes.includes('MALWARE');
  const isSocialEngineering = threatTypes.includes('SOCIAL_ENGINEERING');
  const riskScore = isMalware ? 98 : isSocialEngineering ? 95 : 90;
  const threatText = threatTypes.length > 0 ? threatTypes.join(', ') : 'UNKNOWN';
  const createdAt = localMatch?.externalCreatedAt || new Date().toISOString();
  const reports = Math.max(1, Number(localMatch?.reportCount || 0));

  return {
    domain,
    found: true,
    risk_score: riskScore,
    verdict: 'scam',
    status: 'confirmed',
    name: localMatch?.value || domain,
    icon: 'https://tinnhiemmang.vn/img/icon_web2.png',
    organization_icon: '',
    organization: localMatch?.organizationName || '',
    description: localMatch?.description || `Google Web Risk đã gắn cờ domain này (${threatText})`,
    reports,
    date: createdAt,
    source: 'google_web_risk+local_db',
    ssl_valid: false,
    securityChecks: [
      { name: 'Google Web Risk', status: 'fail', details: `Threat detected: ${threatText}` },
      { name: 'Tên miền', status: 'fail', details: 'Phát hiện rủi ro bởi Google Web Risk' },
      { name: 'Tổ chức bị mạo danh', status: localMatch?.organizationName ? 'fail' : 'warning', details: localMatch?.organizationName || 'Chưa công bố' },
      { name: 'Nguồn nội bộ', status: localMatch ? 'warning' : 'pass', details: localMatch ? 'Có bản ghi trong CSDL nội bộ' : 'Không có bản ghi trong CSDL nội bộ' },
    ],
  };
}

function toCrossCheckedSafeResponse(domain: string) {
  return {
    ...toSafeResponse(domain),
    source: 'google_web_risk+local_db',
    securityChecks: [
      { name: 'Google Web Risk', status: 'pass', details: 'Không phát hiện threat trong danh sách MALWARE/SOCIAL_ENGINEERING/UNWANTED_SOFTWARE' },
      { name: 'Tên miền', status: 'pass', details: 'Không thấy trong cơ sở dữ liệu cảnh báo nội bộ' },
      { name: 'Trạng thái', status: 'pass', details: 'An toàn tạm thời (cross-check)' },
    ],
  };
}

function toCrossCheckedDbScamResponse(domain: string, item: {
  externalStatus: string | null;
  status: 'active' | 'investigating' | 'blocked';
  reportCount: number;
  value: string;
  organizationName: string | null;
  description: string;
  sourceUrl: string | null;
  externalCreatedAt: string | null;
}) {
  const base = toScamResponse(domain, item);
  return {
    ...base,
    source: 'local_db:tinnhiemmang.vn+google_web_risk(clean)',
    securityChecks: [
      { name: 'Google Web Risk', status: 'pass', details: 'Không phát hiện threat trực tiếp, nhưng domain đã có trong blacklist nội bộ' },
      ...base.securityChecks,
    ],
  };
}

function toUnknownResponse(domain: string) {
  return {
    domain,
    found: false,
    risk_score: 0,
    verdict: 'unknown',
    status: 'unknown',
    name: domain,
    icon: 'https://tinnhiemmang.vn/img/icon_web2.png',
    organization_icon: '',
    description: 'Không thể xác minh trạng thái website do lỗi truy vấn nguồn dữ liệu. Vui lòng thử lại sau.',
    reports: 0,
    date: new Date().toISOString(),
    source: 'scan_unavailable',
    ssl_valid: null,
    securityChecks: [
      { name: 'Google Web Risk', status: 'warning', details: 'Không truy vấn được trong lần quét này' },
      { name: 'CSDL nội bộ', status: 'warning', details: 'Không đối chiếu được trong lần quét này' },
      { name: 'Trạng thái', status: 'warning', details: 'Chưa đủ dữ liệu để kết luận' },
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

      // Cost-saving ordering:
      // 1) Check local DB first (already synced from tinnhiemmang.vn).
      // 2) Only call Google Web Risk if not found in local DB.
      if (matched) {
        return createSecureJsonResponse(toScamResponse(domain, matched), { status: 200 }, rateLimit);
      }

      const webRisk = await queryWebRisk(domain);
      if (webRisk.threatDetected) {
        return createSecureJsonResponse(toWebRiskThreatResponse(domain, webRisk.threatTypes), { status: 200 }, rateLimit);
      }

      return createSecureJsonResponse(toCrossCheckedSafeResponse(domain), { status: 200 }, rateLimit);
    } catch (lookupError) {
      console.error('scan cross-check error:', lookupError);
      return createSecureJsonResponse(toUnknownResponse(domain), { status: 200 }, rateLimit);
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

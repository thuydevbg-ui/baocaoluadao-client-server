import { withApiObservability } from '@/lib/apiHandler';
import { NextRequest } from 'next/server';
import { normalizeDomainInput } from '@/lib/dataSources/tinnhiemmang';
import { ensureTinnhiemScamsSynced, findWebsiteScamInLocalDb, getTinnhiemSyncSnapshot } from '@/lib/services/tinnhiemSync.service';
import { createSecureJsonResponse, isRequestFromSameOrigin, rateLimitRequest } from '@/lib/apiSecurity';
import { findPolicyViolationInLocalDb } from '@/lib/services/policyViolation.service';
import { getRedisJson, setRedisJson } from '@/lib/jsonCache';

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

const CACHE_KEY_PREFIX = 'api:scan';
const CACHE_TTL_SECONDS = Number.parseInt(process.env.SCAN_CACHE_TTL_SECONDS || '3600', 10) || 3600;
const CACHE_ERROR_TTL_SECONDS = Number.parseInt(process.env.SCAN_CACHE_ERROR_TTL_SECONDS || '60', 10) || 60;

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

function toPolicyViolationResponse(domain: string, item: {
  violationSummary: string | null;
  sourceName: string;
  sourceUrl: string;
  sourceTitle: string | null;
  updatedAt: string;
}) {
  return {
    domain,
    found: true,
    risk_score: 45,
    trust_score: 55,
    verdict: 'policy',
    status: 'policy',
    name: domain,
    icon: 'https://tinnhiemmang.vn/img/icon_web2.png',
    organization_icon: '',
    organization: '',
    policy_violation: true,
    policy_source_url: item.sourceUrl,
    policy_source_name: item.sourceName,
    policy_source_title: item.sourceTitle,
    policy_updated_at: item.updatedAt,
    description: item.violationSummary
      ? `Cảnh báo pháp lý: ${item.violationSummary}`
      : 'Cảnh báo pháp lý: Website có dấu hiệu vi phạm pháp luật theo nguồn công bố chính thức.',
    reports: 0,
    date: item.updatedAt || new Date().toISOString(),
    source: `policy_violation_list:${item.sourceName}`,
    ssl_valid: null,
    securityChecks: [
      { name: 'Cảnh báo pháp lý', status: 'warning', details: item.violationSummary || 'Có trong danh sách công bố' },
      { name: 'Nguồn', status: 'pass', details: item.sourceUrl },
      { name: 'Lưu ý', status: 'pass', details: 'Đây không phải kết luận lừa đảo; chỉ là cảnh báo pháp lý/tuân thủ.' },
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
      const staticMode = process.env.STATIC_DATA_MODE === '1';
      const cacheKey = `${CACHE_KEY_PREFIX}:${domain}`;
      const cached = await getRedisJson<unknown>(cacheKey);
      if (cached) {
        return createSecureJsonResponse(cached, { status: 200 }, rateLimit);
      }

      if (staticMode) {
        const syncSnapshot = await getTinnhiemSyncSnapshot().catch(() => null);
        if (syncSnapshot && syncSnapshot.totalRecords === 0) {
          const payload = {
            ...toUnknownResponse(domain),
            description: 'CSDL noi bo chua co du lieu. Hay chay dong bo truoc (internal sync) de kich hoat che do du lieu tinh.',
            source: 'local_db:empty',
          };
          await setRedisJson(cacheKey, CACHE_ERROR_TTL_SECONDS, payload);
          return createSecureJsonResponse(payload, { status: 200 }, rateLimit);
        }
      } else {
        await ensureTinnhiemScamsSynced();
      }

      const matched = await findWebsiteScamInLocalDb(domain);

      // Cost-saving ordering:
      // 1) Check local DB first (already synced from tinnhiemmang.vn).
      // 2) Check policy violation list (legal warning).
      // 3) Only call Google Web Risk if not found in local DB.
      if (matched) {
        const payload = toScamResponse(domain, matched);
        await setRedisJson(cacheKey, CACHE_TTL_SECONDS, payload);
        return createSecureJsonResponse(payload, { status: 200 }, rateLimit);
      }

      const policyHit = await findPolicyViolationInLocalDb(domain).catch(() => null);
      if (policyHit) {
        const payload = toPolicyViolationResponse(domain, policyHit);
        await setRedisJson(cacheKey, CACHE_TTL_SECONDS, payload);
        return createSecureJsonResponse(payload, { status: 200 }, rateLimit);
      }

      if (staticMode) {
        const payload = toSafeResponse(domain);
        await setRedisJson(cacheKey, CACHE_TTL_SECONDS, payload);
        return createSecureJsonResponse(payload, { status: 200 }, rateLimit);
      }

      // WebRisk is optional. If no API key configured, fall back to local-only verdicts.
      const apiKey = getWebRiskApiKey();
      if (!apiKey) {
        const payload = toSafeResponse(domain);
        await setRedisJson(cacheKey, CACHE_TTL_SECONDS, payload);
        return createSecureJsonResponse(payload, { status: 200 }, rateLimit);
      }

      const webRisk = await queryWebRisk(domain);
      if (webRisk.threatDetected) {
        const payload = toWebRiskThreatResponse(domain, webRisk.threatTypes);
        await setRedisJson(cacheKey, CACHE_TTL_SECONDS, payload);
        return createSecureJsonResponse(payload, { status: 200 }, rateLimit);
      }

      const payload = toCrossCheckedSafeResponse(domain);
      await setRedisJson(cacheKey, CACHE_TTL_SECONDS, payload);
      return createSecureJsonResponse(payload, { status: 200 }, rateLimit);
    } catch (lookupError) {
      console.error('scan cross-check error:', lookupError);
      const cacheKey = `${CACHE_KEY_PREFIX}:${domain}`;
      const payload = toUnknownResponse(domain);
      await setRedisJson(cacheKey, CACHE_ERROR_TTL_SECONDS, payload);
      return createSecureJsonResponse(payload, { status: 200 }, rateLimit);
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

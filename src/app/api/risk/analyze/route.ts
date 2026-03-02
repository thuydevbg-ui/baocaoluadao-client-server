import { NextRequest } from 'next/server';
import { withApiObservability } from '@/lib/apiHandler';
import { createSecureJsonResponse, isRequestFromSameOrigin, rateLimitRequest } from '@/lib/apiSecurity';
import { normalizeDomainInput } from '@/lib/dataSources/tinnhiemmang';
import { evaluateDeterministicRisk } from '@/lib/scan/deterministic';
import { evaluateHeuristicRisk } from '@/lib/scan/heuristic';
import { enqueueAiScanJob, fetchAiScanRecord, upsertAiScanRecord, type AiScanJobData } from '@/lib/scan/queue';
import { type AiStatus } from '@/lib/scan/aiAnalyzer';

const RATE_LIMIT_OPTIONS = {
  keyPrefix: 'risk:analyze',
  windowMs: 60_000,
  maxRequests: 12,
};

const DETERMINISTIC_WEIGHT = 0.4;
const HEURISTIC_WEIGHT = 0.3;
const AI_WEIGHT = 0.3;

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function computeRiskScore(deterministicScore: number, heuristicScore: number, aiScore: number | null): number {
  const aiComponent = aiScore ?? heuristicScore;
  return clampScore(
    deterministicScore * DETERMINISTIC_WEIGHT +
      heuristicScore * HEURISTIC_WEIGHT +
      aiComponent * AI_WEIGHT
  );
}

function buildNormalizedUrl(input: string, domain: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    return `https://${domain}`;
  }

  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    return parsed.toString();
  } catch {
    return `https://${domain}`;
  }
}

function isValidDomainFormat(domain: string): boolean {
  if (!domain) return false;
  if (domain.length > 253) return false;

  const blockedPatterns = [
    /^localhost$/i,
    /^127\.0\.0\.1$/,
    /^10\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^192\.168\./,
    /^0\./,
    /^::1$/i,
  ];

  if (blockedPatterns.some((pattern) => pattern.test(domain))) {
    return false;
  }

  return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(domain);
}

function buildReasonList(
  deterministicFlags: string[],
  heuristicReasons: string[],
  aiReasons: string[] | undefined
): string[] {
  return [...deterministicFlags, ...heuristicReasons, ...(aiReasons ?? [])];
}

interface AnalyzeResponse {
  riskScore: number;
  deterministicScore: number;
  heuristicScore: number;
  aiScore: number | null;
  aiStatus: AiStatus;
  reasons: string[];
}

export const POST = withApiObservability(async (request: NextRequest, { logger }) => {
  if (!isRequestFromSameOrigin(request)) {
    return createSecureJsonResponse({ error: 'Forbidden request origin' }, { status: 403 });
  }

  const rateLimit = rateLimitRequest(request, RATE_LIMIT_OPTIONS);
  if (!rateLimit.ok) {
    return createSecureJsonResponse({ error: 'Too many requests' }, { status: 429 }, rateLimit);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const rawUrl = typeof body?.url === 'string' ? body.url : '';
    const domain = normalizeDomainInput(rawUrl);

    if (!domain || !isValidDomainFormat(domain)) {
      return createSecureJsonResponse({ error: 'Invalid domain format' }, { status: 400 }, rateLimit);
    }

    const deterministic = await evaluateDeterministicRisk(domain);
    const heuristic = await evaluateHeuristicRisk(domain, deterministic);

    const normalizedUrl = buildNormalizedUrl(rawUrl, domain);
    const aiPayload: AiScanJobData = {
      domain,
      url: normalizedUrl,
      deterministicScore: deterministic.deterministicScore,
      heuristicScore: heuristic.heuristicScore,
      deterministicFlags: deterministic.flags,
      heuristicReasons: heuristic.reasons,
    };

    let aiStatus: AiStatus = 'pending';
    let aiJobId: string | null = null;
    let aiReasons: string[] | undefined;

    try {
      const job = await enqueueAiScanJob(aiPayload);
      aiJobId = job.id as string;
    } catch (enqueueError) {
      aiStatus = 'skipped';
      aiReasons = ['AI queue unavailable'];
      logger.error({ err: enqueueError instanceof Error ? enqueueError.message : String(enqueueError), domain }, 'Failed to enqueue AI job');
    }

    await upsertAiScanRecord({
      domain,
      jobId: aiJobId,
      deterministicScore: deterministic.deterministicScore,
      heuristicScore: heuristic.heuristicScore,
      deterministicFlags: deterministic.flags,
      heuristicReasons: heuristic.reasons,
      aiScore: null,
      aiStatus,
      aiReasons,
      aiSummary: null,
    });

    const response: AnalyzeResponse = {
      riskScore: computeRiskScore(deterministic.deterministicScore, heuristic.heuristicScore, null),
      deterministicScore: deterministic.deterministicScore,
      heuristicScore: heuristic.heuristicScore,
      aiScore: null,
      aiStatus,
      reasons: buildReasonList(deterministic.flags, heuristic.reasons, aiReasons),
    };

    return createSecureJsonResponse(response, { status: 200 }, rateLimit);
  } catch (error) {
    logger.error({ err: error instanceof Error ? error.message : 'unknown' }, 'Risk analyze route failed');
    return createSecureJsonResponse({ error: 'Unable to analyze risk at this time' }, { status: 500 }, rateLimit);
  }
});

export const GET = withApiObservability(async (request: NextRequest, { logger }) => {
  if (!isRequestFromSameOrigin(request)) {
    return createSecureJsonResponse({ error: 'Forbidden request origin' }, { status: 403 });
  }

  const rateLimit = rateLimitRequest(request, RATE_LIMIT_OPTIONS);
  if (!rateLimit.ok) {
    return createSecureJsonResponse({ error: 'Too many requests' }, { status: 429 }, rateLimit);
  }

  const domainParam = request.nextUrl.searchParams.get('domain') ?? '';
  const domain = normalizeDomainInput(domainParam);

  if (!domain || !isValidDomainFormat(domain)) {
    return createSecureJsonResponse({ error: 'Invalid domain format' }, { status: 400 }, rateLimit);
  }

  try {
    const record = await fetchAiScanRecord(domain);
    if (!record) {
      return createSecureJsonResponse({ error: 'No previous scan found' }, { status: 404 }, rateLimit);
    }

    const response: AnalyzeResponse = {
      riskScore: computeRiskScore(record.deterministicScore, record.heuristicScore, record.aiScore),
      deterministicScore: record.deterministicScore,
      heuristicScore: record.heuristicScore,
      aiScore: record.aiScore,
      aiStatus: record.aiStatus,
      reasons: buildReasonList(record.deterministicFlags, record.heuristicReasons, record.aiReasons),
    };

    return createSecureJsonResponse(response, { status: 200 }, rateLimit);
  } catch (error) {
    logger.error({ err: error instanceof Error ? error.message : 'unknown', domain }, 'Risk analyze fetch failed');
    return createSecureJsonResponse({ error: 'Unable to fetch scan record' }, { status: 500 }, rateLimit);
  }
});

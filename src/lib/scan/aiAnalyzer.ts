import { logger } from '@/lib/logger';

export type AiStatus = 'pending' | 'ok' | 'fallback' | 'skipped';

export interface AiAnalysisRequest {
  domain: string;
  url: string;
  deterministicScore: number;
  heuristicScore: number;
  deterministicFlags: string[];
  heuristicReasons: string[];
}

export interface AiAnalysisResult {
  aiScore: number | null;
  aiStatus: AiStatus;
  aiReasons: string[];
  aiSummary?: string;
}

interface OpenAiSchema {
  aiScore: number;
  verdict: 'safe' | 'suspicious' | 'scam';
  summary: string;
  trustSignals: string[];
}

const OPENAI_TIMEOUT_MS = 8_000;
const OPENAI_RETRIES = 2;
const OPENAI_MODEL = 'gpt-4o-mini';
const SYSTEM_INSTRUCTIONS = `You are a fraud analyst for ScamGuard. Return EXACTLY one JSON object matching the schema: {"aiScore": number 0-100, "verdict": "safe"|"suspicious"|"scam", "summary": string, "trustSignals": string[]}. No surrounding text.`;

function clampToRange(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function extractJsonPayload(raw: string): string {
  const trimmed = raw.trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }
  return trimmed;
}

function parseAiPayload(raw: string): OpenAiSchema {
  const payloadText = extractJsonPayload(raw);
  const json = JSON.parse(payloadText);

  if (typeof json.aiScore !== 'number') {
    throw new Error('AI response missing aiScore');
  }

  if (typeof json.summary !== 'string') {
    throw new Error('AI response missing summary');
  }

  if (!Array.isArray(json.trustSignals)) {
    throw new Error('AI response missing trustSignals');
  }

  const verdict = typeof json.verdict === 'string' ? json.verdict : 'suspicious';
  if (!['safe', 'suspicious', 'scam'].includes(verdict)) {
    throw new Error('AI response verdict is invalid');
  }

  return {
    aiScore: clampToRange(json.aiScore),
    verdict: verdict as OpenAiSchema['verdict'],
    summary: json.summary,
    trustSignals: json.trustSignals.map((signal: unknown) => String(signal)),
  };
}

async function callOpenAi(request: AiAnalysisRequest): Promise<{ aiScore: number; aiSummary: string; aiReasons: string[] }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key is not configured');
  }

  const body = {
    model: OPENAI_MODEL,
    temperature: 0.15,
    max_tokens: 400,
    messages: [
      { role: 'system', content: SYSTEM_INSTRUCTIONS },
      {
        role: 'user',
        content: `Domain: ${request.domain}\nURL: ${request.url}\nDeterministic score: ${request.deterministicScore} (${request.deterministicFlags.join(', ')})\nHeuristic score: ${request.heuristicScore} (${request.heuristicReasons.join(', ')})\nExplain the semantic risk and provide signals.`,
      },
    ],
  };

  let attempt = 0;
  while (attempt < OPENAI_RETRIES) {
    attempt += 1;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`OpenAI error ${response.status}: ${text}`);
      }

      const payload = await response.json();
      const message = payload?.choices?.[0]?.message?.content;
      if (typeof message !== 'string') {
        throw new Error('OpenAI response missing message content');
      }

      const parsed = parseAiPayload(message);
      return {
        aiScore: parsed.aiScore,
        aiSummary: `${parsed.verdict.toUpperCase()}: ${parsed.summary}`,
        aiReasons: parsed.trustSignals,
      };
    } catch (error) {
      clearTimeout(timeout);
      const isTimeout = error instanceof Error && error.name === 'AbortError';
      if (isTimeout && attempt < OPENAI_RETRIES) {
        logger.warn({ domain: request.domain, attempt }, 'OpenAI call timed out, retrying');
        continue;
      }
      throw error;
    }
  }

  throw new Error('OpenAI retries exhausted');
}

async function runFallbackProvider(request: AiAnalysisRequest): Promise<{ aiScore: number; aiSummary: string; aiReasons: string[] }> {
  if (process.env.AI_FALLBACK_DISABLED === 'true') {
    throw new Error('Fallback provider disabled via config');
  }

  const baseScore = clampToRange(
    request.deterministicScore * 0.5 + request.heuristicScore * 0.4 + request.deterministicFlags.length * 2 + request.heuristicReasons.length * 2
  );

  const reasons = [
    'Fallback provider: deterministic + heuristic blend',
    ...request.deterministicFlags.slice(0, 2).map((flag) => `Flag: ${flag}`),
    ...request.heuristicReasons.slice(0, 2),
  ].filter(Boolean);

  return {
    aiScore: baseScore,
    aiSummary: `Fallback analysis for ${request.domain}`,
    aiReasons: reasons,
  };
}

export async function analyzeWithAi(request: AiAnalysisRequest): Promise<AiAnalysisResult> {
  try {
    const payload = await callOpenAi(request);
    logger.info({ domain: request.domain, aiScore: payload.aiScore }, 'AI analysis complete');
    return {
      aiScore: payload.aiScore,
      aiStatus: 'ok',
      aiReasons: payload.aiReasons,
      aiSummary: payload.aiSummary,
    };
  } catch (primaryError) {
    logger.warn({ domain: request.domain, err: primaryError instanceof Error ? primaryError.message : primaryError }, 'Primary AI provider failed');
    try {
      const fallback = await runFallbackProvider(request);
      logger.info({ domain: request.domain, aiScore: fallback.aiScore }, 'Fallback AI analysis used');
      return {
        aiScore: fallback.aiScore,
        aiStatus: 'fallback',
        aiReasons: fallback.aiReasons,
        aiSummary: fallback.aiSummary,
      };
    } catch (fallbackError) {
      logger.error({ domain: request.domain, err: fallbackError instanceof Error ? fallbackError.message : fallbackError }, 'Fallback AI provider failed');
      return {
        aiScore: null,
        aiStatus: 'skipped',
        aiReasons: ['AI providers unavailable'],
      };
    }
  }
}

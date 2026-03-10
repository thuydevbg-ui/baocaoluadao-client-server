/**
 * Risk Analysis handler
 * POST /api/risk/analyze
 */

import { createJsonResponse, createErrorResponse, sanitizeInput, isValidUrl, isValidPhone, isValidDomain } from '../utils';
import type { Env } from '../types';
import type { RiskAnalyzeRequest } from '../types';

export async function handleRiskAnalyze(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const origin = request.headers.get('Origin');

  try {
    const body: RiskAnalyzeRequest = await request.json();

    // Validate required fields
    if (!body.type || !body.value) {
      return createErrorResponse('type and value are required', 400, origin, corsHeaders);
    }

    // Validate type
    const validTypes = ['website', 'phone', 'email'];
    if (!validTypes.includes(body.type)) {
      return createErrorResponse('Invalid type. Must be: website, phone, or email', 400, origin, corsHeaders);
    }

    const value = sanitizeInput(body.value, 500);

    // Validate value based on type
    let isValid = false;
    switch (body.type) {
      case 'website':
        isValid = isValidDomain(value) || isValidUrl(value);
        break;
      case 'phone':
        isValid = isValidPhone(value);
        break;
      case 'email':
        isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        break;
    }

    if (!isValid) {
      return createErrorResponse('Invalid value format for the given type', 400, origin, corsHeaders);
    }

    // Perform risk analysis
    // In production, this would query multiple sources:
    // - Local database
    // - Google Web Risk
    // - PhishTank
    // - Custom threat intelligence
    const riskAnalysis = await analyzeRisk(body.type, value, env);

    return createJsonResponse({
      success: true,
      ...riskAnalysis,
    }, 200, origin, corsHeaders);

  } catch (error) {
    if (error instanceof SyntaxError) {
      return createErrorResponse('Invalid JSON body', 400, origin, corsHeaders);
    }
    throw error;
  }
}

async function analyzeRisk(type: string, value: string, env: Env): Promise<object> {
  // In production, perform comprehensive analysis
  // For now, return basic response
  
  // Check cache first
  const cacheKey = `risk:${type}:${value}`;
  
  if (env.CACHE) {
    try {
      const cached = await env.CACHE.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      // Continue with analysis
    }
  }

  const result = {
    type,
    value,
    riskLevel: 'unknown',
    riskScore: 0,
    factors: [],
    recommendation: 'Unable to determine risk level',
    analyzedAt: new Date().toISOString(),
  };

  // Cache the result
  if (env.CACHE) {
    await env.CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 3600 });
  }

  return result;
}

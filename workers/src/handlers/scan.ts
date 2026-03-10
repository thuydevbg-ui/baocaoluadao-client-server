/**
 * Website scanning handler
 * POST /api/scan
 */

import { createJsonResponse, createErrorResponse, isValidDomain, sanitizeInput } from '../utils';
import type { Env } from '../types';

export async function handleScan(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const origin = request.headers.get('Origin');

  try {
    const body = await request.json();
    const url = typeof body.url === 'string' ? body.url : (typeof body.domain === 'string' ? body.domain : '');

    if (!url.trim()) {
      return createErrorResponse('url or domain is required', 400, origin, corsHeaders);
    }

    const domain = sanitizeInput(url, 253).toLowerCase();
    
    if (!isValidDomain(domain)) {
      return createErrorResponse('Invalid domain format', 400, origin, corsHeaders);
    }

    // Perform scan - In production, integrate with:
    // 1. Google Web Risk API
    // 2. PhishTank
    // 3. Local database lookup
    // 4. Custom scanning logic

    const scanResult = {
      domain: domain,
      scannedAt: new Date().toISOString(),
      threatDetected: false,
      threatTypes: [] as string[],
      riskScore: 0,
      details: {
        googleWebRisk: 'unknown',
        phishTank: 'unknown',
        localDb: 'unknown',
      },
    };

    // Check Google Web Risk if API key is available
    if (env.WEB_RISK_API_KEY) {
      try {
        const webRiskResult = await checkWebRisk(domain, env.WEB_RISK_API_KEY);
        scanResult.threatDetected = webRiskResult.threatDetected;
        scanResult.threatTypes = webRiskResult.threatTypes;
        scanResult.details.googleWebRisk = webRiskResult.threatDetected ? 'threat_found' : 'clean';
      } catch (e) {
        scanResult.details.googleWebRisk = 'error';
      }
    }

    // Calculate risk score based on findings
    if (scanResult.threatTypes.includes('MALWARE')) {
      scanResult.riskScore = 100;
    } else if (scanResult.threatTypes.includes('SOCIAL_ENGINEERING')) {
      scanResult.riskScore = 80;
    } else if (scanResult.threatTypes.includes('UNWANTED_SOFTWARE')) {
      scanResult.riskScore = 50;
    }

    // Cache the result for 5 minutes
    ctx.waitUntil(cacheScanResult(env, domain, scanResult));

    return createJsonResponse({
      success: true,
      ...scanResult,
    }, 200, origin, {
      ...corsHeaders,
      'Cache-Control': 'public, max-age=300',
    });

  } catch (error) {
    if (error instanceof SyntaxError) {
      return createErrorResponse('Invalid JSON body', 400, origin, corsHeaders);
    }
    throw error;
  }
}

async function checkWebRisk(domain: string, apiKey: string): Promise<{ threatDetected: boolean; threatTypes: string[] }> {
  const endpoint = `https://webrisk.googleapis.com/v1/uris:search?threatTypes=MALWARE&threatTypes=SOCIAL_ENGINEERING&threatTypes=UNWANTED_SOFTWARE&uri=${encodeURIComponent('http://' + domain)}`;
  
  const response = await fetch(endpoint, {
    headers: {
      'Key': apiKey,
    },
  });

  if (!response.ok) {
    return { threatDetected: false, threatTypes: [] };
  }

  const data = await response.json();
  
  if (data.threat) {
    return {
      threatDetected: true,
      threatTypes: data.threat.threatTypes || [],
    };
  }

  return { threatDetected: false, threatTypes: [] };
}

async function cacheScanResult(env: Env, domain: string, result: object): Promise<void> {
  if (env.CACHE) {
    await env.CACHE.put(`scan:${domain}`, JSON.stringify(result), { expirationTtl: 300 });
  }
}

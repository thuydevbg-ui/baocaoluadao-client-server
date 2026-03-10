/**
 * Report submission handler
 * POST /api/report
 */

import { createJsonResponse, createErrorResponse, sanitizeInput, isValidUrl, isValidPhone } from '../utils';
import type { Env } from '../types';
import type { ReportRequest } from '../types';

export async function handleReport(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const origin = request.headers.get('Origin');

  try {
    const body: ReportRequest = await request.json();

    // Validate required fields
    if (!body.type || !body.target || !body.description) {
      return createErrorResponse('Missing required fields: type, target, description', 400, origin, corsHeaders);
    }

    // Validate type
    const validTypes = ['website', 'phone', 'email', 'social', 'sms'];
    if (!validTypes.includes(body.type)) {
      return createErrorResponse('Invalid report type', 400, origin, corsHeaders);
    }

    // Validate target based on type
    let isValidTarget = false;
    const target = sanitizeInput(body.target, 500);

    switch (body.type) {
      case 'website':
        isValidTarget = isValidUrl(target);
        break;
      case 'phone':
        isValidTarget = isValidPhone(target);
        break;
      case 'email':
        isValidTarget = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target);
        break;
      default:
        isValidTarget = target.length >= 3;
    }

    if (!isValidTarget) {
      return createErrorResponse('Invalid target format', 400, origin, corsHeaders);
    }

    // Sanitize description
    const description = sanitizeInput(body.description, 5000);

    // Create report - In production, this would write to database
    // For now, we return a success response
    const reportId = crypto.randomUUID();
    const report = {
      id: reportId,
      type: body.type,
      target: target,
      description: description,
      reporterEmail: body.reporterEmail ? sanitizeInput(body.reporterEmail, 255) : undefined,
      reporterName: body.reporterName ? sanitizeInput(body.reporterName, 100) : undefined,
      source: body.source || 'community',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    // TODO: Store in database (via Cloudflare Tunnel or D1)
    // const db = await getDatabaseConnection(env);
    // await db.insert('reports').values(report);

    return createJsonResponse({
      success: true,
      message: 'Report submitted successfully',
      reportId: report.id,
      status: report.status,
    }, 201, origin, corsHeaders);

  } catch (error) {
    if (error instanceof SyntaxError) {
      return createErrorResponse('Invalid JSON body', 400, origin, corsHeaders);
    }
    throw error;
  }
}

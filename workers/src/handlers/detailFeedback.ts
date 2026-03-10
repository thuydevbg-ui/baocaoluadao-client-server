/**
 * Detail Feedback handler
 * POST /api/detail-feedback
 */

import { createJsonResponse, createErrorResponse, sanitizeInput, getClientIP } from '../utils';
import type { Env } from '../types';
import type { DetailFeedbackRequest } from '../types';

export async function handleDetailFeedback(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const origin = request.headers.get('Origin');

  try {
    const body: DetailFeedbackRequest = await request.json();

    // Validate required fields
    if (!body.action || !body.detailKey) {
      return createErrorResponse('action and detailKey are required', 400, origin, corsHeaders);
    }

    // Validate action
    const validActions = ['rate', 'comment', 'helpful'];
    if (!validActions.includes(body.action)) {
      return createErrorResponse('Invalid action', 400, origin, corsHeaders);
    }

    const detailKey = sanitizeInput(body.detailKey, 255);
    const ip = getClientIP(request);

    // Process based on action
    let result: object;

    switch (body.action) {
      case 'rate':
        if (typeof body.score !== 'number' || body.score < 1 || body.score > 5) {
          return createErrorResponse('score must be between 1 and 5', 400, origin, corsHeaders);
        }
        result = await handleRating(detailKey, body.score, ip, body.identityType || 'ip', env);
        break;

      case 'comment':
        if (!body.comment || body.comment.trim().length === 0) {
          return createErrorResponse('comment is required', 400, origin, corsHeaders);
        }
        result = await handleComment(detailKey, sanitizeInput(body.comment, 2000), ip, body.identityType || 'ip', env);
        break;

      case 'helpful':
        result = await handleHelpful(detailKey, ip, body.identityType || 'ip', env);
        break;

      default:
        return createErrorResponse('Invalid action', 400, origin, corsHeaders);
    }

    return createJsonResponse({
      success: true,
      ...result,
    }, 200, origin, corsHeaders);

  } catch (error) {
    if (error instanceof SyntaxError) {
      return createErrorResponse('Invalid JSON body', 400, origin, corsHeaders);
    }
    throw error;
  }
}

async function handleRating(detailKey: string, score: number, ip: string, identityType: string, env: Env): Promise<object> {
  // In production, store in database
  // For now, return success
  return {
    action: 'rate',
    detailKey,
    score,
    identityType,
    timestamp: new Date().toISOString(),
  };
}

async function handleComment(detailKey: string, comment: string, ip: string, identityType: string, env: Env): Promise<object> {
  // In production, store in database
  // For now, return success
  return {
    action: 'comment',
    detailKey,
    commentLength: comment.length,
    identityType,
    timestamp: new Date().toISOString(),
  };
}

async function handleHelpful(detailKey: string, ip: string, identityType: string, env: Env): Promise<object> {
  // In production, store in database
  // For now, return success
  return {
    action: 'helpful',
    detailKey,
    identityType,
    timestamp: new Date().toISOString(),
  };
}

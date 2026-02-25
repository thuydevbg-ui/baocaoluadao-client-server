import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { parseSignedCookie } from '@/lib/auth';

// In-memory feedback store using global Map
// SECURITY & DEPLOYMENT WARNING:
// - This implementation does NOT persist across serverless function cold starts
// - In serverless environments (Vercel, AWS Lambda), the process may be terminated and
//   restarted between requests, causing all feedback data to be lost
// - Does not work across multiple server instances
// FOR PRODUCTION:
// - Use a database (PostgreSQL, MongoDB, Redis) for persistent feedback
// - Recommended: Redis (for simple key-value), PostgreSQL (relational), MongoDB (flexible schema)
// - Set DATABASE_URL in environment variables and implement a database adapter

type FeedbackAction = 'rate' | 'comment' | 'helpful';
type IdentityType = 'user' | 'ip' | 'visitor';

interface StoredRating {
  score: number;
  createdAt: number;
  identityType: IdentityType;
}

interface StoredComment {
  id: string;
  user: string;
  avatar: string;
  text: string;
  authorIdentityKey: string;
  helpful: number;
  createdAt: number;
  verified: boolean;
  helpfulByIdentity: string[];
}

interface FeedbackEntry {
  ratingsByIdentity: Map<string, StoredRating>;
  comments: StoredComment[];
  lastActive: number;
}

interface IdentityInfo {
  key: string;
  type: IdentityType;
  visitorId?: string;
  setVisitorCookie: boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var __scamGuardDetailFeedbackStore: Map<string, FeedbackEntry> | undefined;
}

const feedbackStore = globalThis.__scamGuardDetailFeedbackStore ?? new Map<string, FeedbackEntry>();
if (!globalThis.__scamGuardDetailFeedbackStore) {
  globalThis.__scamGuardDetailFeedbackStore = feedbackStore;
}

const MAX_COMMENT_LENGTH = 600;
const MAX_COMMENT_SENTENCES = 20;
const MAX_COMMENTS_PER_DETAIL = 150;
const MAX_DETAIL_ENTRIES = 500;

const DEFAULT_DISTRIBUTION = {
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
} as Record<number, number>;

function sanitizePlainText(input: string): string {
  return input
    .replace(/\r\n/g, '\n')
    .replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '')
    .trim();
}

function countSentences(input: string): number {
  const normalized = input.replace(/\n+/g, ' ').trim();
  if (!normalized) return 0;
  const parts = normalized.split(/[.!?…]+/).map((part) => part.trim()).filter(Boolean);
  return parts.length > 0 ? parts.length : 1;
}

function normalizeDetailKey(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return sanitizePlainText(raw).toLowerCase().slice(0, 220);
}

function parseUserFromCookie(request: NextRequest): string | null {
  const cookie = request.cookies.get('adminAuth')?.value;
  if (!cookie) return null;

  try {
    // Use the shared utility to properly parse and verify the signed cookie
    const auth = parseSignedCookie(cookie);
    if (auth && auth.email) {
      return `user:${auth.email.toLowerCase()}`;
    }
  } catch {
    // Invalid cookie format - return null
  }
  return null;
}

function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfIP = request.headers.get('cf-connecting-ip');
  const requestIP = (request as NextRequest & { ip?: string }).ip;

  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  if (realIP) return realIP.trim();
  if (cfIP) return cfIP.trim();
  if (requestIP) return requestIP.trim();
  return 'unknown';
}

function resolveIdentity(request: NextRequest): IdentityInfo {
  const cookieUserIdentity = parseUserFromCookie(request);
  if (cookieUserIdentity) {
    return { key: cookieUserIdentity, type: 'user', setVisitorCookie: false };
  }

  const userIdHeader = request.headers.get('x-user-id');
  if (userIdHeader && userIdHeader.trim()) {
    return {
      key: `user:${userIdHeader.trim().toLowerCase().slice(0, 80)}`,
      type: 'user',
      setVisitorCookie: false,
    };
  }

  const ip = getClientIP(request);
  if (ip && ip !== 'unknown') {
    return { key: `ip:${ip}`, type: 'ip', setVisitorCookie: false };
  }

  const existingVisitorId = request.cookies.get('sg_visitor_id')?.value;
  if (existingVisitorId && /^[a-zA-Z0-9-]{8,80}$/.test(existingVisitorId)) {
    return {
      key: `visitor:${existingVisitorId}`,
      type: 'visitor',
      visitorId: existingVisitorId,
      setVisitorCookie: false,
    };
  }

  const newVisitorId = crypto.randomUUID();
  return {
    key: `visitor:${newVisitorId}`,
    type: 'visitor',
    visitorId: newVisitorId,
    setVisitorCookie: true,
  };
}

function withVisitorCookie(response: NextResponse, identity: IdentityInfo): NextResponse {
  if (identity.type === 'visitor' && identity.visitorId && identity.setVisitorCookie) {
    response.cookies.set('sg_visitor_id', identity.visitorId, {
      httpOnly: true, // Fixed: now httpOnly to prevent XSS theft
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return response;
}

function ensureEntry(detailKey: string): FeedbackEntry {
  let entry = feedbackStore.get(detailKey);
  if (!entry) {
    entry = {
      ratingsByIdentity: new Map<string, StoredRating>(),
      comments: [],
      lastActive: Date.now(),
    };
    feedbackStore.set(detailKey, entry);
    pruneStore();
  }

  // Backward-compatible normalization for comments created by previous runtime versions.
  entry.comments = entry.comments.map((comment) => ({
    ...comment,
    authorIdentityKey: typeof comment.authorIdentityKey === 'string' ? comment.authorIdentityKey : '',
    verified: Boolean(comment.verified),
    helpfulByIdentity: Array.isArray(comment.helpfulByIdentity) ? comment.helpfulByIdentity : [],
    helpful: Number.isFinite(comment.helpful) && comment.helpful >= 0 ? comment.helpful : 0,
  }));

  entry.lastActive = Date.now();
  return entry;
}

function pruneStore(): void {
  if (feedbackStore.size <= MAX_DETAIL_ENTRIES) return;

  const removable = Array.from(feedbackStore.entries())
    .sort((a, b) => a[1].lastActive - b[1].lastActive)
    .slice(0, feedbackStore.size - MAX_DETAIL_ENTRIES);

  removable.forEach(([key]) => feedbackStore.delete(key));
}

function buildRatingStats(entry: FeedbackEntry) {
  const distribution = { ...DEFAULT_DISTRIBUTION };
  let total = 0;
  let sum = 0;

  entry.ratingsByIdentity.forEach((rating) => {
    if (rating.score >= 1 && rating.score <= 5) {
      distribution[rating.score] = (distribution[rating.score] || 0) + 1;
      total += 1;
      sum += rating.score;
    }
  });

  const average = total > 0 ? Math.round((sum / total) * 10) / 10 : 0;
  return { average, total, distribution };
}

function buildResponsePayload(entry: FeedbackEntry, identity: IdentityInfo) {
  const myRating = entry.ratingsByIdentity.get(identity.key)?.score ?? null;
  return {
    ratingStats: buildRatingStats(entry),
    myRating,
    canRate: myRating === null,
    comments: entry.comments
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((item) => {
        const authorRating = item.authorIdentityKey
          ? entry.ratingsByIdentity.get(item.authorIdentityKey)?.score ?? null
          : null;

        return {
          id: item.id,
          user: item.user,
          avatar: item.avatar,
          text: item.text,
          helpful: item.helpful,
          rating: authorRating,
          verified: item.verified,
          helpfulMarked: item.helpfulByIdentity.includes(identity.key),
          canMarkHelpful: !item.helpfulByIdentity.includes(identity.key),
          createdAt: new Date(item.createdAt).toISOString(),
        };
      }),
  };
}

function buildAvatar(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return 'U';
  const first = Array.from(trimmed)[0];
  return first.toUpperCase();
}

export async function GET(request: NextRequest) {
  const detailKey = normalizeDetailKey(new URL(request.url).searchParams.get('detailKey'));
  if (!detailKey) {
    const response = NextResponse.json(
      { success: false, error: 'detailKey is required' },
      { status: 400 }
    );
    return response;
  }

  const identity = resolveIdentity(request);
  const entry = ensureEntry(detailKey);
  const payload = buildResponsePayload(entry, identity);
  const response = NextResponse.json({
    success: true,
    detailKey,
    ...payload,
  });

  return withVisitorCookie(response, identity);
}

export async function POST(request: NextRequest) {
  let body: {
    action?: FeedbackAction;
    detailKey?: string;
    score?: number;
    text?: string;
    userName?: string;
    commentId?: string;
  } = {};

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
  }

  const detailKey = normalizeDetailKey(body.detailKey);
  if (!detailKey) {
    return NextResponse.json({ success: false, error: 'detailKey is required' }, { status: 400 });
  }

  const action = body.action;
  if (action !== 'rate' && action !== 'comment' && action !== 'helpful') {
    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  }

  const identity = resolveIdentity(request);
  const entry = ensureEntry(detailKey);

  if (action === 'rate') {
    const score = Number(body.score);
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      return NextResponse.json({ success: false, error: 'score must be an integer from 1 to 5' }, { status: 400 });
    }

    if (entry.ratingsByIdentity.has(identity.key)) {
      const payload = buildResponsePayload(entry, identity);
      const response = NextResponse.json(
        {
          success: false,
          error: 'Bạn đã đánh giá trước đó. Mỗi IP hoặc tài khoản chỉ đánh giá 1 lần và không thể chỉnh sửa.',
          detailKey,
          ...payload,
        },
        { status: 409 }
      );
      return withVisitorCookie(response, identity);
    }

    entry.ratingsByIdentity.set(identity.key, {
      score,
      createdAt: Date.now(),
      identityType: identity.type,
    });
    entry.lastActive = Date.now();

    const payload = buildResponsePayload(entry, identity);
    const response = NextResponse.json({
      success: true,
      message: 'Đánh giá của bạn đã được ghi nhận.',
      detailKey,
      ...payload,
    });
    return withVisitorCookie(response, identity);
  }

  if (action === 'helpful') {
    const commentId = sanitizePlainText(typeof body.commentId === 'string' ? body.commentId : '').slice(0, 80);
    if (!commentId) {
      return NextResponse.json({ success: false, error: 'commentId is required' }, { status: 400 });
    }

    const targetComment = entry.comments.find((item) => item.id === commentId);
    if (!targetComment) {
      return NextResponse.json({ success: false, error: 'Comment not found' }, { status: 404 });
    }

    if (targetComment.helpfulByIdentity.includes(identity.key)) {
      const payload = buildResponsePayload(entry, identity);
      const response = NextResponse.json(
        {
          success: false,
          error: 'Bạn đã đánh dấu hữu ích cho bình luận này trước đó.',
          detailKey,
          ...payload,
        },
        { status: 409 }
      );
      return withVisitorCookie(response, identity);
    }

    targetComment.helpfulByIdentity.push(identity.key);
    targetComment.helpful += 1;
    entry.lastActive = Date.now();

    const payload = buildResponsePayload(entry, identity);
    const response = NextResponse.json({
      success: true,
      message: 'Đã ghi nhận bình chọn hữu ích của bạn.',
      detailKey,
      ...payload,
    });
    return withVisitorCookie(response, identity);
  }

  if (!entry.ratingsByIdentity.has(identity.key)) {
    const payload = buildResponsePayload(entry, identity);
    const response = NextResponse.json(
      {
        success: false,
        error: 'Vui lòng đánh giá sao trước khi gửi bình luận đầu tiên.',
        detailKey,
        ...payload,
      },
      { status: 403 }
    );
    return withVisitorCookie(response, identity);
  }

  const text = sanitizePlainText(typeof body.text === 'string' ? body.text : '');
  if (text.length < 3) {
    return NextResponse.json({ success: false, error: 'Bình luận cần tối thiểu 3 ký tự.' }, { status: 400 });
  }
  if (text.length > MAX_COMMENT_LENGTH) {
    return NextResponse.json(
      { success: false, error: `Bình luận tối đa ${MAX_COMMENT_LENGTH} ký tự.` },
      { status: 400 }
    );
  }
  if (countSentences(text) > MAX_COMMENT_SENTENCES) {
    return NextResponse.json(
      { success: false, error: `Đánh giá tối đa ${MAX_COMMENT_SENTENCES} câu.` },
      { status: 400 }
    );
  }

  const userName = sanitizePlainText(typeof body.userName === 'string' ? body.userName : '').slice(0, 40) || 'Người dùng';
  const comment: StoredComment = {
    id: crypto.randomUUID(),
    user: userName,
    avatar: buildAvatar(userName),
    text,
    authorIdentityKey: identity.key,
    helpful: 0,
    createdAt: Date.now(),
    verified: identity.type === 'user',
    helpfulByIdentity: [],
  };

  entry.comments.unshift(comment);
  if (entry.comments.length > MAX_COMMENTS_PER_DETAIL) {
    entry.comments = entry.comments.slice(0, MAX_COMMENTS_PER_DETAIL);
  }
  entry.lastActive = Date.now();

  const payload = buildResponsePayload(entry, identity);
  const response = NextResponse.json({
    success: true,
    message: 'Bình luận của bạn đã được đăng.',
    detailKey,
    ...payload,
  });
  return withVisitorCookie(response, identity);
}

import { withApiObservability } from '@/lib/apiHandler';
import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { parseSignedCookie } from '@/lib/auth';
import { applySecurityHeaders, createSecureJsonResponse, isRequestFromSameOrigin, rateLimitRequest } from '@/lib/apiSecurity';
import { getDb } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';
import { findUserByEmail } from '@/lib/userRepository';

// Database-based feedback with in-memory fallback
// PRODUCTION: Uses MySQL for persistent storage
// FALLBACK: Uses in-memory store if database is unavailable
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
  createdAt?: number; // Account creation timestamp for age verification
}

// Database row interfaces
interface DbRating extends RowDataPacket {
  id: number;
  detail_key: string;
  identity_key: string;
  score: number;
  identity_type: 'user' | 'ip' | 'visitor';
  created_at: number;
}

interface DbComment extends RowDataPacket {
  id: string;
  detail_key: string;
  user: string;
  avatar: string;
  text: string;
  author_identity_key: string;
  helpful: number;
  verified: boolean;
  created_at: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __scamGuardDetailFeedbackStore: Map<string, FeedbackEntry> | undefined;
  // eslint-disable-next-line no-var
  var __scamGuardDbAvailable: boolean | undefined;
}

// Track DB availability in module scope
let dbAvailable = true;

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

// ==========================================
// Database Helper Functions
// ==========================================

/**
 * Get ratings from database for a detail key
 */
async function getRatingsFromDb(detailKey: string): Promise<Map<string, { score: number; createdAt: number; identityType: string }>> {
  const ratings = new Map<string, { score: number; createdAt: number; identityType: string }>();
  
  if (!isDbAvailable()) return ratings;
  
  try {
    const db = getDb();
    const [rows] = await db.query<DbRating[]>(
      'SELECT identity_key, score, created_at, identity_type FROM detail_ratings WHERE detail_key = ?',
      [detailKey]
    );
    
    for (const row of rows) {
      ratings.set(row.identity_key, {
        score: row.score,
        createdAt: normalizeEpochMs(row.created_at),
        identityType: row.identity_type,
      });
    }
  } catch (error) {
    console.error('[DetailFeedback] Error fetching ratings from DB:', error);
  }
  
  return ratings;
}

/**
 * Get comments from database for a detail key
 */
async function getCommentsFromDb(detailKey: string): Promise<StoredComment[]> {
  const comments: StoredComment[] = [];
  
  if (!isDbAvailable()) return comments;
  
  try {
    const db = getDb();
    const [rows] = await db.query<DbComment[]>(
      'SELECT * FROM detail_feedback WHERE detail_key = ? ORDER BY created_at DESC LIMIT 150',
      [detailKey]
    );
    
    for (const row of rows as any[]) {
      comments.push({
        id: row.id,
        user: row.user,
        avatar: row.avatar,
        text: row.text,
        authorIdentityKey: row.author_identity_key,
        helpful: row.helpful,
        createdAt: normalizeEpochMs(row.created_at),
        verified: Boolean(row.verified),
        helpfulByIdentity: [],
      });
    }
  } catch (error) {
    console.error('[DetailFeedback] Error fetching comments from DB:', error);
  }
  
  return comments;
}

/**
 * Add rating to database
 */
async function addRatingToDb(
  detailKey: string,
  identityKey: string,
  score: number,
  identityType: string
): Promise<boolean> {
  if (!isDbAvailable()) return false;
  
  try {
    const db = getDb();
    await db.execute(
      'INSERT INTO detail_ratings (detail_key, identity_key, score, identity_type) VALUES (?, ?, ?, ?)',
      [detailKey, identityKey, score, identityType]
    );
    return true;
  } catch (error) {
    console.error('[DetailFeedback] Error adding rating to DB:', error);
    return false;
  }
}

/**
 * Add comment to database
 */
async function addCommentToDb(comment: StoredComment, detailKey: string): Promise<boolean> {
  if (!isDbAvailable()) return false;
  
  try {
    const db = getDb();
    await db.execute(
      'INSERT INTO detail_feedback (id, detail_key, user, avatar, text, author_identity_key, helpful, verified, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        comment.id,
        detailKey,
        comment.user,
        comment.avatar,
        comment.text,
        comment.authorIdentityKey,
        comment.helpful,
        comment.verified ? 1 : 0,
        normalizeEpochMs(comment.createdAt),
      ]
    );
    return true;
  } catch (error) {
    console.error('[DetailFeedback] Error adding comment to DB:', error);
    return false;
  }
}

/**
 * Update comment helpful count in database
 */
async function updateCommentHelpfulInDb(
  commentId: string,
  newHelpfulCount: number
): Promise<boolean> {
  if (!isDbAvailable()) return false;
  
  try {
    const db = getDb();
    await db.execute(
      'UPDATE detail_feedback SET helpful = ? WHERE id = ?',
      [newHelpfulCount, commentId]
    );
    return true;
  } catch (error) {
    console.error('[DetailFeedback] Error updating comment helpful in DB:', error);
    return false;
  }
}

function sanitizePlainText(input: string): string {
  return input
    .replace(/\r\n/g, '\n')
    .replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '')
    .trim();
}

function countSentences(input: string): number {
  const normalized = input.replace(/\n+/g, ' ').trim();
  if (!normalized) return 0;
  const parts = normalized.split(/[.!?â€¦]+/).map((part) => part.trim()).filter(Boolean);
  return parts.length > 0 ? parts.length : 1;
}

function normalizeEpochMs(raw: unknown): number {
  if (raw instanceof Date) {
    const time = raw.getTime();
    return Number.isFinite(time) ? time : Date.now();
  }

  const asNumber = typeof raw === 'number' ? raw : Number.parseInt(String(raw ?? ''), 10);
  if (!Number.isFinite(asNumber) || asNumber <= 0) return Date.now();

  // MySQL BIGINT column accidentally written with NOW() can become yyyymmddhhmmss (e.g. 20260306123456).
  if (asNumber >= 20000101000000 && asNumber <= 20991231235959) {
    const year = Math.floor(asNumber / 10000000000);
    const month = Math.floor(asNumber / 100000000) % 100;
    const day = Math.floor(asNumber / 1000000) % 100;
    const hour = Math.floor(asNumber / 10000) % 100;
    const minute = Math.floor(asNumber / 100) % 100;
    const second = asNumber % 100;
    const utc = Date.UTC(year, Math.max(0, month - 1), day, hour, minute, second);
    return Number.isFinite(utc) ? utc : Date.now();
  }

  // Seconds → milliseconds (e.g. 1700000000).
  if (asNumber < 100_000_000_000) {
    return asNumber * 1000;
  }

  const now = Date.now();
  if (asNumber > now + 1000 * 60 * 60 * 24 * 365 * 5) {
    return now;
  }

  return asNumber;
}

function normalizeDetailKey(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return sanitizePlainText(raw).toLowerCase().slice(0, 220);
}

function parseUserFromCookie(request: NextRequest): { identity: string; name: string } | null {
  const cookie = request.cookies.get('adminAuth')?.value;
  if (!cookie) return null;

  try {
    const auth = parseSignedCookie(cookie);
    if (auth && auth.email) {
      return {
        identity: `user:${auth.email.toLowerCase()}`,
        name: auth.name || auth.email.split('@')[0]
      };
    }
  } catch {
    // Invalid cookie format - return null
  }
  return null;
}

/**
 * Get user account creation timestamp from database
 */
async function getUserCreatedAt(email: string): Promise<number | undefined> {
  try {
    const user = await findUserByEmail(email);
    if (user && user.createdAt) {
      return new Date(user.createdAt).getTime();
    }
  } catch (e) {
    console.warn('[DetailFeedback] Could not fetch user createdAt:', e);
  }
  return undefined;
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

function resolveIdentity(request: NextRequest): IdentityInfo & { userName?: string } {
  const cookieUser = parseUserFromCookie(request);
  if (cookieUser) {
    return { key: cookieUser.identity, type: 'user', setVisitorCookie: false, userName: cookieUser.name };
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
  return applySecurityHeaders(response);
}

function ensureEntry(detailKey: string): FeedbackEntry {
  // Try to get from memory cache first
  let entry = feedbackStore.get(detailKey);
  
  // If not in memory, try to load from database
  if (!entry) {
    // Load from database asynchronously (fire and forget for now)
    // The data will be available on next request
    getRatingsFromDb(detailKey).then((ratings) => {
      getCommentsFromDb(detailKey).then((comments) => {
        if (ratings.size > 0 || comments.length > 0) {
          const cachedEntry: FeedbackEntry = {
            ratingsByIdentity: ratings as Map<string, StoredRating>,
            comments,
            lastActive: Date.now(),
          };
          feedbackStore.set(detailKey, cachedEntry);
        }
      });
    }).catch(console.error);
    
    // Create empty entry while loading
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

// ============================================
// DATABASE HELPER FUNCTIONS
// ============================================

/**
 * Check if database is available - try to actually connect
 */
function isDbAvailable(): boolean {
  try {
    const db = getDb();
    return db !== undefined;
  } catch {
    dbAvailable = false;
    return false;
  }
}

/**
 * Get all ratings for a detail key from database
 */
async function getRatingsByDetailKey(detailKey: string): Promise<DbRating[]> {
  if (!isDbAvailable()) return [];
  
  try {
    const db = getDb();
    const [rows] = await db.query<DbRating[]>(
      'SELECT id, detail_key, identity_key, score, identity_type, created_at FROM detail_ratings WHERE detail_key = ?',
      [detailKey]
    );
    return rows;
  } catch (error) {
    console.error('[DetailFeedback] getRatingsByDetailKey error:', error);
    dbAvailable = false;
    return [];
  }
}

/**
 * Get all comments for a detail key from database
 */
async function getCommentsByDetailKey(detailKey: string): Promise<DbComment[]> {
  if (!isDbAvailable()) return [];
  
  try {
    const db = getDb();
    const [rows] = await db.query<DbComment[]>(
      'SELECT id, detail_key, user, avatar, text, author_identity_key, helpful, verified, created_at FROM detail_feedback WHERE detail_key = ? ORDER BY created_at DESC',
      [detailKey]
    );
    return rows;
  } catch (error) {
    console.error('[DetailFeedback] getCommentsByDetailKey error:', error);
    dbAvailable = false;
    return [];
  }
}

/**
 * Check if identity has already rated a detail
 */
async function getExistingRating(detailKey: string, identityKey: string): Promise<DbRating | null> {
  if (!isDbAvailable()) return null;
  
  try {
    const db = getDb();
    const [rows] = await db.query<DbRating[]>(
      'SELECT id, detail_key, identity_key, score, identity_type, created_at FROM detail_ratings WHERE detail_key = ? AND identity_key = ?',
      [detailKey, identityKey]
    );
    return rows[0] || null;
  } catch (error) {
    console.error('[DetailFeedback] getExistingRating error:', error);
    dbAvailable = false;
    return null;
  }
}

/**
 * Add a new rating to database
 */
async function addRating(detailKey: string, identityKey: string, score: number, identityType: IdentityType): Promise<boolean> {
  if (!isDbAvailable()) return false;
  
  try {
    const db = getDb();
    await db.execute(
      'INSERT INTO detail_ratings (detail_key, identity_key, score, identity_type) VALUES (?, ?, ?, ?)',
      [detailKey, identityKey, score, identityType]
    );
    return true;
  } catch (error) {
    console.error('[DetailFeedback] addRating error:', error);
    dbAvailable = false;
    return false;
  }
}

/**
 * Add a new comment to database
 */
async function addComment(
  detailKey: string,
  user: string,
  avatar: string,
  text: string,
  authorIdentityKey: string,
  verified: boolean
): Promise<string | null> {
  if (!isDbAvailable()) return null;
  
  try {
    const db = getDb();
    const id = crypto.randomUUID();
    await db.execute(
      'INSERT INTO detail_feedback (id, detail_key, user, avatar, text, author_identity_key, helpful, verified) VALUES (?, ?, ?, ?, ?, ?, 0, ?)',
      [id, detailKey, user, avatar, text, authorIdentityKey, verified]
    );
    return id;
  } catch (error) {
    console.error('[DetailFeedback] addComment error:', error);
    dbAvailable = false;
    return null;
  }
}

/**
 * Increment helpful count for a comment
 */
async function updateCommentHelpful(commentId: string): Promise<boolean> {
  if (!isDbAvailable()) return false;
  
  try {
    const db = getDb();
    await db.execute(
      'UPDATE detail_feedback SET helpful = helpful + 1 WHERE id = ?',
      [commentId]
    );
    return true;
  } catch (error) {
    console.error('[DetailFeedback] updateCommentHelpful error:', error);
    dbAvailable = false;
    return false;
  }
}

// ============================================
// RESPONSE BUILDING FUNCTIONS
// ============================================

function buildRatingStatsFromDb(ratings: DbRating[]) {
  const distribution = { ...DEFAULT_DISTRIBUTION };
  let total = 0;
  let sum = 0;

  ratings.forEach((rating) => {
    if (rating.score >= 1 && rating.score <= 5) {
      distribution[rating.score] = (distribution[rating.score] || 0) + 1;
      total += 1;
      sum += rating.score;
    }
  });

  const average = total > 0 ? Math.round((sum / total) * 10) / 10 : 0;
  return { average, total, distribution };
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

function buildResponsePayloadFromDb(
  ratings: DbRating[],
  comments: DbComment[],
  identity: IdentityInfo
) {
  const myRating = ratings.find(r => r.identity_key === identity.key)?.score ?? null;
  
  return {
    ratingStats: buildRatingStatsFromDb(ratings),
    myRating,
    canRate: myRating === null,
    comments: comments.map((item) => {
      const authorRating = ratings.find(r => r.identity_key === item.author_identity_key)?.score ?? null;
      
      return {
        id: item.id,
        user: item.user,
        avatar: item.avatar,
        text: item.text,
        helpful: item.helpful,
        rating: authorRating,
        verified: Boolean(item.verified),
        helpfulMarked: false, // Will be tracked in memory for DB mode
        canMarkHelpful: true,
        createdAt: new Date(normalizeEpochMs(item.created_at)).toISOString(),
      };
    }),
  };
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

export const GET = withApiObservability(async (request: NextRequest) => {
  if (!isRequestFromSameOrigin(request)) {
    return createSecureJsonResponse({ success: false, error: 'Forbidden request origin' }, { status: 403 });
  }
  const rateLimit = rateLimitRequest(request, {
    keyPrefix: 'detail-feedback:get',
    windowMs: 60_000,
    maxRequests: 120,
  });
  if (!rateLimit.ok) {
    return createSecureJsonResponse({ success: false, error: 'Too many requests' }, { status: 429 }, rateLimit);
  }

  const detailKey = normalizeDetailKey(new URL(request.url).searchParams.get('detailKey'));
  if (!detailKey) {
    const response = createSecureJsonResponse(
      { success: false, error: 'detailKey is required' },
      { status: 400 },
      rateLimit
    );
    return response;
  }

  const identity = resolveIdentity(request);

  // Try database first, fallback to in-memory
  if (isDbAvailable()) {
    try {
      const ratings = await getRatingsByDetailKey(detailKey);
      const comments = await getCommentsByDetailKey(detailKey);
      
      if (ratings.length > 0 || comments.length > 0) {
        const payload = buildResponsePayloadFromDb(ratings, comments, identity);
        const response = createSecureJsonResponse({
          success: true,
          detailKey,
          ...payload,
        }, { status: 200 }, rateLimit);
        return withVisitorCookie(response, identity);
      }
    } catch (error) {
      console.error('[DetailFeedback] GET database fallback:', error);
    }
  }

  // Fallback to in-memory store
  const entry = ensureEntry(detailKey);
  const payload = buildResponsePayload(entry, identity);
  const response = createSecureJsonResponse({
    success: true,
    detailKey,
    ...payload,
  }, { status: 200 }, rateLimit);

  return withVisitorCookie(response, identity);
});

export const POST = withApiObservability(async (request: NextRequest) => {
  if (!isRequestFromSameOrigin(request)) {
    return createSecureJsonResponse({ success: false, error: 'Forbidden request origin' }, { status: 403 });
  }
  const rateLimit = rateLimitRequest(request, {
    keyPrefix: 'detail-feedback:post',
    windowMs: 60_000,
    maxRequests: 45,
  });
  if (!rateLimit.ok) {
    return createSecureJsonResponse({ success: false, error: 'Too many requests' }, { status: 429 }, rateLimit);
  }

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
    return createSecureJsonResponse({ success: false, error: 'Invalid JSON payload' }, { status: 400 }, rateLimit);
  }

  const detailKey = normalizeDetailKey(body.detailKey);
  if (!detailKey) {
    return createSecureJsonResponse({ success: false, error: 'detailKey is required' }, { status: 400 }, rateLimit);
  }

  const action = body.action;
  if (action !== 'rate' && action !== 'comment' && action !== 'helpful') {
    return createSecureJsonResponse({ success: false, error: 'Invalid action' }, { status: 400 }, rateLimit);
  }

  const identity = resolveIdentity(request);

  // Verify logged-in user for comment and rate actions
  // Comments and ratings require authenticated users with minimum account age of 24 hours
  if ((action === 'comment' || action === 'rate') && identity.type !== 'user') {
    return createSecureJsonResponse(
      {
        success: false,
        error: 'Vui lòng đăng nhập để bình luận hoặc đánh giá.',
        requireAuth: true
      },
      { status: 403 },
      rateLimit
    );
  }

  // Check account age for logged-in users (minimum 24 hours)
  if (identity.type === 'user') {
    const cookieUser = parseUserFromCookie(request);
    if (cookieUser) {
      const email = cookieUser.identity.replace('user:', '');
      const createdAt = await getUserCreatedAt(email);
      if (createdAt) {
        const accountAge = Date.now() - createdAt;
        const MIN_ACCOUNT_AGE = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        if (accountAge < MIN_ACCOUNT_AGE) {
          const hoursLeft = Math.ceil((MIN_ACCOUNT_AGE - accountAge) / (60 * 60 * 1000));
          return createSecureJsonResponse(
            {
              success: false,
              error: `Tài khoản cần hoạt động tối thiểu 24 giờ để bình luận. Vui lòng đợi ${hoursLeft} giờ nữa.`,
              requireAuth: true,
              accountAgeHours: Math.floor(accountAge / (60 * 60 * 1000))
            },
            { status: 403 },
            rateLimit
          );
        }
      }
    }
  }

  // Try database operations first
  if (isDbAvailable()) {
    try {
      // Handle rate action with database
      if (action === 'rate') {
        const score = Number(body.score);
        if (!Number.isInteger(score) || score < 1 || score > 5) {
          return createSecureJsonResponse({ success: false, error: 'score must be an integer from 1 to 5' }, { status: 400 }, rateLimit);
        }

        const existingRating = await getExistingRating(detailKey, identity.key);
        if (existingRating) {
          const ratings = await getRatingsByDetailKey(detailKey);
          const comments = await getCommentsByDetailKey(detailKey);
          const payload = buildResponsePayloadFromDb(ratings, comments, identity);
          const response = createSecureJsonResponse(
            {
              success: false,
              error: 'Bạn đã đánh giá trước đó. Mỗi IP hoặc tài khoản chỉ đánh giá 1 lần và không thể chỉnh sửa.',
              detailKey,
              ...payload,
            },
            { status: 409 },
            rateLimit
          );
          return withVisitorCookie(response, identity);
        }

        const added = await addRating(detailKey, identity.key, score, identity.type);
        if (!added) {
          // Fallback to in-memory
          const entry = ensureEntry(detailKey);
          if (entry.ratingsByIdentity.has(identity.key)) {
            const payload = buildResponsePayload(entry, identity);
            const response = createSecureJsonResponse(
              {
                success: false,
                error: 'Bạn đã đánh giá trước đó. Mỗi IP hoặc tài khoản chỉ đánh giá 1 lần và không thể chỉnh sửa.',
                detailKey,
                ...payload,
              },
              { status: 409 },
              rateLimit
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
          const response = createSecureJsonResponse({
            success: true,
            message: 'Đánh giá của bạn đã được ghi nhận.',
            detailKey,
            ...payload,
          }, { status: 200 }, rateLimit);
          return withVisitorCookie(response, identity);
        }

        const ratings = await getRatingsByDetailKey(detailKey);
        const comments = await getCommentsByDetailKey(detailKey);
        const payload = buildResponsePayloadFromDb(ratings, comments, identity);
        const response = createSecureJsonResponse({
          success: true,
          message: 'Đánh giá của bạn đã được ghi nhận.',
          detailKey,
          ...payload,
        }, { status: 200 }, rateLimit);
        return withVisitorCookie(response, identity);
      }

      // Handle helpful action with database
      if (action === 'helpful') {
        const commentId = sanitizePlainText(typeof body.commentId === 'string' ? body.commentId : '').slice(0, 80);
        if (!commentId) {
          return createSecureJsonResponse({ success: false, error: 'commentId is required' }, { status: 400 }, rateLimit);
        }

        const comments = await getCommentsByDetailKey(detailKey);
        const targetComment = comments.find(item => item.id === commentId);
        
        if (!targetComment) {
          // Try in-memory fallback
          const entry = ensureEntry(detailKey);
          const memComment = entry.comments.find(item => item.id === commentId);
          if (!memComment) {
            return createSecureJsonResponse({ success: false, error: 'Comment not found' }, { status: 404 }, rateLimit);
          }
          
          if (memComment.helpfulByIdentity.includes(identity.key)) {
            const payload = buildResponsePayload(entry, identity);
            const response = createSecureJsonResponse(
              {
                success: false,
                error: 'Bạn đã đánh dấu hữu ích cho bình luận này trước đó.',
                detailKey,
                ...payload,
              },
              { status: 409 },
              rateLimit
            );
            return withVisitorCookie(response, identity);
          }
          
          memComment.helpfulByIdentity.push(identity.key);
          memComment.helpful += 1;
          entry.lastActive = Date.now();
          
          const payload = buildResponsePayload(entry, identity);
          const response = createSecureJsonResponse({
            success: true,
            message: 'Đã ghi nhận bình chọn hữu ích của bạn.',
            detailKey,
            ...payload,
          }, { status: 200 }, rateLimit);
          return withVisitorCookie(response, identity);
        }

        // Check if user already marked helpful (track in memory for DB mode)
        const entry = ensureEntry(detailKey);
        const memComment = entry.comments.find(c => c.id === commentId);
        if (memComment && memComment.helpfulByIdentity.includes(identity.key)) {
          const ratings = await getRatingsByDetailKey(detailKey);
          const payload = buildResponsePayloadFromDb(ratings, comments, identity);
          const response = createSecureJsonResponse(
            {
              success: false,
              error: 'Bạn đã đánh dấu hữu ích cho bình luận này trước đó.',
              detailKey,
              ...payload,
            },
            { status: 409 },
            rateLimit
          );
          return withVisitorCookie(response, identity);
        }

        // Update in database
        const updated = await updateCommentHelpful(commentId);
        if (updated) {
          // Track in memory for this session
          if (!memComment) {
            entry.comments.push({
              id: commentId,
              user: targetComment.user,
              avatar: targetComment.avatar,
              text: targetComment.text,
              authorIdentityKey: targetComment.author_identity_key,
              helpful: targetComment.helpful,
              createdAt: normalizeEpochMs(targetComment.created_at),
              verified: Boolean(targetComment.verified),
              helpfulByIdentity: [identity.key],
            });
          } else {
            memComment.helpfulByIdentity.push(identity.key);
          }
          entry.lastActive = Date.now();
        }

        const ratings = await getRatingsByDetailKey(detailKey);
        const updatedComments = await getCommentsByDetailKey(detailKey);
        const payload = buildResponsePayloadFromDb(ratings, updatedComments, identity);
        const response = createSecureJsonResponse({
          success: true,
          message: 'Đã ghi nhận bình chọn hữu ích của bạn.',
          detailKey,
          ...payload,
        }, { status: 200 }, rateLimit);
        return withVisitorCookie(response, identity);
      }

      // Handle comment action with database
      // First check if user has rated
      const existingRating = await getExistingRating(detailKey, identity.key);
      if (!existingRating) {
        const ratings = await getRatingsByDetailKey(detailKey);
        const comments = await getCommentsByDetailKey(detailKey);
        
        // Check in-memory as well
        const entry = ensureEntry(detailKey);
        if (!entry.ratingsByIdentity.has(identity.key)) {
          const payload = buildResponsePayloadFromDb(ratings, comments, identity);
          const response = createSecureJsonResponse(
            {
              success: false,
              error: 'Vui lòng đánh giá sao trước khi gửi bình luận đầu tiên.',
              detailKey,
              ...payload,
            },
            { status: 403 },
            rateLimit
          );
          return withVisitorCookie(response, identity);
        }
      }

      const text = sanitizePlainText(typeof body.text === 'string' ? body.text : '');
      if (text.length < 3) {
        return createSecureJsonResponse({ success: false, error: 'Bình luận cần tối thiểu 3 ký tự.' }, { status: 400 }, rateLimit);
      }
      if (text.length > MAX_COMMENT_LENGTH) {
        return createSecureJsonResponse(
          { success: false, error: `Bình luận tối đa ${MAX_COMMENT_LENGTH} ký tự.` },
          { status: 400 },
          rateLimit
        );
      }
      if (countSentences(text) > MAX_COMMENT_SENTENCES) {
        return createSecureJsonResponse(
          { success: false, error: `Đánh giá tối đa ${MAX_COMMENT_SENTENCES} câu.` },
          { status: 400 },
          rateLimit
        );
      }

      let userName = sanitizePlainText(typeof body.userName === 'string' ? body.userName : '').slice(0, 40);
      if (!userName && identity.userName) {
        userName = sanitizePlainText(identity.userName).slice(0, 40);
      }
      if (!userName) {
        userName = 'Người dùng';
      }

      const avatar = buildAvatar(userName);
      const verified = identity.type === 'user';

      const commentId = await addComment(detailKey, userName, avatar, text, identity.key, verified);
      
      if (!commentId) {
        // Fallback to in-memory
        const entry = ensureEntry(detailKey);
        if (!entry.ratingsByIdentity.has(identity.key)) {
          const payload = buildResponsePayload(entry, identity);
          const response = createSecureJsonResponse(
            {
              success: false,
              error: 'Vui lòng đánh giá sao trước khi gửi bình luận đầu tiên.',
              detailKey,
              ...payload,
            },
            { status: 403 },
            rateLimit
          );
          return withVisitorCookie(response, identity);
        }

        const comment: StoredComment = {
          id: crypto.randomUUID(),
          user: userName,
          avatar,
          text,
          authorIdentityKey: identity.key,
          helpful: 0,
          createdAt: Date.now(),
          verified,
          helpfulByIdentity: [],
        };

        entry.comments.unshift(comment);
        if (entry.comments.length > MAX_COMMENTS_PER_DETAIL) {
          entry.comments = entry.comments.slice(0, MAX_COMMENTS_PER_DETAIL);
        }
        entry.lastActive = Date.now();

        const payload = buildResponsePayload(entry, identity);
        const response = createSecureJsonResponse({
          success: true,
          message: 'Bình luận của bạn đã được đăng.',
          detailKey,
          ...payload,
        }, { status: 200 }, rateLimit);
        return withVisitorCookie(response, identity);
      }

      // Successfully added to database
      const ratings = await getRatingsByDetailKey(detailKey);
      const comments = await getCommentsByDetailKey(detailKey);
      const payload = buildResponsePayloadFromDb(ratings, comments, identity);
      const response = createSecureJsonResponse({
        success: true,
        message: 'Bình luận của bạn đã được đăng.',
        detailKey,
        ...payload,
      }, { status: 200 }, rateLimit);
      return withVisitorCookie(response, identity);

    } catch (error) {
      console.error('[DetailFeedback] POST database error, falling back:', error);
      dbAvailable = false;
      // Continue to in-memory fallback below
    }
  }

  // Fallback to in-memory store for all actions
  const entry = ensureEntry(detailKey);

  if (action === 'rate') {
    const score = Number(body.score);
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      return createSecureJsonResponse({ success: false, error: 'score must be an integer from 1 to 5' }, { status: 400 }, rateLimit);
    }

    if (entry.ratingsByIdentity.has(identity.key)) {
      const payload = buildResponsePayload(entry, identity);
      const response = createSecureJsonResponse(
        {
          success: false,
          error: 'Báº¡n Ä‘Ã£ Ä‘Ã¡nh giÃ¡ trÆ°á»›c Ä‘Ã³. Má»—i IP hoáº·c tÃ i khoáº£n chá»‰ Ä‘Ã¡nh giÃ¡ 1 láº§n vÃ  khÃ´ng thá»ƒ chá»‰nh sá»­a.',
          detailKey,
          ...payload,
        },
        { status: 409 },
        rateLimit
      );
      return withVisitorCookie(response, identity);
    }

    entry.ratingsByIdentity.set(identity.key, {
      score,
      createdAt: Date.now(),
      identityType: identity.type,
    });
    entry.lastActive = Date.now();

    // Sync to database (fire and forget)
    addRatingToDb(detailKey, identity.key, score, identity.type).catch((err) => {
      console.error('[DetailFeedback] Failed to save rating to DB:', err);
    });

    const payload = buildResponsePayload(entry, identity);
    const response = createSecureJsonResponse({
      success: true,
      message: 'ÄÃ¡nh giÃ¡ cá»§a báº¡n Ä‘Ã£ Ä‘Æ°á»£c ghi nháº­n.',
      detailKey,
      ...payload,
    }, { status: 200 }, rateLimit);
    return withVisitorCookie(response, identity);
  }

  if (action === 'helpful') {
    const commentId = sanitizePlainText(typeof body.commentId === 'string' ? body.commentId : '').slice(0, 80);
    if (!commentId) {
      return createSecureJsonResponse({ success: false, error: 'commentId is required' }, { status: 400 }, rateLimit);
    }

    const targetComment = entry.comments.find((item) => item.id === commentId);
    if (!targetComment) {
      return createSecureJsonResponse({ success: false, error: 'Comment not found' }, { status: 404 }, rateLimit);
    }

    if (targetComment.helpfulByIdentity.includes(identity.key)) {
      const payload = buildResponsePayload(entry, identity);
      const response = createSecureJsonResponse(
        {
          success: false,
          error: 'Báº¡n Ä‘Ã£ Ä‘Ã¡nh dáº¥u há»¯u Ã­ch cho bÃ¬nh luáº­n nÃ y trÆ°á»›c Ä‘Ã³.',
          detailKey,
          ...payload,
        },
        { status: 409 },
        rateLimit
      );
      return withVisitorCookie(response, identity);
    }

    targetComment.helpfulByIdentity.push(identity.key);
    targetComment.helpful += 1;
    entry.lastActive = Date.now();

    // Sync to database (fire and forget)
    updateCommentHelpfulInDb(commentId, targetComment.helpful).catch(console.error);

    const payload = buildResponsePayload(entry, identity);
    const response = createSecureJsonResponse({
      success: true,
      message: 'ÄÃ£ ghi nháº­n bÃ¬nh chá»n há»¯u Ã­ch cá»§a báº¡n.',
      detailKey,
      ...payload,
    }, { status: 200 }, rateLimit);
    return withVisitorCookie(response, identity);
  }

  if (!entry.ratingsByIdentity.has(identity.key)) {
    const payload = buildResponsePayload(entry, identity);
    const response = createSecureJsonResponse(
      {
        success: false,
        error: 'Vui lÃ²ng Ä‘Ã¡nh giÃ¡ sao trÆ°á»›c khi gá»­i bÃ¬nh luáº­n Ä‘áº§u tiÃªn.',
        detailKey,
        ...payload,
      },
      { status: 403 },
      rateLimit
    );
    return withVisitorCookie(response, identity);
  }

  const text = sanitizePlainText(typeof body.text === 'string' ? body.text : '');
  if (text.length < 3) {
    return createSecureJsonResponse({ success: false, error: 'BÃ¬nh luáº­n cáº§n tá»‘i thiá»ƒu 3 kÃ½ tá»±.' }, { status: 400 }, rateLimit);
  }
  if (text.length > MAX_COMMENT_LENGTH) {
    return createSecureJsonResponse(
      { success: false, error: `BÃ¬nh luáº­n tá»‘i Ä‘a ${MAX_COMMENT_LENGTH} kÃ½ tá»±.` },
      { status: 400 },
      rateLimit
    );
  }
  if (countSentences(text) > MAX_COMMENT_SENTENCES) {
    return createSecureJsonResponse(
      { success: false, error: `ÄÃ¡nh giÃ¡ tá»‘i Ä‘a ${MAX_COMMENT_SENTENCES} cÃ¢u.` },
      { status: 400 },
      rateLimit
    );
  }

  let userName = sanitizePlainText(typeof body.userName === 'string' ? body.userName : '').slice(0, 40);
  // Use name from logged-in session if available
  if (!userName && identity.userName) {
    userName = sanitizePlainText(identity.userName).slice(0, 40);
  }
  if (!userName) {
    userName = 'Người dùng';
  }
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

  // Sync to database (fire and forget)
  addCommentToDb(comment, detailKey).catch((err) => { console.error("[DetailFeedback] Failed to save comment to DB:", err); });

  const payload = buildResponsePayload(entry, identity);
  const response = createSecureJsonResponse({
    success: true,
    message: 'BÃ¬nh luáº­n cá»§a báº¡n Ä‘Ã£ Ä‘Æ°á»£c Ä‘Äƒng.',
    detailKey,
    ...payload,
  }, { status: 200 }, rateLimit);
  return withVisitorCookie(response, identity);
});

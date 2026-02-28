/**
 * Dashboard Service
 * Provides real-time statistics from database with Redis caching
 * Production-grade implementation for baocaoluadao.com
 */

import { getDb } from '../db';
import { ensureRedisReady, getRedisClient, getRedisClientSafe } from '../redis';
import { RowDataPacket } from 'mysql2/promise';

export interface CategoryCount {
  name: string;
  slug: string;
  count: number;
  icon: string;
  description: string;
}

export interface DashboardStats {
  website: number;
  organization: number;
  device: number;
  system: number;
  application: number;
  phone: number;
  email: number;
  social: number;
  sms: number;
  bank: number;
  total: number;
  lastUpdated: string;
  source: 'database' | 'cache' | 'fallback';
}

export interface CategoryBreakdown {
  categories: CategoryCount[];
  total: number;
  lastUpdated: string;
  source: 'database' | 'cache' | 'fallback';
}

// Cache TTL in seconds (configurable via env)
const CACHE_TTL = parseInt(process.env.DASHBOARD_CACHE_TTL || '60', 10);
const CACHE_KEY = 'dashboard:stats';

// Performance monitoring
const SLOW_QUERY_THRESHOLD_MS = 200;

interface CountResult extends RowDataPacket {
  count: number;
}

interface TypeCountResult extends RowDataPacket {
  type: string;
  count: number;
}

/**
 * Log query performance
 */
function logQueryPerformance(queryName: string, durationMs: number): void {
  if (durationMs > SLOW_QUERY_THRESHOLD_MS) {
    console.warn(`[PERF] Slow query detected: ${queryName} took ${durationMs}ms`);
  }
}

/**
 * Get counts from the scams table (confirmed scams)
 */
async function getScamCounts(): Promise<Map<string, number>> {
  const db = getDb();
  const startTime = Date.now();

  try {
    // Get counts by type from scams table
    const [rows] = await db.query<TypeCountResult[]>(
      `SELECT type, COUNT(*) as count 
       FROM scams 
       WHERE status IN ('active', 'investigating') 
       GROUP BY type`
    );

    const counts = new Map<string, number>();
    rows.forEach((row) => {
      counts.set(row.type, row.count);
    });

    logQueryPerformance('getScamCounts', Date.now() - startTime);
    return counts;
  } catch (error) {
    console.error('[DB Error] getScamCounts:', error);
    return new Map();
  }
}

/**
 * Get pending reports count by type
 */
async function getPendingReportCounts(): Promise<Map<string, number>> {
  const db = getDb();
  const startTime = Date.now();

  try {
    const [rows] = await db.query<TypeCountResult[]>(
      `SELECT type, COUNT(*) as count 
       FROM reports 
       WHERE status IN ('pending', 'processing') 
       GROUP BY type`
    );

    const counts = new Map<string, number>();
    rows.forEach((row) => {
      counts.set(row.type, row.count);
    });

    logQueryPerformance('getPendingReportCounts', Date.now() - startTime);
    return counts;
  } catch (error) {
    console.error('[DB Error] getPendingReportCounts:', error);
    return new Map();
  }
}

/**
 * Get total counts from database
 */
async function getDatabaseStats(): Promise<DashboardStats> {
  const db = getDb();
  const startTime = Date.now();

  try {
    // Get total counts using optimized queries
    const [scamCountResult] = await db.query<CountResult[]>(
      `SELECT COUNT(*) as count FROM scams WHERE status IN ('active', 'investigating')`
    );
    const [reportCountResult] = await db.query<CountResult[]>(
      `SELECT COUNT(*) as count FROM reports WHERE status = 'pending'`
    );
    const [verifiedScamCountResult] = await db.query<CountResult[]>(
      `SELECT COUNT(*) as count FROM scams WHERE status = 'active'`
    );

    // Get counts by type for scams
    const scamCounts = await getScamCounts();
    const reportCounts = await getPendingReportCounts();

    const stats: DashboardStats = {
      website: (scamCounts.get('website') || 0) + (reportCounts.get('website') || 0),
      organization: 0, // Will be populated from categories if available
      device: (scamCounts.get('device') || 0) + (reportCounts.get('device') || 0),
      system: (scamCounts.get('system') || 0) + (reportCounts.get('system') || 0),
      application: (scamCounts.get('application') || 0) + (reportCounts.get('application') || 0),
      phone: (scamCounts.get('phone') || 0) + (reportCounts.get('phone') || 0),
      email: (scamCounts.get('email') || 0) + (reportCounts.get('email') || 0),
      social: (scamCounts.get('social') || 0) + (reportCounts.get('social') || 0),
      sms: (scamCounts.get('sms') || 0) + (reportCounts.get('sms') || 0),
      bank: (scamCounts.get('bank') || 0) + (reportCounts.get('bank') || 0),
      total: (scamCountResult[0]?.count || 0) + (reportCountResult[0]?.count || 0),
      lastUpdated: new Date().toISOString(),
      source: 'database',
    };

    logQueryPerformance('getDatabaseStats', Date.now() - startTime);
    return stats;
  } catch (error) {
    console.error('[DB Error] getDatabaseStats:', error);
    throw error;
  }
}

/**
 * Get category breakdown for frontend display
 */
async function getCategoryBreakdown(): Promise<CategoryBreakdown> {
  const db = getDb();
  const startTime = Date.now();

  try {
    // Get category metadata from database
    const [categoryRows] = await db.query<(RowDataPacket & { name: string; slug: string; icon: string; description: string; type: string })[]>(
      `SELECT id, name, slug, type, icon, description 
       FROM categories 
       WHERE is_active = TRUE 
       ORDER BY display_order`
    );

    // Get scam counts by type
    const scamCounts = await getScamCounts();
    const reportCounts = await getPendingReportCounts();

    const categories: CategoryCount[] = categoryRows.map((cat) => {
      const scamCount = scamCounts.get(cat.type) || 0;
      const reportCount = reportCounts.get(cat.type) || 0;

      return {
        name: cat.name,
        slug: cat.slug,
        count: scamCount + reportCount,
        icon: cat.icon || 'shield',
        description: cat.description || `Danh mục ${cat.name}`,
      };
    });

    const total = categories.reduce((sum, cat) => sum + cat.count, 0);

    logQueryPerformance('getCategoryBreakdown', Date.now() - startTime);

    return {
      categories,
      total,
      lastUpdated: new Date().toISOString(),
      source: 'database',
    };
  } catch (error) {
    console.error('[DB Error] getCategoryBreakdown:', error);
    throw error;
  }
}

/**
 * Try to get cached stats from Redis
 */
async function getCachedStats(): Promise<DashboardStats | null> {
  try {
    const redis = await getRedisClientSafe();
    if (!redis) return null;

    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      console.log('[Cache] Dashboard stats retrieved from Redis');
      const stats = JSON.parse(cached) as DashboardStats;
      stats.source = 'cache';
      return stats;
    }
  } catch (error) {
    console.warn('[Cache] Failed to get cached stats:', error);
  }
  return null;
}

/**
 * Cache stats in Redis
 */
async function cacheStats(stats: DashboardStats): Promise<void> {
  try {
    const redis = await getRedisClientSafe();
    if (!redis) return;

    await redis.set(CACHE_KEY, JSON.stringify(stats), 'EX', CACHE_TTL);
    console.log(`[Cache] Dashboard stats cached for ${CACHE_TTL}s`);
  } catch (error) {
    console.warn('[Cache] Failed to cache stats:', error);
  }
}

/**
 * Invalidate dashboard cache (call after report approval)
 */
export async function invalidateDashboardCache(): Promise<void> {
  try {
    const redis = await getRedisClientSafe();
    if (!redis) return;

    await redis.del(CACHE_KEY);
    console.log('[Cache] Dashboard cache invalidated');
  } catch (error) {
    console.warn('[Cache] Failed to invalidate cache:', error);
  }
}

/**
 * Get dashboard statistics with caching
 * This is the main entry point for the stats API
 */
export async function getDashboardStats(forceRefresh = false): Promise<DashboardStats> {
  // Try to get from cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = await getCachedStats();
    if (cached) {
      return cached;
    }
  }

  // Get from database
  const stats = await getDatabaseStats();

  // Cache the result
  await cacheStats(stats);

  return stats;
}

/**
 * Get category breakdown with caching
 */
export async function getDashboardCategoryBreakdown(forceRefresh = false): Promise<CategoryBreakdown> {
  if (!forceRefresh) {
    try {
      const redis = await getRedisClient();
      if (redis) {
        const cached = await redis.get(`${CACHE_KEY}:categories`);
        if (cached) {
          console.log('[Cache] Category breakdown retrieved from Redis');
          const breakdown = JSON.parse(cached) as CategoryBreakdown;
          breakdown.source = 'cache';
          return breakdown;
        }
      }
    } catch (error) {
      console.warn('[Cache] Failed to get cached categories:', error);
    }
  }

  // Get from database
  const breakdown = await getCategoryBreakdown();

  // Cache the result
  try {
    const redis = await getRedisClientSafe();
    if (redis) {
      await redis.set(`${CACHE_KEY}:categories`, JSON.stringify(breakdown), 'EX', CACHE_TTL);
    }
  } catch (error) {
    console.warn('[Cache] Failed to cache categories:', error);
  }

  return breakdown;
}

/**
 * Health check for dashboard service
 */
export async function checkDashboardHealth(): Promise<{ healthy: boolean; cache: boolean; database: boolean }> {
  let dbHealthy = false;
  let cacheHealthy = false;

  try {
    const db = getDb();
    await db.query('SELECT 1');
    dbHealthy = true;
  } catch (error) {
    console.error('[Health] Database check failed:', error);
  }

  try {
    const redis = await getRedisClient();
    if (redis) {
      await redis.ping();
      cacheHealthy = true;
    }
  } catch (error) {
    console.warn('[Health] Redis check failed:', error);
  }

  return {
    healthy: dbHealthy,
    database: dbHealthy,
    cache: cacheHealthy,
  };
}

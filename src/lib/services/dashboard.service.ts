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
const CACHE_TTL = parseInt(process.env.DASHBOARD_CACHE_TTL || '300', 10);
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
 * Optimized: Uses single query with subqueries instead of multiple COUNT queries
 */
async function getDatabaseStats(): Promise<DashboardStats> {
  const db = getDb();
  const startTime = Date.now();

  try {
    // Single optimized query with subqueries for total counts
    const [statsResult] = await db.query<(RowDataPacket & {
      totalScams: number;
      pendingReports: number;
      verifiedScams: number;
    })[]>(
      `SELECT 
        (SELECT COUNT(*) FROM scams WHERE status IN ('active', 'investigating')) as totalScams,
        (SELECT COUNT(*) FROM reports WHERE status = 'pending') as pendingReports,
        (SELECT COUNT(*) FROM scams WHERE status = 'active') as verifiedScams`
    );

    // Get counts by type for scams and reports - MariaDB compatible approach
    const [typeCounts] = await db.query<(RowDataPacket & { type: string; scamCount: number; reportCount: number })[]>(
      `SELECT type, SUM(scamCount) as scamCount, SUM(reportCount) as reportCount FROM (
        SELECT type, COUNT(*) as scamCount, 0 as reportCount
        FROM scams WHERE status IN ('active', 'investigating') GROUP BY type
        UNION ALL
        SELECT type, 0 as scamCount, COUNT(*) as reportCount
        FROM reports WHERE status IN ('pending', 'processing') GROUP BY type
      ) combined
      GROUP BY type`
    );

    const typeCountMap = new Map<string, { scamCount: number; reportCount: number }>();
    typeCounts.forEach(row => {
      typeCountMap.set(row.type, { scamCount: row.scamCount, reportCount: row.reportCount });
    });

    const stats: DashboardStats = {
      website: (typeCountMap.get('website')?.scamCount || 0) + (typeCountMap.get('website')?.reportCount || 0),
      organization: 0, // Will be populated from categories if available
      device: (typeCountMap.get('device')?.scamCount || 0) + (typeCountMap.get('device')?.reportCount || 0),
      system: (typeCountMap.get('system')?.scamCount || 0) + (typeCountMap.get('system')?.reportCount || 0),
      application: (typeCountMap.get('application')?.scamCount || 0) + (typeCountMap.get('application')?.reportCount || 0),
      phone: (typeCountMap.get('phone')?.scamCount || 0) + (typeCountMap.get('phone')?.reportCount || 0),
      email: (typeCountMap.get('email')?.scamCount || 0) + (typeCountMap.get('email')?.reportCount || 0),
      social: (typeCountMap.get('social')?.scamCount || 0) + (typeCountMap.get('social')?.reportCount || 0),
      sms: (typeCountMap.get('sms')?.scamCount || 0) + (typeCountMap.get('sms')?.reportCount || 0),
      bank: (typeCountMap.get('bank')?.scamCount || 0) + (typeCountMap.get('bank')?.reportCount || 0),
      total: (statsResult[0]?.totalScams || 0) + (statsResult[0]?.pendingReports || 0),
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
 * Optimized: Uses single query instead of multiple calls
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

    // Get combined type counts - MariaDB compatible approach
    const [typeCounts] = await db.query<(RowDataPacket & { type: string; scamCount: number; reportCount: number })[]>(
      `SELECT type, SUM(scamCount) as scamCount, SUM(reportCount) as reportCount FROM (
        SELECT type, COUNT(*) as scamCount, 0 as reportCount
        FROM scams WHERE status IN ('active', 'investigating') GROUP BY type
        UNION ALL
        SELECT type, 0 as scamCount, COUNT(*) as reportCount
        FROM reports WHERE status IN ('pending', 'processing') GROUP BY type
      ) combined
      GROUP BY type`
    );

    const typeCountMap = new Map<string, { scamCount: number; reportCount: number }>();
    typeCounts.forEach(row => {
      typeCountMap.set(row.type, { scamCount: row.scamCount, reportCount: row.reportCount });
    });

    const categories: CategoryCount[] = categoryRows.map((cat) => {
      const counts = typeCountMap.get(cat.type) || { scamCount: 0, reportCount: 0 };

      return {
        name: cat.name,
        slug: cat.slug,
        count: counts.scamCount + counts.reportCount,
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

/**
 * Database connection utility for Cloudflare Workers
 * Uses mysql2 to connect through Cloudflare Tunnel
 */

import mysql, { Pool, PoolOptions } from 'mysql2/promise';

let pool: Pool | null = null;

export function getPool(env: {
  DB_HOST?: string;
  DB_USER?: string;
  DB_PASSWORD?: string;
  DB_NAME?: string;
}): Pool {
  if (pool) {
    return pool;
  }

  const config: PoolOptions = {
    host: env.DB_HOST || 'localhost',
    user: env.DB_USER || 'root',
    password: env.DB_PASSWORD || '',
    database: env.DB_NAME || 'baocaoluadao',
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    // Cloudflare Workers doesn't support TCP directly,
    // but with node_compat it may work through the tunnel
    connectTimeout: 10000,
  };

  pool = mysql.createPool(config);
  return pool;
}

export async function query<T>(
  env: {
    DB_HOST?: string;
    DB_USER?: string;
    DB_PASSWORD?: string;
    DB_NAME?: string;
  },
  sql: string,
  params?: unknown[]
): Promise<T | null> {
  try {
    const pool = getPool(env);
    const [rows] = await pool.execute(sql, params);
    return rows as T;
  } catch (error) {
    console.error('Database query error:', error);
    return null;
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

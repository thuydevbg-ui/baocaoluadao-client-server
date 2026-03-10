import mysql from "mysql2/promise";

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "scamguard",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Warn if database is not properly configured for production
if (!process.env.DB_HOST || !process.env.DB_USER) {
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️ DATABASE WARNING: DB_HOST or DB_USER not configured. Database features may fail in production.');
  } else {
    console.warn('⚠️ DATABASE: Using default/local database configuration. Set DB_HOST, DB_USER, DB_PASSWORD, DB_NAME for production.');
  }
}

// Lazy initialization - pool is created only when needed
let pool: mysql.Pool | undefined;
let poolCreationFailed = false;

function getDbConfig() {
  // Note: getDbConfig() is called when pool is created (line 45), not on every getDb() call.
  // The pool is created once and stored in module-level variable.
  // We fetch fresh config here to support:
  // 1. Runtime env var changes (useful during development with hot reload)
  // 2. Dynamic configuration updates without restarting the server
  // 3. Ensuring env vars are properly loaded in all deployment scenarios
  // For production with static env vars, this has minimal overhead as it's only
  // called once during pool initialization.
  return {
    host: process.env.DB_HOST || "127.0.0.1",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "baocaoluadao",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };
}

export function getDb(): mysql.Pool {
  if (!pool) {
    if (poolCreationFailed) {
      throw new Error('Database pool creation previously failed. Check DB configuration and restart the server.');
    }
    try {
      // Get fresh config each time to ensure env vars are loaded
      pool = mysql.createPool(getDbConfig());
      console.log('✅ Database pool created successfully');
    } catch (error) {
      poolCreationFailed = true;
      console.error('❌ Database pool creation failed:', error);
      throw new Error('Failed to create database pool. Please check your database configuration.');
    }
  }
  return pool;
}

/**
 * Check database connection health
 */
export async function checkDbHealth(): Promise<{ healthy: boolean; error?: string }> {
  try {
    const db = getDb();
    const connection = await db.getConnection();
    await connection.ping();
    connection.release();
    return { healthy: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    console.error('❌ Database health check failed:', message);
    return { healthy: false, error: message };
  }
}

/**
 * Close database pool gracefully
 */
export async function closeDb(): Promise<void> {
  if (pool) {
    try {
      await pool.end();
      pool = undefined;
      console.log('✅ Database pool closed successfully');
    } catch (error) {
      console.error('❌ Error closing database pool:', error);
    }
  }
}

// Note: Use getDb() wherever you need the pool. Do not eagerly call getDb() at module
// import time since it would create the pool as a side-effect during module initialization,
// showing "✅ Database pool created successfully" twice (once per webpack compilation context).

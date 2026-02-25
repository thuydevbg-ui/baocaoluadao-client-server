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

export function getDb(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

export default getDb();

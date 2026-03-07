import { getDb } from './db';

/**
 * Ensure user-related tables/columns exist. Safe to call multiple times.
 */
export async function ensureUserInfra() {
  const db = getDb();

  // users table extensions
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id CHAR(36) PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(120) NOT NULL,
      password_hash VARCHAR(255) DEFAULT NULL,
      image VARCHAR(500) DEFAULT NULL,
      provider ENUM('credentials','google','unknown') NOT NULL DEFAULT 'credentials',
      role ENUM('user','admin') NOT NULL DEFAULT 'user',
      last_login_at DATETIME DEFAULT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(500) NULL AFTER image`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS securityScore INT DEFAULT 75 AFTER role`);

  // user_reports
  await db.query(`
    CREATE TABLE IF NOT EXISTS user_reports (
      id CHAR(36) PRIMARY KEY,
      userId CHAR(36) NOT NULL,
      type VARCHAR(40) NOT NULL,
      target VARCHAR(500) NOT NULL,
      riskScore INT DEFAULT 0,
      status VARCHAR(40) NOT NULL DEFAULT 'pending',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_reports_user (userId),
      CONSTRAINT fk_user_reports_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // user_activity
  await db.query(`
    CREATE TABLE IF NOT EXISTS user_activity (
      id CHAR(36) PRIMARY KEY,
      userId CHAR(36) NOT NULL,
      type VARCHAR(50) NOT NULL,
      description VARCHAR(500) NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_activity_user (userId),
      CONSTRAINT fk_user_activity_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // watchlist
  await db.query(`
    CREATE TABLE IF NOT EXISTS watchlist (
      id CHAR(36) PRIMARY KEY,
      userId CHAR(36) NOT NULL,
      target VARCHAR(300) NOT NULL,
      type VARCHAR(40) NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_watchlist_user (userId),
      CONSTRAINT fk_watchlist_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // notifications_settings
  await db.query(`
    CREATE TABLE IF NOT EXISTS notifications_settings (
      userId CHAR(36) PRIMARY KEY,
      emailAlerts TINYINT(1) NOT NULL DEFAULT 1,
      pushAlerts TINYINT(1) NOT NULL DEFAULT 0,
      weeklySummary TINYINT(1) NOT NULL DEFAULT 1,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_notifications_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}


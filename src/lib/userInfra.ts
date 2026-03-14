import { getDb } from './db';

/**
 * Ensure user-related tables/columns exist. Safe to call multiple times.
 */
export async function ensureUserInfra() {
  if (process.env.MOCK_DB === '1') {
    // Skip DDL when running mock tests
    return;
  }
  const db = getDb();

  // users table extensions
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id CHAR(36) PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(120) NOT NULL,
      phone VARCHAR(30) DEFAULT NULL,
      password_hash VARCHAR(255) DEFAULT NULL,
      image VARCHAR(500) DEFAULT NULL,
      provider ENUM('credentials','google','facebook','twitter','telegram','unknown') NOT NULL DEFAULT 'credentials',
      role ENUM('user','admin') NOT NULL DEFAULT 'user',
      last_login_at DATETIME DEFAULT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  await db.query(`ALTER TABLE users MODIFY COLUMN provider ENUM('credentials','google','facebook','twitter','telegram','unknown') NOT NULL DEFAULT 'credentials'`);

  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(500) NULL AFTER image`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS securityScore INT DEFAULT 75 AFTER role`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(30) NULL AFTER name`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS twofa_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER securityScore`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS twofa_secret VARCHAR(64) NULL AFTER twofa_enabled`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS twofa_backup_codes TEXT NULL AFTER twofa_secret`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_connected TINYINT(1) NOT NULL DEFAULT 0 AFTER twofa_enabled`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(40) NULL AFTER oauth_connected`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified TINYINT(1) NOT NULL DEFAULT 0 AFTER oauth_provider`);
  await db.query(`ALTER TABLE users MODIFY COLUMN email_verified TINYINT(1) NOT NULL DEFAULT 0`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_code VARCHAR(12) NULL AFTER email_verified`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_expires DATETIME NULL AFTER email_verification_code`);

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
      device VARCHAR(120) NULL,
      ip VARCHAR(60) NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_activity_user (userId),
      CONSTRAINT fk_user_activity_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  await db.query(`ALTER TABLE user_activity ADD COLUMN IF NOT EXISTS device VARCHAR(120) NULL AFTER description`);
  await db.query(`ALTER TABLE user_activity ADD COLUMN IF NOT EXISTS ip VARCHAR(60) NULL AFTER device`);

  // evidence_files
  await db.query(`
    CREATE TABLE IF NOT EXISTS evidence_files (
      id CHAR(36) PRIMARY KEY,
      userId CHAR(36) NOT NULL,
      reportId CHAR(36) NOT NULL,
      fileUrl VARCHAR(1000) NOT NULL,
      mime VARCHAR(120) DEFAULT NULL,
      sizeBytes BIGINT DEFAULT NULL,
      sha256 VARCHAR(128) DEFAULT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_evidence_user (userId),
      INDEX idx_evidence_report (reportId),
      CONSTRAINT fk_evidence_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_evidence_report FOREIGN KEY (reportId) REFERENCES user_reports(id) ON DELETE CASCADE
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

  // profile summary
  await db.query(`
    CREATE TABLE IF NOT EXISTS user_profile_summary (
      userId CHAR(36) PRIMARY KEY,
      reportsCount INT NOT NULL DEFAULT 0,
      watchlistCount INT NOT NULL DEFAULT 0,
      alertCount INT NOT NULL DEFAULT 0,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_user_profile_summary_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // notifications_settings
  await db.query(`
    CREATE TABLE IF NOT EXISTS notifications_settings (
      userId CHAR(36) PRIMARY KEY,
      emailAlerts TINYINT(1) NOT NULL DEFAULT 1,
      pushAlerts TINYINT(1) NOT NULL DEFAULT 0,
      smsAlerts TINYINT(1) NOT NULL DEFAULT 0,
      reportUpdates TINYINT(1) NOT NULL DEFAULT 1,
      securityAlerts TINYINT(1) NOT NULL DEFAULT 1,
      weeklySummary TINYINT(1) NOT NULL DEFAULT 1,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_notifications_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  await db.query(`ALTER TABLE notifications_settings ADD COLUMN IF NOT EXISTS smsAlerts TINYINT(1) NOT NULL DEFAULT 0 AFTER pushAlerts`);
  await db.query(`ALTER TABLE notifications_settings ADD COLUMN IF NOT EXISTS reportUpdates TINYINT(1) NOT NULL DEFAULT 1 AFTER smsAlerts`);
  await db.query(`ALTER TABLE notifications_settings ADD COLUMN IF NOT EXISTS securityAlerts TINYINT(1) NOT NULL DEFAULT 1 AFTER reportUpdates`);

  // support_requests
  await db.query(`
    CREATE TABLE IF NOT EXISTS support_requests (
      id CHAR(36) PRIMARY KEY,
      userId CHAR(36) NOT NULL,
      topic VARCHAR(120) NOT NULL,
      channel ENUM('call','chat','email') NOT NULL DEFAULT 'call',
      note VARCHAR(1000) NULL,
      status ENUM('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_support_user (userId),
      CONSTRAINT fk_support_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // user_preferences
  await db.query(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      userId CHAR(36) PRIMARY KEY,
      language VARCHAR(10) NOT NULL DEFAULT 'vi',
      timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
      theme VARCHAR(20) NOT NULL DEFAULT 'system',
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_user_preferences_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // user_devices
  await db.query(`
    CREATE TABLE IF NOT EXISTS user_devices (
      id CHAR(36) PRIMARY KEY,
      userId CHAR(36) NOT NULL,
      deviceId CHAR(36) NULL,
      deviceHash CHAR(64) NOT NULL,
      name VARCHAR(120) NOT NULL,
      type ENUM('desktop','mobile','tablet') NOT NULL DEFAULT 'desktop',
      browser VARCHAR(120) NULL,
      ip VARCHAR(60) NULL,
      userAgent VARCHAR(500) NULL,
      lastActiveAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      revokedAt DATETIME NULL,
      revokedReason VARCHAR(255) NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_user_device (userId, deviceHash),
      UNIQUE KEY uniq_user_device_id (userId, deviceId),
      INDEX idx_user_devices_user (userId),
      INDEX idx_user_devices_active (lastActiveAt),
      CONSTRAINT fk_user_devices_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  await db.query(`ALTER TABLE user_devices ADD COLUMN IF NOT EXISTS deviceId CHAR(36) NULL AFTER userId`);
  await db.query(`ALTER TABLE user_devices ADD COLUMN IF NOT EXISTS revokedAt DATETIME NULL AFTER lastActiveAt`);
  await db.query(`ALTER TABLE user_devices ADD COLUMN IF NOT EXISTS revokedReason VARCHAR(255) NULL AFTER revokedAt`);

  // victim_aid_cases
  await db.query(`
    CREATE TABLE IF NOT EXISTS victim_aid_cases (
      id CHAR(36) PRIMARY KEY,
      userId CHAR(36) NOT NULL,
      need ENUM('psychology','finance','legal') NOT NULL,
      description VARCHAR(1500) NULL,
      state ENUM('open','assigned','resolved','closed') NOT NULL DEFAULT 'open',
      contact VARCHAR(255) NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_victim_user (userId),
      CONSTRAINT fk_victim_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // support_calls
  await db.query(`
    CREATE TABLE IF NOT EXISTS support_calls (
      id CHAR(36) PRIMARY KEY,
      userId CHAR(36) NOT NULL,
      line ENUM('113','114','111','expert') NOT NULL,
      callbackNumber VARCHAR(40) NULL,
      status ENUM('queued','calling','connected','failed') NOT NULL DEFAULT 'queued',
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_support_calls_user (userId),
      CONSTRAINT fk_support_calls_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // alerts table for push notifications
  await db.query(`
    CREATE TABLE IF NOT EXISTS alerts (
      id CHAR(36) PRIMARY KEY,
      userId CHAR(36) NOT NULL,
      watchlistId CHAR(36) NULL,
      scamId VARCHAR(32) NULL,
      target VARCHAR(300) NOT NULL,
      type VARCHAR(40) NOT NULL,
      level ENUM('info','warning','danger') NOT NULL DEFAULT 'warning',
      message VARCHAR(1000) NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      readAt DATETIME NULL,
      INDEX idx_alerts_user (userId),
      INDEX idx_alerts_created (createdAt),
      UNIQUE KEY uniq_alert_user_scam (userId, scamId),
      CONSTRAINT fk_alerts_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

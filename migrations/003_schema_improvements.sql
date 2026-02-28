-- ScamGuard Database Migration
-- Version: 003
-- Description: Schema improvements for production-grade SaaS
-- Created: 2026-02-28

-- ============================================
-- REPORTS TABLE - Add missing indexes
-- ============================================
-- Add composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_reports_status_type ON reports(status, type);
CREATE INDEX IF NOT EXISTS idx_reports_created_status ON reports(created_at, status);

-- Add index for reporter lookup
CREATE INDEX IF NOT EXISTS idx_reports_reporter_email ON reports(reporter_email);

-- ============================================
-- SCAMS TABLE - Add missing indexes
-- ============================================
-- Add composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_scams_type_status ON scams(type, status);
CREATE INDEX IF NOT EXISTS idx_scams_created_at ON scams(created_at);

-- Add index for value lookup (for duplicate detection)
CREATE INDEX IF NOT EXISTS idx_scams_value_type ON scams(value(255), type);

-- ============================================
-- RATE LIMITS TABLE - Add cleanup index
-- ============================================
-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_rate_limits_first_attempt ON rate_limits(first_attempt);

-- ============================================
-- ADMIN ACTIVITY LOGS - Add composite indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_admin_logs_user_timestamp ON admin_activity_logs(user, timestamp);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action_status ON admin_activity_logs(action(50), status);

-- ============================================
-- CATEGORIES TABLE (NEW)
-- For storing scam categories
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) NOT NULL UNIQUE,
    type ENUM('website', 'phone', 'email', 'bank', 'social', 'sms', 'device', 'system', 'application', 'organization') NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT NULL,
    color VARCHAR(20) DEFAULT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_type (type),
    INDEX idx_slug (slug),
    INDEX idx_active (is_active),
    INDEX idx_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default categories
INSERT INTO categories (id, name, slug, type, description, icon, color, display_order) VALUES
('CAT001', 'Website lừa đảo', 'websites', 'website', 'Các website lừa đảo, giả mạo', 'globe', '#ef4444', 1),
('CAT002', 'Tổ chức', 'organizations', 'organization', 'Tổ chức xác minh hoặc cảnh báo', 'building', '#8b5cf6', 2),
('CAT003', 'Thiết bị', 'devices', 'device', 'Thiết bị bị cảnh báo', 'smartphone', '#10b981', 3),
('CAT004', 'Hệ thống', 'systems', 'system', 'Hệ thống bị nguy hiểm', 'shield', '#f59e0b', 4),
('CAT005', 'Ứng dụng', 'apps', 'application', 'Ứng dụng độc hại', 'app', '#f97316', 5),
('CAT006', 'Số điện thoại', 'phones', 'phone', 'Số điện thoại lừa đảo', 'phone', '#ec4899', 6),
('CAT007', 'Email', 'emails', 'email', 'Email lừa đảo', 'mail', '#3b82f6', 7),
('CAT008', 'Mạng xã hội', 'social', 'social', 'Tài khoản mạng xã hội lừa đảo', 'users', '#06b6d4', 8),
('CAT009', 'Tin nhắn SMS', 'sms', 'sms', 'Tin nhắn SMS lừa đảo', 'message', '#84cc16', 9),
('CAT010', 'Ngân hàng', 'banks', 'bank', 'Tài khoản ngân hàng lừa đảo', 'building2', '#14b8a6', 10)
ON DUPLICATE KEY UPDATE name = VALUES(name), updated_at = CURRENT_TIMESTAMP;

-- ============================================
-- SITE_SETTINGS TABLE (NEW)
-- For storing site configuration
-- ============================================
CREATE TABLE IF NOT EXISTS site_settings (
    id VARCHAR(20) PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') NOT NULL DEFAULT 'string',
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    description VARCHAR(255) DEFAULT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_key (setting_key),
    INDEX idx_public (is_public)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default settings
SET @has_setting_key := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'site_settings'
      AND COLUMN_NAME = 'setting_key'
);

SET @site_settings_seed_sql := IF(
    @has_setting_key > 0,
    "INSERT INTO site_settings (id, setting_key, setting_value, setting_type, is_public, description) VALUES
    ('SET001', 'site_name', 'Báo Cáo Lừa Đảo', 'string', TRUE, 'Tên website'),
    ('SET002', 'site_description', 'Nền tảng cảnh báo lừa đảo trực tuyến', 'string', TRUE, 'Mô tả website'),
    ('SET003', 'reports_cache_ttl', '60', 'number', FALSE, 'Thời gian cache thống kê (giây)'),
    ('SET004', 'max_reports_per_day', '5', 'number', FALSE, 'Số báo cáo tối đa/ngày/IP'),
    ('SET005', 'duplicate_check_days', '7', 'number', FALSE, 'Số ngày kiểm tra trùng lặp')
    ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = CURRENT_TIMESTAMP",
    "SELECT 'Skip site_settings seed because legacy schema is detected' AS migration_note"
);

PREPARE site_settings_seed_stmt FROM @site_settings_seed_sql;
EXECUTE site_settings_seed_stmt;
DEALLOCATE PREPARE site_settings_seed_stmt;

-- ============================================
-- USERS TABLE (NEW)
-- For storing user information
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(20) PRIMARY KEY,
    email VARCHAR(120) NOT NULL UNIQUE,
    name VARCHAR(80) DEFAULT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    status ENUM('active', 'banned', 'suspended') NOT NULL DEFAULT 'active',
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    report_count INT NOT NULL DEFAULT 0,
    verified_report_count INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_active_at DATETIME DEFAULT NULL,
    
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Update reports table - Add verified status enum
-- ============================================
ALTER TABLE reports MODIFY COLUMN status ENUM('pending', 'processing', 'verified', 'rejected', 'completed') NOT NULL DEFAULT 'pending';

-- ============================================
-- Create duplicate check view
-- ============================================
CREATE OR REPLACE VIEW v_duplicate_reports AS
SELECT 
    target,
    type,
    DATE(created_at) as report_date,
    COUNT(*) as report_count
FROM reports
WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
GROUP BY target, type, DATE(created_at)
HAVING COUNT(*) > 1;

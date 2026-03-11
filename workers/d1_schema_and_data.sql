-- =============================================================================
-- D1 DATABASE INITIALIZATION SCRIPT
-- =============================================================================
-- Run this in Cloudflare Dashboard: https://dash.cloudflare.com/
-- Go to: D1 -> baocaoluadao-d1 -> Query
-- Copy and paste the entire content below and click "Run query"
-- =============================================================================

-- =============================================================================
-- TABLE: categories
-- =============================================================================
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR REPLACE INTO categories (id, name, slug, type, description, icon, color, is_active, display_order, created_at, updated_at) VALUES
('CAT001', 'Website lừa đảo', 'websites', 'website', 'Các website lừa đảo, giả mạo', 'globe', '#ef4444', 1, 1, '2026-02-28 19:06:45', '2026-02-28 19:07:35'),
('CAT002', 'Tổ chức', 'organizations', 'organization', 'Tổ chức xác minh hoặc cảnh báo', 'building', '#8b5cf6', 1, 2, '2026-02-28 19:06:45', '2026-02-28 19:07:35'),
('CAT003', 'Thiết bị', 'devices', 'device', 'Thiết bị bị cảnh báo', 'smartphone', '#10b981', 1, 3, '2026-02-28 19:06:45', '2026-02-28 19:07:35'),
('CAT004', 'Hệ thống', 'systems', 'system', 'Hệ thống bị nguy hiểm', 'shield', '#f59e0b', 1, 4, '2026-02-28 19:06:45', '2026-02-28 19:07:35'),
('CAT005', 'Ứng dụng', 'apps', 'application', 'Ứng dụng độc hại', 'app', '#f97316', 1, 5, '2026-02-28 19:06:45', '2026-02-28 19:07:35'),
('CAT006', 'Số điện thoại', 'phones', 'phone', 'Số điện thoại lừa đảo', 'phone', '#ec4899', 1, 6, '2026-02-28 19:06:45', '2026-02-28 19:07:35'),
('CAT007', 'Email', 'emails', 'email', 'Email lừa đảo', 'mail', '#3b82f6', 1, 7, '2026-02-28 19:06:45', '2026-02-28 19:07:35'),
('CAT008', 'Mạng xã hội', 'social', 'social', 'Tài khoản mạng xã hội lừa đảo', 'users', '#06b6d4', 1, 8, '2026-02-28 19:06:45', '2026-02-28 19:07:35'),
('CAT009', 'Tin nhắn SMS', 'sms', 'sms', 'Tin nhắn SMS lừa đảo', 'message', '#84cc16', 1, 9, '2026-02-28 19:06:45', '2026-02-28 19:07:35'),
('CAT010', 'Ngân hàng', 'banks', 'bank', 'Tài khoản ngân hàng lừa đảo', 'building2', '#14b8a6', 1, 10, '2026-02-28 19:06:45', '2026-02-28 19:07:35');

-- =============================================================================
-- TABLE: site_settings
-- =============================================================================
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  type TEXT NOT NULL DEFAULT 'string',
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR REPLACE INTO site_settings (key, value, type, description, created_at, updated_at) VALUES
('site_name', 'Báo Cáo Lừa Đảo', 'string', 'Tên website', '2026-02-28 19:00:00', '2026-02-28 19:00:00'),
('site_description', 'Hệ thống cảnh báo lừa đảo Việt Nam', 'string', 'Mô tả website', '2026-02-28 19:00:00', '2026-02-28 19:00:00'),
('reports_enabled', 'true', 'boolean', 'Cho phép gửi báo cáo', '2026-02-28 19:00:00', '2026-02-28 19:00:00'),
('ai_scan_enabled', 'true', 'boolean', 'Bật tính năng quét AI', '2026-02-28 19:00:00', '2026-02-28 19:00:00');

-- =============================================================================
-- TABLE: scams
-- =============================================================================
CREATE TABLE IF NOT EXISTS scams (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  report_count INTEGER NOT NULL DEFAULT 1,
  risk_level TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'active',
  source TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  external_status TEXT,
  external_created_at TEXT,
  organization_name TEXT,
  source_url TEXT,
  external_hash TEXT,
  external_category TEXT,
  icon TEXT,
  organization_icon TEXT,
  is_scam INTEGER DEFAULT 1
);

-- =============================================================================
-- TABLE: reports
-- =============================================================================
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  target TEXT NOT NULL,
  description TEXT,
  risk_level TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  source TEXT,
  ip_address TEXT,
  user_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- =============================================================================
-- TABLE: detail_view_counts
-- =============================================================================
CREATE TABLE IF NOT EXISTS detail_view_counts (
  detail_key TEXT PRIMARY KEY,
  views INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- =============================================================================
-- TABLE: detail_feedback
-- =============================================================================
CREATE TABLE IF NOT EXISTS detail_feedback (
  id TEXT PRIMARY KEY,
  detail_key TEXT NOT NULL,
  user TEXT NOT NULL,
  avatar TEXT NOT NULL,
  text TEXT NOT NULL,
  author_identity_key TEXT NOT NULL,
  helpful INTEGER DEFAULT 0,
  verified INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- =============================================================================
-- TABLE: detail_ratings
-- =============================================================================
CREATE TABLE IF NOT EXISTS detail_ratings (
  id TEXT PRIMARY KEY,
  detail_key TEXT NOT NULL,
  score INTEGER NOT NULL,
  author_identity_key TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- =============================================================================
-- TABLE: policy_violations
-- =============================================================================
CREATE TABLE IF NOT EXISTS policy_violations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain TEXT NOT NULL,
  violation_summary TEXT,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_title TEXT,
  source_published_at TEXT,
  first_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

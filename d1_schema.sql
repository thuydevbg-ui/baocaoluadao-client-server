-- Migration: Create initial schema for D1 (SQLite)
-- This is a SQLite-compatible schema converted from MySQL

-- Categories table
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

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);

-- Scams table (main data table with ~88K rows)
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

CREATE INDEX IF NOT EXISTS idx_scams_type ON scams(type);
CREATE INDEX IF NOT EXISTS idx_scams_value ON scams(value);
CREATE INDEX IF NOT EXISTS idx_scams_status ON scams(status);
CREATE INDEX IF NOT EXISTS idx_scams_risk_level ON scams(risk_level);
CREATE INDEX IF NOT EXISTS idx_scams_is_scam ON scams(is_scam);
CREATE INDEX IF NOT EXISTS idx_scams_created ON scams(created_at);

-- Site settings table
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  type TEXT NOT NULL DEFAULT 'string',
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Reports table
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

CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);
CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(target);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at);

-- Detail view counts
CREATE TABLE IF NOT EXISTS detail_view_counts (
  detail_key TEXT PRIMARY KEY,
  views INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Detail feedback
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

CREATE INDEX IF NOT EXISTS idx_detail_feedback_key ON detail_feedback(detail_key);
CREATE INDEX IF NOT EXISTS idx_detail_feedback_created ON detail_feedback(created_at);

-- Detail ratings
CREATE TABLE IF NOT EXISTS detail_ratings (
  id TEXT PRIMARY KEY,
  detail_key TEXT NOT NULL,
  score INTEGER NOT NULL,
  author_identity_key TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_detail_ratings_key ON detail_ratings(detail_key);
CREATE INDEX IF NOT EXISTS idx_detail_ratings_created ON detail_ratings(created_at);

-- Policy violations
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_policy_violations_domain ON policy_violations(domain);
CREATE INDEX IF NOT EXISTS idx_policy_violations_source ON policy_violations(source_name);
CREATE INDEX IF NOT EXISTS idx_policy_violations_updated ON policy_violations(updated_at);

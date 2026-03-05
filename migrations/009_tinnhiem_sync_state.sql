-- Migration 009: Persist tinnhiemmang sync metadata + enrich scam records
-- Created: 2026-03-04

CREATE TABLE IF NOT EXISTS external_sync_state (
  source VARCHAR(80) PRIMARY KEY,
  last_sync_started_at DATETIME DEFAULT NULL,
  last_sync_completed_at DATETIME DEFAULT NULL,
  last_success_at DATETIME DEFAULT NULL,
  last_error TEXT,
  pages_synced INT NOT NULL DEFAULT 0,
  records_synced INT NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_external_sync_updated_at (updated_at),
  INDEX idx_external_sync_last_success (last_success_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE scams
  ADD COLUMN IF NOT EXISTS external_status VARCHAR(64) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS external_created_at DATETIME DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS organization_name VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS source_url VARCHAR(500) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS external_hash VARCHAR(64) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS external_category VARCHAR(40) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS icon VARCHAR(500) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS organization_icon VARCHAR(500) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_scam BOOLEAN DEFAULT TRUE;  -- TRUE = scam/blacklist, FALSE = trusted

CREATE INDEX IF NOT EXISTS idx_scams_source ON scams(source);
CREATE INDEX IF NOT EXISTS idx_scams_external_category ON scams(external_category);
CREATE INDEX IF NOT EXISTS idx_scams_external_created_at ON scams(external_created_at);
CREATE INDEX IF NOT EXISTS idx_scams_source_type ON scams(source, type);
CREATE INDEX IF NOT EXISTS idx_scams_source_hash ON scams(source, external_hash);

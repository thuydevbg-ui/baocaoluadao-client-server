-- Migration 014: Store domain registration timestamps
-- Created: 2026-03-13

ALTER TABLE scams
  ADD COLUMN IF NOT EXISTS domain_registered_at DATETIME DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS domain_registered_checked_at DATETIME DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_scams_domain_registered_at ON scams(domain_registered_at);
CREATE INDEX IF NOT EXISTS idx_scams_domain_registered_checked_at ON scams(domain_registered_checked_at);

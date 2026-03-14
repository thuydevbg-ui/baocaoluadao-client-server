-- Migration 015: Store domain expiration timestamps
-- Created: 2026-03-13

ALTER TABLE scams
  ADD COLUMN IF NOT EXISTS domain_expires_at DATETIME DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS domain_expires_checked_at DATETIME DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_scams_domain_expires_at ON scams(domain_expires_at);
CREATE INDEX IF NOT EXISTS idx_scams_domain_expires_checked_at ON scams(domain_expires_checked_at);

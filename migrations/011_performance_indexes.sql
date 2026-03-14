-- ScamGuard Database Migration
-- Version: 011
-- Description: Add indexes for read-heavy endpoints (categories/search)
-- Created: 2026-03-12

-- Composite index to speed up category listings:
-- WHERE source = ? AND type = ? AND is_scam = ?
-- ORDER BY report_count DESC, created_at DESC
CREATE INDEX IF NOT EXISTS idx_scams_source_type_is_scam_report_created
  ON scams (source, type, is_scam, report_count, created_at);


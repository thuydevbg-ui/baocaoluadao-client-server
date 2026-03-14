-- Migration 016: Performance indexes for optimized queries
-- Created: 2026-03-14
-- Description: Add indexes to improve query performance

-- Index for scams status queries (filtering by status)
CREATE INDEX IF NOT EXISTS idx_scams_status ON scams(status);

-- Index for scams source queries (filtering by source)
CREATE INDEX IF NOT EXISTS idx_scams_source ON scams(source);

-- Index for detail_ratings key lookups
CREATE INDEX IF NOT EXISTS idx_detail_ratings_key ON detail_ratings(detail_id);

-- Index for detail_feedback key lookups  
CREATE INDEX IF NOT EXISTS idx_detail_feedback_key ON detail_feedback(detail_id);

-- Index for detail_view_counts key lookups
CREATE INDEX IF NOT EXISTS idx_detail_view_counts_key ON detail_view_counts(detail_id);

-- Migration 011: Create detail view counter table
-- Created: 2026-03-06
-- Purpose: Track real page views for detail pages (instead of using ratings/comments as a proxy)

-- Run this script to set up the database:
-- mysql -u your_user -p your_database < migrations/011_detail_view_counts.sql

CREATE TABLE IF NOT EXISTS detail_view_counts (
    detail_key VARCHAR(220) PRIMARY KEY,
    views BIGINT UNSIGNED NOT NULL DEFAULT 0,
    created_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP()*1000),
    updated_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP()*1000),

    INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


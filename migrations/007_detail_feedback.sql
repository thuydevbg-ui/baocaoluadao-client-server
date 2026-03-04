-- Migration 007: Add detail feedback tables for persistent comments and ratings
-- Created: 2026-03-04

-- Table for storing comments on detail pages
CREATE TABLE IF NOT EXISTS detail_feedback (
  id VARCHAR(36) PRIMARY KEY,
  detail_key VARCHAR(220) NOT NULL,
  user VARCHAR(80) NOT NULL,
  avatar VARCHAR(1) NOT NULL DEFAULT 'U',
  text TEXT NOT NULL,
  author_identity_key VARCHAR(100) NOT NULL,
  helpful INT UNSIGNED DEFAULT 0,
  created_at BIGINT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  helpful_by_identity JSON DEFAULT (JSON_ARRAY()),
  INDEX idx_detail_key (detail_key),
  INDEX idx_created_at (created_at),
  INDEX idx_author_identity (author_identity_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for storing ratings on detail pages
CREATE TABLE IF NOT EXISTS detail_ratings (
  id VARCHAR(36) PRIMARY KEY,
  detail_key VARCHAR(220) NOT NULL,
  identity_key VARCHAR(100) NOT NULL,
  score INT UNSIGNED NOT NULL,
  created_at BIGINT NOT NULL,
  identity_type VARCHAR(20) NOT NULL,
  UNIQUE KEY uk_identity_detail (identity_key, detail_key),
  INDEX idx_detail_key (detail_key),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

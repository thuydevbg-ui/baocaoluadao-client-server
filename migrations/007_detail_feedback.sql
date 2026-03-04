-- Migration 007: Create detail feedback tables for scam detail comments and ratings
-- Created: 2026-03-04
-- Purpose: Replace in-memory Map storage with persistent database tables

-- Run this script to set up the database:
-- mysql -u your_user -p your_database < migrations/007_detail_feedback.sql

-- ============================================
-- DETAIL FEEDBACK TABLE
-- Stores user comments on scam detail pages
-- Replaces: globalThis.__scamGuardDetailFeedbackStore comments
-- ============================================
CREATE TABLE IF NOT EXISTS detail_feedback (
    id VARCHAR(36) PRIMARY KEY,
    detail_key VARCHAR(220) NOT NULL,
    user VARCHAR(80) NOT NULL,
    avatar VARCHAR(1) NOT NULL,
    text TEXT NOT NULL,
    author_identity_key VARCHAR(100) NOT NULL,
    helpful INT DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_detail_key (detail_key),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DETAIL RATINGS TABLE
-- Stores user ratings (1-5 stars) on scam detail pages
-- Replaces: globalThis.__scamGuardDetailFeedbackStore ratings
-- ============================================
CREATE TABLE IF NOT EXISTS detail_ratings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    detail_key VARCHAR(220) NOT NULL,
    identity_key VARCHAR(100) NOT NULL,
    score TINYINT NOT NULL,
    identity_type ENUM('user', 'ip', 'visitor') NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_detail_key (detail_key),
    INDEX idx_identity_key (identity_key),
    UNIQUE KEY unique_identity_per_detail (detail_key, identity_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Migration 004: Create ai_scan_results table for AI scan persistence
-- Created: 2026-03-01

CREATE TABLE IF NOT EXISTS ai_scan_results (
    id CHAR(36) PRIMARY KEY,
    domain VARCHAR(255) NOT NULL UNIQUE,
    job_id VARCHAR(255) DEFAULT NULL,
    deterministic_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    heuristic_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    deterministic_flags JSON NOT NULL,
    heuristic_reasons JSON NOT NULL,
    ai_score DECIMAL(5,2) DEFAULT NULL,
    ai_status ENUM('pending','ok','fallback','skipped') NOT NULL DEFAULT 'pending',
    ai_reasons JSON DEFAULT NULL,
    ai_summary TEXT DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ai_scan_job (job_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

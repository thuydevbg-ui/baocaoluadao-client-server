-- Migration 010: Policy violation list (legal warning)
-- Created: 2026-03-05

CREATE TABLE IF NOT EXISTS policy_violations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  domain VARCHAR(255) NOT NULL,
  violation_summary TEXT,
  source_name VARCHAR(120) NOT NULL,
  source_url VARCHAR(700) NOT NULL,
  source_title VARCHAR(255) DEFAULT NULL,
  source_published_at DATETIME DEFAULT NULL,
  first_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_policy_violations_domain (domain),
  KEY idx_policy_violations_source (source_name),
  KEY idx_policy_violations_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


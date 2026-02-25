-- ScamGuard Database Migration
-- Version: 001
-- Description: Create initial schema for reports and rate limiting
-- Created: 2026-02-23

-- Run this script to set up the database:
-- mysql -u your_user -p your_database < migrations/001_initial_schema.sql

-- Create database if not exists (run separately if needed)
-- CREATE DATABASE IF NOT EXISTS scamguard;
-- USE scamguard;

-- ============================================
-- REPORTS TABLE
-- Stores community scam reports
-- ============================================
CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(20) PRIMARY KEY,
    type ENUM('website', 'phone', 'email', 'social', 'sms') NOT NULL,
    target VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    reporter_name VARCHAR(80) DEFAULT NULL,
    reporter_email VARCHAR(120) DEFAULT NULL,
    source ENUM('community', 'auto_scan', 'manual') NOT NULL DEFAULT 'community',
    status ENUM('pending', 'processing', 'completed') NOT NULL DEFAULT 'pending',
    ip VARCHAR(45) DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_status (status),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at),
    INDEX idx_target (target(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- RATE LIMITS TABLE
-- Tracks rate limiting per IP address
-- ============================================
CREATE TABLE IF NOT EXISTS rate_limits (
    ip VARCHAR(45) PRIMARY KEY,
    count INT NOT NULL DEFAULT 1,
    first_attempt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reset_time DATETIME NOT NULL,
    
    INDEX idx_reset_time (reset_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ADMIN USERS TABLE (Optional - for future use)
-- Stores admin users with hashed passwords
-- ============================================
CREATE TABLE IF NOT EXISTS admin_users (
    id VARCHAR(20) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('super_admin', 'admin', 'moderator') NOT NULL DEFAULT 'moderator',
    status ENUM('active', 'banned', 'suspended') NOT NULL DEFAULT 'active',
    last_login_at DATETIME DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ADMIN ACTIVITY LOGS TABLE (Optional)
-- Tracks admin actions for audit
-- ============================================
CREATE TABLE IF NOT EXISTS admin_activity_logs (
    id VARCHAR(20) PRIMARY KEY,
    action VARCHAR(120) NOT NULL,
    user VARCHAR(120) NOT NULL,
    ip VARCHAR(45) DEFAULT NULL,
    target VARCHAR(180) DEFAULT NULL,
    status ENUM('success', 'failed', 'warning') NOT NULL,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user (user),
    INDEX idx_timestamp (timestamp),
    INDEX idx_action (action(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SCAM RECORDS TABLE (Optional)
-- Stores confirmed scam entries
-- ============================================
CREATE TABLE IF NOT EXISTS scams (
    id VARCHAR(20) PRIMARY KEY,
    type ENUM('website', 'phone', 'email', 'bank', 'social', 'sms') NOT NULL,
    value VARCHAR(500) NOT NULL,
    description TEXT,
    report_count INT NOT NULL DEFAULT 1,
    risk_level ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
    status ENUM('active', 'investigating', 'blocked') NOT NULL DEFAULT 'active',
    source VARCHAR(50) DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_risk_level (risk_level),
    INDEX idx_value (value(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

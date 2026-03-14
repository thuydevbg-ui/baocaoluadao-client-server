-- Migration: 017_optimize_indexes.sql
-- Description: Add performance indexes for common queries
-- Created: 2026-03-14

-- =====================================================
-- INDEXES FOR DETAIL FEEDBACK AND RATINGS
-- =====================================================

-- Index for detail page feedback queries (sorted by date)
CREATE INDEX idx_detail_feedback_created_at ON detail_feedback(created_at DESC);

-- Index for detail ratings with score filtering
CREATE INDEX idx_detail_ratings_detail_score ON detail_ratings(detail_key, score);

-- =====================================================
-- INDEXES FOR USER ACTIVITY
-- =====================================================

-- Index for user activity queries by user and action
CREATE INDEX idx_auth_activity_user_action ON auth_activity(user_id, action);

-- Index for activity queries by date and action
CREATE INDEX idx_auth_activity_created_action ON auth_activity(created_at, action);

-- =====================================================
-- INDEXES FOR LOGIN ATTEMPTS
-- =====================================================

-- Index for login attempt checks (email + locked status)
CREATE INDEX idx_login_attempts_email_status ON login_attempts(email, locked_until);

-- =====================================================
-- INDEXES FOR SESSIONS
-- =====================================================

-- Index for session cleanup queries
CREATE INDEX idx_auth_sessions_expires_user ON auth_sessions(expires_at, user_id);

-- =====================================================
-- INDEXES FOR REPORTS (if not already exists)
-- =====================================================

-- Additional indexes for reports if needed
-- CREATE INDEX idx_reports_status_type ON reports(status, type);
-- CREATE INDEX idx_reports_created_status ON reports(created_at, status);

-- =====================================================
-- INDEXES FOR SCAMS
-- =====================================================

-- Index for scam type queries
-- CREATE INDEX idx_scams_type_created ON scams(type, created_at DESC);

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================

-- Run this to verify indexes were created:
-- SHOW INDEX FROM detail_feedback;
-- SHOW INDEX FROM detail_ratings;
-- SHOW INDEX FROM auth_activity;
-- SHOW INDEX FROM login_attempts;
-- SHOW INDEX FROM auth_sessions;

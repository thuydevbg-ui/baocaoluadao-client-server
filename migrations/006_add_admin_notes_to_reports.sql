-- Migration 006: Add admin_notes to reports for moderator annotations
-- Created: 2026-03-03

ALTER TABLE reports
  ADD COLUMN admin_notes TEXT NULL AFTER status;

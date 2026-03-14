-- Migration 016: Add footer JSON columns to site_settings
-- Created: 2026-03-14
-- Description: Store footer contacts and links as JSON in database

ALTER TABLE site_settings 
  ADD COLUMN IF NOT EXISTS footerContactsJson TEXT NULL;

ALTER TABLE site_settings 
  ADD COLUMN IF NOT EXISTS footerLinksJson TEXT NULL;

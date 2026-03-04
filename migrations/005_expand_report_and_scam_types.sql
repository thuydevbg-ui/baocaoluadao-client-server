-- Migration 005: Expand reports/scams type enums to include extended categories
-- Created: 2026-03-03

ALTER TABLE reports
  MODIFY COLUMN type ENUM(
    'website',
    'phone',
    'email',
    'social',
    'sms',
    'bank',
    'device',
    'system',
    'application',
    'organization'
  ) NOT NULL;

ALTER TABLE scams
  MODIFY COLUMN type ENUM(
    'website',
    'phone',
    'email',
    'bank',
    'social',
    'sms',
    'device',
    'system',
    'application',
    'organization'
  ) NOT NULL;

-- HERTZ Platform
-- Migration 023: Bind mobile member sessions to device metadata

ALTER TABLE hertz_member_sessions
  ADD COLUMN IF NOT EXISTS device_id TEXT,
  ADD COLUMN IF NOT EXISTS platform TEXT,
  ADD COLUMN IF NOT EXISTS app_version TEXT;

ALTER TABLE hertz_member_sessions
  DROP CONSTRAINT IF EXISTS hertz_member_sessions_platform_check;

ALTER TABLE hertz_member_sessions
  ADD CONSTRAINT hertz_member_sessions_platform_check
  CHECK (platform IS NULL OR platform IN ('ios', 'android', 'expo'));

CREATE INDEX IF NOT EXISTS idx_hertz_member_sessions_device_id
  ON hertz_member_sessions(device_id)
  WHERE device_id IS NOT NULL;


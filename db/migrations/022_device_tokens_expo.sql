-- HERTZ Platform
-- Migration 022: Support Expo push tokens

ALTER TABLE device_tokens
  DROP CONSTRAINT IF EXISTS device_tokens_platform_check;

ALTER TABLE device_tokens
  ADD CONSTRAINT device_tokens_platform_check
  CHECK (platform IN ('android', 'ios', 'expo'));

ALTER TABLE notification_events
  DROP CONSTRAINT IF EXISTS notification_events_status_check;

ALTER TABLE notification_events
  ADD CONSTRAINT notification_events_status_check
  CHECK (status IN ('pending', 'queued', 'sent', 'failed', 'skipped', 'invalid_token'));

ALTER TABLE notification_events
  ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 0;


-- HERTZ Platform
-- Migration 021: Mobile auth handoff nonces

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS auth_handoff_nonces (
  nonce TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  app_version TEXT,
  consumed_at TIMESTAMPTZ,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_handoff_nonces_expires_at
  ON auth_handoff_nonces(expires_at);

CREATE INDEX IF NOT EXISTS idx_auth_handoff_nonces_unconsumed
  ON auth_handoff_nonces(expires_at)
  WHERE consumed_at IS NULL;


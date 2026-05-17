-- ============================================
-- Horizon Trader Platform — Schema Update
-- Migration 012: Add optional Outlook metadata
-- ============================================

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS outlook_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_articles_outlook_metadata
  ON articles USING GIN (outlook_metadata)
  WHERE category = 'outlook';

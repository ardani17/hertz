-- ============================================
-- Hertz Trader Platform — Retire Blog Credit Settings
-- Migration 020: remove orphaned blog credit rows after blog category removal
-- ============================================

DELETE FROM credit_settings
WHERE category = 'blog';

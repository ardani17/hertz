-- ============================================
-- Hertz Trader Platform
-- Migration 010: WordPress imports belong to Blog
-- ============================================

UPDATE articles
SET category = 'blog'
WHERE source = 'wordpress'
  AND category = 'outlook';

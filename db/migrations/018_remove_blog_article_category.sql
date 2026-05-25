-- HERTZ Platform
-- Migration 018: Retire the legacy blog article category

UPDATE articles
SET category = 'general',
    status = CASE WHEN status = 'published' THEN 'hidden' ELSE status END
WHERE category = 'blog';

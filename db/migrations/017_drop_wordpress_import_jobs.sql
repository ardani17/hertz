-- HERTZ Platform
-- Migration 017: Remove legacy WordPress import job tracking

DO $$
BEGIN
  DROP TABLE IF EXISTS wordpress_import_jobs;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping wordpress_import_jobs drop: current database user is not the table owner';
END $$;

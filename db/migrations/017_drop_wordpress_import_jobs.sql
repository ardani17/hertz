-- HERTZ Platform
-- Migration 017: Remove legacy WordPress import job tracking

DROP TABLE IF EXISTS wordpress_import_jobs;

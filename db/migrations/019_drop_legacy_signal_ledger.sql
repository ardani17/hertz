-- HERTZ Platform
-- Migration 019: Remove legacy signal-ledger tables superseded by hertz_* tables

DROP TABLE IF EXISTS community_note_ratings;
DROP TABLE IF EXISTS community_note_sources;
DROP TABLE IF EXISTS community_notes;
DROP TABLE IF EXISTS post_reports;
DROP TABLE IF EXISTS post_comments;
DROP TABLE IF EXISTS post_views;
DROP TABLE IF EXISTS post_reposts;
DROP TABLE IF EXISTS post_bookmarks;
DROP TABLE IF EXISTS post_reactions;
DROP TABLE IF EXISTS post_market_context;
DROP TABLE IF EXISTS feed_posts;
DROP TABLE IF EXISTS telegram_memberships;
DROP TABLE IF EXISTS member_sessions;

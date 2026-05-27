-- HERTZ Platform
-- Migration 019: Remove legacy signal-ledger tables superseded by hertz_* tables

DO $$
DECLARE
  legacy_table text;
BEGIN
  FOREACH legacy_table IN ARRAY ARRAY[
    'community_note_ratings',
    'community_note_sources',
    'community_notes',
    'post_reports',
    'post_comments',
    'post_views',
    'post_reposts',
    'post_bookmarks',
    'post_reactions',
    'post_market_context',
    'feed_posts',
    'telegram_memberships',
    'member_sessions'
  ]
  LOOP
    BEGIN
      EXECUTE format('DROP TABLE IF EXISTS %I', legacy_table);
    EXCEPTION
      WHEN insufficient_privilege THEN
        RAISE NOTICE 'Skipping % drop: current database user is not the table owner', legacy_table;
    END;
  END LOOP;
END $$;

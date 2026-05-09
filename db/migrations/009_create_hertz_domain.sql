-- ============================================
-- Horizon Trader Platform
-- Migration 009: HERTZ clean domain
-- ============================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS hertz_member_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_hertz_member_sessions_token_hash ON hertz_member_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_hertz_member_sessions_user_id ON hertz_member_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_hertz_member_sessions_expires_at ON hertz_member_sessions(expires_at);

CREATE TABLE IF NOT EXISTS hertz_membership_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  telegram_id BIGINT NOT NULL,
  group_id BIGINT NOT NULL,
  is_member BOOLEAN NOT NULL DEFAULT false,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_verified_at TIMESTAMPTZ,
  raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(telegram_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_hertz_membership_checks_user_id ON hertz_membership_checks(user_id);
CREATE INDEX IF NOT EXISTS idx_hertz_membership_checks_state ON hertz_membership_checks(is_member, last_verified_at);

-- Compatibility upgrade for the existing social tables while code is
-- refactored into the HERTZ domain.
ALTER TABLE feed_posts
  ADD COLUMN IF NOT EXISTS short_id VARCHAR(32);

UPDATE feed_posts
SET short_id = 'hz_' || lower(substr(replace(id::text, '-', ''), 1, 8))
WHERE short_id IS NULL;

ALTER TABLE feed_posts
  ALTER COLUMN short_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_feed_posts_short_id ON feed_posts(short_id);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_feed_posts_telegram_source_message
  ON feed_posts(telegram_chat_id, telegram_message_id)
  WHERE telegram_chat_id IS NOT NULL AND telegram_message_id IS NOT NULL;

UPDATE post_reactions
SET reaction_type = 'pulse'
WHERE reaction_type IN ('signal');

ALTER TABLE post_reactions
  ALTER COLUMN reaction_type SET DEFAULT 'pulse';

CREATE TABLE IF NOT EXISTS hertz_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_id VARCHAR(32) NOT NULL UNIQUE,
  article_id UUID REFERENCES articles(id) ON DELETE SET NULL,
  author_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(20) NOT NULL DEFAULT 'original',
  source VARCHAR(30) NOT NULL,
  category VARCHAR(50) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'published',
  visibility VARCHAR(20) NOT NULL DEFAULT 'public',
  content TEXT,
  quoted_post_id UUID REFERENCES hertz_posts(id) ON DELETE SET NULL,
  telegram_message_id BIGINT,
  telegram_chat_id BIGINT,
  pinned_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (type IN ('original', 'quote', 'repost')),
  CHECK (source IN ('telegram', 'web', 'admin', 'system')),
  CHECK (category IN ('trading_room', 'life_coffee', 'general', 'community_note')),
  CHECK (status IN ('pending_review', 'published', 'hidden', 'deleted', 'rejected')),
  CHECK (visibility IN ('public'))
);

CREATE INDEX IF NOT EXISTS idx_hertz_posts_status_created ON hertz_posts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hertz_posts_author ON hertz_posts(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hertz_posts_category_created ON hertz_posts(category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hertz_posts_article ON hertz_posts(article_id);
CREATE INDEX IF NOT EXISTS idx_hertz_posts_telegram_message ON hertz_posts(telegram_chat_id, telegram_message_id);

CREATE TABLE IF NOT EXISTS hertz_post_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES hertz_posts(id) ON DELETE CASCADE,
  media_id UUID REFERENCES media(id) ON DELETE SET NULL,
  file_url VARCHAR(1000) NOT NULL,
  media_type VARCHAR(20) NOT NULL DEFAULT 'image',
  file_key VARCHAR(1000),
  file_size BIGINT,
  alt_text VARCHAR(500),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (media_type IN ('image', 'video'))
);

CREATE INDEX IF NOT EXISTS idx_hertz_post_media_post ON hertz_post_media(post_id, sort_order);

CREATE TABLE IF NOT EXISTS hertz_post_market_context (
  post_id UUID PRIMARY KEY REFERENCES hertz_posts(id) ON DELETE CASCADE,
  pair VARCHAR(30),
  timeframe VARCHAR(30),
  risk_percent NUMERIC(8, 4),
  direction VARCHAR(20),
  entry_price NUMERIC(20, 8),
  entry_zone VARCHAR(120),
  stop_loss NUMERIC(20, 8),
  take_profit NUMERIC(20, 8),
  setup_type VARCHAR(80),
  confidence_percent NUMERIC(5, 2),
  broker_or_source VARCHAR(120),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hertz_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES hertz_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL DEFAULT 'pulse',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CHECK (type IN ('pulse'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_hertz_active_pulse
  ON hertz_reactions(post_id, user_id, type)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS hertz_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES hertz_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_hertz_active_bookmark
  ON hertz_bookmarks(post_id, user_id)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS hertz_reposts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_post_id UUID NOT NULL REFERENCES hertz_posts(id) ON DELETE CASCADE,
  repost_post_id UUID REFERENCES hertz_posts(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  repost_type VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CHECK (repost_type IN ('repost', 'quote'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_hertz_plain_repost
  ON hertz_reposts(original_post_id, user_id, repost_type)
  WHERE deleted_at IS NULL AND repost_type = 'repost';

CREATE TABLE IF NOT EXISTS hertz_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES hertz_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_hash VARCHAR(255),
  ip_hash VARCHAR(255),
  user_agent_hash VARCHAR(255),
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hertz_views_post ON hertz_views(post_id, viewed_at DESC);

CREATE TABLE IF NOT EXISTS hertz_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES hertz_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES hertz_comments(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'visible',
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (status IN ('visible', 'hidden', 'deleted'))
);

CREATE INDEX IF NOT EXISTS idx_hertz_comments_post_created ON hertz_comments(post_id, created_at ASC);

CREATE TABLE IF NOT EXISTS hertz_community_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES hertz_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'published',
  helpful_count INTEGER NOT NULL DEFAULT 0,
  not_helpful_count INTEGER NOT NULL DEFAULT 0,
  edited_at TIMESTAMPTZ,
  hidden_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (status IN ('published', 'hidden', 'deleted'))
);

CREATE TABLE IF NOT EXISTS hertz_community_note_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES hertz_community_notes(id) ON DELETE CASCADE,
  source_url VARCHAR(1500) NOT NULL,
  source_title VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hertz_community_note_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES hertz_community_notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (rating IN ('helpful', 'not_helpful')),
  UNIQUE(note_id, user_id)
);

CREATE TABLE IF NOT EXISTS hertz_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type VARCHAR(30) NOT NULL,
  target_id UUID NOT NULL,
  reporter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR(50) NOT NULL,
  details TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (target_type IN ('post', 'comment', 'community_note', 'blog', 'dm_message')),
  CHECK (status IN ('open', 'reviewing', 'resolved', 'rejected'))
);

CREATE INDEX IF NOT EXISTS idx_hertz_reports_status_created ON hertz_reports(status, created_at DESC);

CREATE TABLE IF NOT EXISTS hertz_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_type VARCHAR(20) NOT NULL DEFAULT 'direct',
  direct_key VARCHAR(255) UNIQUE,
  last_message_id UUID,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (conversation_type IN ('direct'))
);

CREATE TABLE IF NOT EXISTS hertz_conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES hertz_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  archived_at TIMESTAMPTZ,
  last_read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_hertz_participants_user ON hertz_conversation_participants(user_id, archived_at);

CREATE TABLE IF NOT EXISTS hertz_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES hertz_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_hertz_last_message'
  ) THEN
    ALTER TABLE hertz_conversations
      ADD CONSTRAINT fk_hertz_last_message
      FOREIGN KEY (last_message_id) REFERENCES hertz_messages(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_hertz_messages_conversation ON hertz_messages(conversation_id, created_at DESC);

CREATE TABLE IF NOT EXISTS hertz_message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES hertz_messages(id) ON DELETE CASCADE,
  file_url VARCHAR(1000) NOT NULL,
  file_key VARCHAR(1000),
  mime_type VARCHAR(120) NOT NULL,
  file_size BIGINT NOT NULL,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp'))
);

CREATE TABLE IF NOT EXISTS hertz_message_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES hertz_messages(id) ON DELETE CASCADE,
  reporter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR(50) NOT NULL,
  details TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (status IN ('open', 'reviewing', 'resolved', 'rejected')),
  UNIQUE(message_id, reporter_user_id)
);

CREATE TABLE IF NOT EXISTS hertz_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_user_id, blocked_user_id),
  CHECK (blocker_user_id <> blocked_user_id)
);

CREATE TABLE IF NOT EXISTS hertz_credit_settings (
  key VARCHAR(80) PRIMARY KEY,
  amount INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hertz_credit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(80) NOT NULL,
  entity_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_type, entity_id)
);

INSERT INTO hertz_credit_settings (key, amount, is_active)
VALUES
  ('hertz_post_published', 10, true),
  ('telegram_post_published', 10, true),
  ('blog_published', 15, true),
  ('pulse', 0, false),
  ('comment', 0, false),
  ('repost', 0, false)
ON CONFLICT (key) DO NOTHING;

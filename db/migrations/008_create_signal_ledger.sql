-- ============================================
-- Horizon Trader Platform
-- Migration 008: Signal Ledger feed domain
-- ============================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User profile and moderation fields for member-facing identity.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS display_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(1000),
  ADD COLUMN IF NOT EXISTS telegram_first_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS telegram_last_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS verified_member_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS muted_until TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_users_verified_member_at ON users(verified_member_at);
CREATE INDEX IF NOT EXISTS idx_users_banned_at ON users(banned_at);

-- Member sessions are separate from admin_sessions.
CREATE TABLE IF NOT EXISTS member_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_member_sessions_token_hash ON member_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_member_sessions_expires_at ON member_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_member_sessions_user_id ON member_sessions(user_id);

-- Cache for external Telegram group membership verification.
CREATE TABLE IF NOT EXISTS telegram_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  telegram_id BIGINT NOT NULL,
  group_id BIGINT NOT NULL,
  is_member BOOLEAN NOT NULL DEFAULT false,
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_verified_at TIMESTAMP WITH TIME ZONE,
  raw_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(telegram_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_telegram_memberships_user_id ON telegram_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_memberships_status ON telegram_memberships(is_member, last_verified_at);

-- Social timeline layer.
CREATE TABLE IF NOT EXISTS feed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES articles(id) ON DELETE SET NULL,
  author_id UUID NOT NULL REFERENCES users(id),
  post_type VARCHAR(20) NOT NULL DEFAULT 'original',
  source VARCHAR(30) NOT NULL,
  category VARCHAR(50) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'published',
  visibility VARCHAR(20) NOT NULL DEFAULT 'public',
  quoted_post_id UUID REFERENCES feed_posts(id) ON DELETE SET NULL,
  repost_id UUID,
  telegram_message_id BIGINT,
  telegram_chat_id BIGINT,
  pinned_at TIMESTAMP WITH TIME ZONE,
  edited_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (post_type IN ('original', 'quote', 'repost')),
  CHECK (source IN ('telegram', 'web', 'admin', 'system')),
  CHECK (status IN ('draft', 'pending_review', 'published', 'hidden', 'rejected', 'deleted')),
  CHECK (visibility IN ('public'))
);

CREATE INDEX IF NOT EXISTS idx_feed_posts_status_created ON feed_posts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_posts_author ON feed_posts(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_posts_category_created ON feed_posts(category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_posts_article_id ON feed_posts(article_id);
CREATE INDEX IF NOT EXISTS idx_feed_posts_quoted_post_id ON feed_posts(quoted_post_id);
CREATE INDEX IF NOT EXISTS idx_feed_posts_telegram_message ON feed_posts(telegram_chat_id, telegram_message_id);

-- Optional trading metadata for Trading Room posts.
CREATE TABLE IF NOT EXISTS post_market_context (
  post_id UUID PRIMARY KEY REFERENCES feed_posts(id) ON DELETE CASCADE,
  pair VARCHAR(30),
  timeframe VARCHAR(30),
  risk_percent NUMERIC(8, 4),
  direction VARCHAR(20),
  entry_price NUMERIC(20, 8),
  entry_zone VARCHAR(120),
  stop_loss NUMERIC(20, 8),
  take_profit NUMERIC(20, 8),
  take_profit_1 NUMERIC(20, 8),
  take_profit_2 NUMERIC(20, 8),
  take_profit_3 NUMERIC(20, 8),
  setup_type VARCHAR(80),
  confidence_percent NUMERIC(5, 2),
  broker_or_source VARCHAR(120),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Signal reaction.
CREATE TABLE IF NOT EXISTS post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction_type VARCHAR(30) NOT NULL DEFAULT 'signal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_post_signal
  ON post_reactions(post_id, user_id, reaction_type)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_post_reactions_post_id ON post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_user_id ON post_reactions(user_id);

-- Private bookmarks.
CREATE TABLE IF NOT EXISTS post_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_post_bookmark
  ON post_bookmarks(post_id, user_id)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_post_bookmarks_user_id ON post_bookmarks(user_id, created_at DESC);

-- Repost and quote repost.
CREATE TABLE IF NOT EXISTS post_reposts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  repost_post_id UUID REFERENCES feed_posts(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  repost_type VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  CHECK (repost_type IN ('repost', 'quote'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_plain_repost
  ON post_reposts(original_post_id, user_id, repost_type)
  WHERE deleted_at IS NULL AND repost_type = 'repost';
CREATE INDEX IF NOT EXISTS idx_post_reposts_original ON post_reposts(original_post_id);
CREATE INDEX IF NOT EXISTS idx_post_reposts_user ON post_reposts(user_id, created_at DESC);

-- Public view insight.
CREATE TABLE IF NOT EXISTS post_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_hash VARCHAR(255),
  ip_hash VARCHAR(255),
  user_agent_hash VARCHAR(255),
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_views_post_id_viewed ON post_views(post_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_views_session ON post_views(post_id, session_hash, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_views_user ON post_views(post_id, user_id, viewed_at DESC);

-- Member-only comments for Signal Ledger.
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES post_comments(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'visible',
  edited_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (status IN ('visible', 'hidden', 'deleted'))
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post_id_created ON post_comments(post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON post_comments(user_id);

-- Sourced community notes.
CREATE TABLE IF NOT EXISTS community_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'published',
  helpful_count INTEGER NOT NULL DEFAULT 0,
  not_helpful_count INTEGER NOT NULL DEFAULT 0,
  edited_at TIMESTAMP WITH TIME ZONE,
  hidden_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (status IN ('published', 'hidden', 'deleted'))
);

CREATE INDEX IF NOT EXISTS idx_community_notes_post_id ON community_notes(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_notes_status ON community_notes(status);

CREATE TABLE IF NOT EXISTS community_note_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES community_notes(id) ON DELETE CASCADE,
  source_url VARCHAR(1500) NOT NULL,
  source_title VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_note_sources_note_id ON community_note_sources(note_id);

CREATE TABLE IF NOT EXISTS community_note_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES community_notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (rating IN ('helpful', 'not_helpful')),
  UNIQUE(note_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_community_note_ratings_note_id ON community_note_ratings(note_id);

-- Prepared report surface for moderation.
CREATE TABLE IF NOT EXISTS post_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  reporter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR(50) NOT NULL,
  details TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (reason IN ('spam', 'misleading', 'abusive', 'off_topic', 'other')),
  CHECK (status IN ('open', 'reviewing', 'resolved', 'rejected'))
);

CREATE INDEX IF NOT EXISTS idx_post_reports_status_created ON post_reports(status, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_post_report_user_open
  ON post_reports(post_id, reporter_user_id)
  WHERE status IN ('open', 'reviewing');

-- Guard credit awards from double-publish or retry flows.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_credit_article_award
  ON credit_transactions(source_id, source_type, transaction_type)
  WHERE source_id IS NOT NULL AND transaction_type = 'earned';

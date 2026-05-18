-- Migration 013: HERTZ in-app notifications
-- Adds a social notification timeline separate from device push delivery logs.

CREATE TABLE IF NOT EXISTS hertz_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('pulse', 'comment', 'repost', 'quote', 'dm')),
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment', 'conversation')),
  target_id UUID NOT NULL,
  post_id UUID REFERENCES hertz_posts(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES hertz_conversations(id) ON DELETE CASCADE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hertz_notifications_user_created
  ON hertz_notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_hertz_notifications_user_unread
  ON hertz_notifications(user_id, read_at)
  WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_hertz_notifications_post
  ON hertz_notifications(post_id, created_at DESC)
  WHERE post_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_hertz_notifications_conversation
  ON hertz_notifications(conversation_id, created_at DESC)
  WHERE conversation_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_hertz_notifications_pulse_recent
  ON hertz_notifications(user_id, actor_user_id, type, post_id)
  WHERE type = 'pulse' AND post_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_hertz_notifications_dm_conversation_actor
  ON hertz_notifications(user_id, actor_user_id, type, conversation_id)
  WHERE type = 'dm' AND conversation_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS hertz_post_stats (
  post_id UUID PRIMARY KEY REFERENCES hertz_posts(id) ON DELETE CASCADE,
  comment_count INTEGER NOT NULL DEFAULT 0 CHECK (comment_count >= 0),
  pulse_count INTEGER NOT NULL DEFAULT 0 CHECK (pulse_count >= 0),
  repost_count INTEGER NOT NULL DEFAULT 0 CHECK (repost_count >= 0),
  view_count INTEGER NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hertz_post_stats_updated_at ON hertz_post_stats (updated_at DESC);

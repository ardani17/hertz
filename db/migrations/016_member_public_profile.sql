-- Member public profile fields (bio, hobbies, social links, trading experience)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS profile_bio TEXT,
  ADD COLUMN IF NOT EXISTS profile_location VARCHAR(80),
  ADD COLUMN IF NOT EXISTS profile_hobbies JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS profile_social_links JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS profile_trading JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS profile_updated_at TIMESTAMPTZ;

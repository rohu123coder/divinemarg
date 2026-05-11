-- Add push notification token columns (users only).
-- Migration: add_push_tokens
-- Date: 2026-05-11
--
-- Astrologers reference users via user_id; one user row covers both customer and
-- astrologer accounts, so a single expo_push_token per user/device is sufficient.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS expo_push_token TEXT,
  ADD COLUMN IF NOT EXISTS push_token_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS push_platform VARCHAR(10),
  ADD COLUMN IF NOT EXISTS push_enabled BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_users_expo_push_token
  ON users (expo_push_token)
  WHERE expo_push_token IS NOT NULL AND push_enabled = true;

COMMENT ON COLUMN users.expo_push_token IS 'Expo push token (ExponentPushToken[...]) for remote notifications';
COMMENT ON COLUMN users.push_token_updated_at IS 'When expo_push_token was last set or cleared';
COMMENT ON COLUMN users.push_platform IS 'Client platform: ios | android';
COMMENT ON COLUMN users.push_enabled IS 'When false, server should skip sending push to this user';

-- Safe, idempotent migration for chat history/rating/queue enhancements.

ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating BETWEEN 1 AND 5);
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS review_text TEXT;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS rated_at TIMESTAMPTZ;
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS session_type TEXT DEFAULT 'chat';
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS call_channel_name TEXT;

ALTER TABLE astrologers ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(3, 2);
ALTER TABLE astrologers ADD COLUMN IF NOT EXISTS avg_session_duration NUMERIC(10, 2) DEFAULT 5;
ALTER TABLE astrologers ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;
ALTER TABLE astrologers ADD COLUMN IF NOT EXISTS chat_available BOOLEAN DEFAULT true;
ALTER TABLE astrologers ADD COLUMN IF NOT EXISTS voice_available BOOLEAN DEFAULT false;
ALTER TABLE astrologers ADD COLUMN IF NOT EXISTS video_available BOOLEAN DEFAULT false;
ALTER TABLE astrologers ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

CREATE TABLE IF NOT EXISTS session_messages_archive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions (id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('user', 'astrologer')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_messages_archive_session_created
  ON session_messages_archive (session_id, created_at);

CREATE INDEX IF NOT EXISTS idx_waitlist_astrologer_status_position
  ON astrologer_waitlist (astrologer_id, status, position);

CREATE TABLE IF NOT EXISTS astrologer_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  astrologer_id UUID NOT NULL REFERENCES astrologers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
  position INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'waiting',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(astrologer_id, user_id, status)
);

CREATE INDEX IF NOT EXISTS idx_waitlist_astrologer
  ON astrologer_waitlist(astrologer_id, status, position);

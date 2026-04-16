-- Run against your DivineMarg database (adjust connection as needed)

ALTER TABLE astrologers ADD COLUMN IF NOT EXISTS chat_available BOOLEAN DEFAULT true;
ALTER TABLE astrologers ADD COLUMN IF NOT EXISTS voice_available BOOLEAN DEFAULT false;
ALTER TABLE astrologers ADD COLUMN IF NOT EXISTS video_available BOOLEAN DEFAULT false;
UPDATE astrologers SET chat_available = true WHERE is_verified = true;

ALTER TABLE astrologers ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

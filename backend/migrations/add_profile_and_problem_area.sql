-- Add profile fields to users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS marital_status VARCHAR(30),
  ADD COLUMN IF NOT EXISTS occupation VARCHAR(50);

-- Add problem area to chat_sessions
ALTER TABLE chat_sessions
  ADD COLUMN IF NOT EXISTS problem_area VARCHAR(100);

COMMENT ON COLUMN users.marital_status IS 'single/married/engaged/divorced/widowed';
COMMENT ON COLUMN users.occupation IS 'student/job/business/housewife/retired/other';
COMMENT ON COLUMN chat_sessions.problem_area IS 'career/love/marriage/health/family/finance/education/other';

-- Automated intro message marker
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS is_automated BOOLEAN NOT NULL DEFAULT false;

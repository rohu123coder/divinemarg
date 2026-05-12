-- Migration: add_birth_details
-- Add birth detail columns to users table for kundali generation

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS time_of_birth TIME,
  ADD COLUMN IF NOT EXISTS birth_place_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS birth_lat NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS birth_lng NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS birth_utc_offset NUMERIC(4, 2) DEFAULT 5.5,
  ADD COLUMN IF NOT EXISTS gender VARCHAR(20);

CREATE INDEX IF NOT EXISTS idx_users_has_birth_details
  ON users (id)
  WHERE date_of_birth IS NOT NULL;

COMMENT ON COLUMN users.date_of_birth IS 'Birth date for kundali generation';
COMMENT ON COLUMN users.time_of_birth IS 'Birth time for accurate ascendant';
COMMENT ON COLUMN users.birth_place_name IS 'Display name of birth city';
COMMENT ON COLUMN users.birth_lat IS 'Latitude for kundali calculation';
COMMENT ON COLUMN users.birth_lng IS 'Longitude for kundali calculation';
COMMENT ON COLUMN users.birth_utc_offset IS 'UTC offset (5.5 for IST)';
COMMENT ON COLUMN users.gender IS 'male/female/other (optional)';

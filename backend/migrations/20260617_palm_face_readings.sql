-- Palm & Face Reading reports (Hand & Face Reading feature)
CREATE TABLE palm_face_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  palm_photo_url TEXT,
  face_photo_url TEXT,
  overview TEXT NOT NULL,
  samagri TEXT NOT NULL,
  vidhi TEXT NOT NULL,
  raw_observations JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_palm_face_readings_user_id ON palm_face_readings(user_id);

COMMENT ON TABLE palm_face_readings IS 'Stored Hand & Face Reading reports generated from palm/face photos';
COMMENT ON COLUMN palm_face_readings.category IS 'Problem area category (matches mobile PROBLEM_AREAS values)';
COMMENT ON COLUMN palm_face_readings.raw_observations IS 'Raw Claude vision JSON observations for palm and/or face';

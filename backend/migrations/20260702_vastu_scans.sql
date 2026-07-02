-- AI Vastu Scanner scan reports
CREATE TABLE IF NOT EXISTS vastu_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_type TEXT NOT NULL DEFAULT 'residential',
  north_direction NUMERIC(6, 2) NOT NULL,
  photo_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  overall_score NUMERIC(5, 2) NOT NULL,
  report JSONB NOT NULL,
  raw_analysis JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vastu_scans_user_id ON vastu_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_vastu_scans_created_at ON vastu_scans(user_id, created_at DESC);

COMMENT ON TABLE vastu_scans IS 'AI Vastu Scanner reports from photo analysis';
COMMENT ON COLUMN vastu_scans.report IS 'Full VastuReport JSON returned to client';
COMMENT ON COLUMN vastu_scans.raw_analysis IS 'Raw Claude vision VastuAnalysis JSON';

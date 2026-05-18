ALTER TABLE demo_booking_leads
  ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(14, 2);

CREATE INDEX IF NOT EXISTS idx_demo_booking_leads_phone ON demo_booking_leads (phone);

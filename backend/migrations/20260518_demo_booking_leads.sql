CREATE TABLE IF NOT EXISTS demo_booking_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  current_business TEXT,
  amount NUMERIC(14, 2) NOT NULL DEFAULT 99,
  source TEXT NOT NULL DEFAULT 'landing-page-b2b',
  status TEXT NOT NULL DEFAULT 'pending',
  razorpay_order_id TEXT UNIQUE,
  razorpay_payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_demo_booking_leads_email ON demo_booking_leads (email);
CREATE INDEX IF NOT EXISTS idx_demo_booking_leads_status ON demo_booking_leads (status);

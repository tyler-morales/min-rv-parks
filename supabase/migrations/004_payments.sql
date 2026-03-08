-- Milestone 4: Payments — bookings, storage_contracts, Stripe session tracking

-- Enums for post-payment statuses
CREATE TYPE booking_status_enum AS ENUM ('CONFIRMED', 'CANCELLED', 'COMPLETED');
CREATE TYPE contract_status_enum AS ENUM ('ACTIVE', 'CANCELLED', 'ENDED');

-- Add Stripe session tracking to request tables
ALTER TABLE public.booking_requests
  ADD COLUMN stripe_session_id TEXT;

ALTER TABLE public.storage_requests
  ADD COLUMN stripe_session_id TEXT;

-- Bookings (stays, post-payment)
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_request_id UUID NOT NULL UNIQUE REFERENCES public.booking_requests(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  total_price_cents INTEGER NOT NULL,
  stripe_session_id TEXT NOT NULL,
  stripe_payment_intent_id TEXT,
  status booking_status_enum NOT NULL DEFAULT 'CONFIRMED',
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bookings_listing ON public.bookings(listing_id);
CREATE INDEX idx_bookings_request ON public.bookings(booking_request_id);
CREATE INDEX idx_bookings_email ON public.bookings(guest_email);

-- Storage contracts (post-payment)
CREATE TABLE public.storage_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_request_id UUID NOT NULL UNIQUE REFERENCES public.storage_requests(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  move_in_date DATE NOT NULL,
  monthly_price_cents INTEGER NOT NULL,
  deposit_cents INTEGER NOT NULL,
  stripe_session_id TEXT NOT NULL,
  stripe_payment_intent_id TEXT,
  status contract_status_enum NOT NULL DEFAULT 'ACTIVE',
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_storage_contracts_listing ON public.storage_contracts(listing_id);
CREATE INDEX idx_storage_contracts_request ON public.storage_contracts(storage_request_id);
CREATE INDEX idx_storage_contracts_email ON public.storage_contracts(guest_email);

-- RLS: bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts can read own bookings"
  ON public.bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id AND l.host_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can read bookings by email"
  ON public.bookings FOR SELECT
  USING (true);

-- Service role inserts via webhook; no user-facing insert policy needed

-- RLS: storage_contracts
ALTER TABLE public.storage_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts can read own storage contracts"
  ON public.storage_contracts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id AND l.host_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can read storage contracts by email"
  ON public.storage_contracts FOR SELECT
  USING (true);

-- updated_at triggers (reuses set_updated_at() from 001)
CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER storage_contracts_updated_at
  BEFORE UPDATE ON public.storage_contracts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS policy for service-role reads on request tables (cron needs to read all)
-- The admin client uses service_role key which bypasses RLS, so no extra policy needed.
-- However, we need anon/guest to read their own request by ID for the confirm page:
CREATE POLICY "Anyone can read booking requests by id"
  ON public.booking_requests FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read storage requests by id"
  ON public.storage_requests FOR SELECT
  USING (true);

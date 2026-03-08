-- Request status enum (shared by booking + storage requests)
CREATE TYPE request_status_enum AS ENUM (
  'REQUESTED', 'ACCEPTED', 'DECLINED', 'EXPIRED',
  'CANCELLED_BY_GUEST', 'CANCELLED_BY_HOST'
);

-- Booking requests (stays)
CREATE TABLE public.booking_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  message TEXT,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  total_price_cents INTEGER NOT NULL,
  status request_status_enum NOT NULL DEFAULT 'REQUESTED',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT booking_requests_dates_check CHECK (check_out > check_in)
);

CREATE INDEX idx_booking_requests_listing ON public.booking_requests(listing_id);
CREATE INDEX idx_booking_requests_status ON public.booking_requests(status);
CREATE INDEX idx_booking_requests_email ON public.booking_requests(guest_email);

-- Storage requests
CREATE TABLE public.storage_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  message TEXT,
  move_in_date DATE NOT NULL,
  months INTEGER NOT NULL DEFAULT 1,
  deposit_cents INTEGER NOT NULL,
  monthly_price_cents INTEGER NOT NULL,
  status request_status_enum NOT NULL DEFAULT 'REQUESTED',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_storage_requests_listing ON public.storage_requests(listing_id);
CREATE INDEX idx_storage_requests_status ON public.storage_requests(status);
CREATE INDEX idx_storage_requests_email ON public.storage_requests(guest_email);

-- RLS: booking_requests
ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;

-- Hosts can read requests for their own listings
CREATE POLICY "Hosts can read own booking requests"
  ON public.booking_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id AND l.host_id = auth.uid()
    )
  );

-- Hosts can update (accept/decline) requests for their own listings
CREATE POLICY "Hosts can update own booking requests"
  ON public.booking_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id AND l.host_id = auth.uid()
    )
  );

-- Anyone can insert a booking request (guests have no account)
CREATE POLICY "Anyone can create booking requests"
  ON public.booking_requests FOR INSERT
  WITH CHECK (true);

-- RLS: storage_requests
ALTER TABLE public.storage_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts can read own storage requests"
  ON public.storage_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id AND l.host_id = auth.uid()
    )
  );

CREATE POLICY "Hosts can update own storage requests"
  ON public.storage_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id AND l.host_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create storage requests"
  ON public.storage_requests FOR INSERT
  WITH CHECK (true);

-- updated_at triggers
CREATE TRIGGER booking_requests_updated_at
  BEFORE UPDATE ON public.booking_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER storage_requests_updated_at
  BEFORE UPDATE ON public.storage_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

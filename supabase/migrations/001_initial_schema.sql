-- Enums (match lib/types.ts)
CREATE TYPE listing_type_enum AS ENUM ('STAY', 'STORAGE');
CREATE TYPE listing_status_enum AS ENUM ('DRAFT', 'PENDING', 'LIVE', 'SUSPENDED');
CREATE TYPE electric_type_enum AS ENUM ('NONE', '15', '30', '50');
CREATE TYPE storage_type_enum AS ENUM ('OUTDOOR', 'COVERED', 'INDOOR');
CREATE TYPE access_type_enum AS ENUM ('24_7', 'DAYTIME_ONLY', 'SCHEDULED');
CREATE TYPE profile_role_enum AS ENUM ('host', 'admin');

-- Profiles (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  role profile_role_enum NOT NULL DEFAULT 'host',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Listings (unified STAY + STORAGE)
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_type listing_type_enum NOT NULL,
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status listing_status_enum NOT NULL DEFAULT 'DRAFT',
  verified BOOLEAN NOT NULL DEFAULT false,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  near_town TEXT NOT NULL,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  public_lat NUMERIC NOT NULL,
  public_lng NUMERIC NOT NULL,
  max_rig_length INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- STAY-only (nullable when listing_type = STORAGE)
  slide_outs_allowed BOOLEAN,
  pull_through BOOLEAN,
  electric electric_type_enum,
  water BOOLEAN,
  sewage BOOLEAN,
  gas BOOLEAN,
  nightly_price_cents INTEGER,
  min_stay_nights INTEGER,
  max_stay_nights INTEGER,
  blocked_dates JSONB DEFAULT '[]'::jsonb,
  -- STORAGE-only (nullable when listing_type = STAY)
  storage_type storage_type_enum,
  access access_type_enum,
  security_features TEXT[] DEFAULT '{}',
  power_available BOOLEAN,
  no_living_on_site BOOLEAN DEFAULT true,
  monthly_price_cents INTEGER,
  deposit_cents INTEGER,
  minimum_months INTEGER,
  is_available BOOLEAN DEFAULT true,
  CONSTRAINT listings_stay_check CHECK (
    listing_type != 'STAY' OR (
      slide_outs_allowed IS NOT NULL AND pull_through IS NOT NULL AND electric IS NOT NULL AND
      water IS NOT NULL AND sewage IS NOT NULL AND gas IS NOT NULL AND
      nightly_price_cents IS NOT NULL AND min_stay_nights IS NOT NULL AND max_stay_nights IS NOT NULL
    )
  ),
  CONSTRAINT listings_storage_check CHECK (
    listing_type != 'STORAGE' OR (
      storage_type IS NOT NULL AND access IS NOT NULL AND
      no_living_on_site IS NOT NULL AND monthly_price_cents IS NOT NULL AND
      deposit_cents IS NOT NULL AND minimum_months IS NOT NULL AND is_available IS NOT NULL
    )
  )
);

CREATE INDEX idx_listings_host_id ON public.listings(host_id);
CREATE INDEX idx_listings_status ON public.listings(status);
CREATE INDEX idx_listings_listing_type ON public.listings(listing_type);

-- Listing photos
CREATE TABLE public.listing_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_listing_photos_listing_id ON public.listing_photos(listing_id);

-- RLS: profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS: listings
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts can CRUD own listings"
  ON public.listings
  FOR ALL
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Anyone can read LIVE listings"
  ON public.listings FOR SELECT
  USING (status = 'LIVE');

-- RLS: listing_photos
ALTER TABLE public.listing_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts can manage photos for own listings"
  ON public.listing_photos
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.host_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.host_id = auth.uid())
  );

CREATE POLICY "Anyone can read photos for LIVE listings"
  ON public.listing_photos FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.status = 'LIVE')
  );

-- Trigger: create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    'host'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger for listings and profiles
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Haversine distance helper (returns miles)
CREATE OR REPLACE FUNCTION haversine_miles(
  lat1 NUMERIC, lng1 NUMERIC,
  lat2 NUMERIC, lng2 NUMERIC
) RETURNS NUMERIC AS $$
  SELECT 3958.8 * 2 * ASIN(SQRT(
    POWER(SIN(RADIANS(lat2 - lat1) / 2), 2) +
    COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
    POWER(SIN(RADIANS(lng2 - lng1) / 2), 2)
  ));
$$ LANGUAGE sql IMMUTABLE;

-- Search STAY listings within radius with date-availability + filter checks
CREATE OR REPLACE FUNCTION search_stays(
  p_lat NUMERIC,
  p_lng NUMERIC,
  p_radius_miles NUMERIC DEFAULT 25,
  p_check_in DATE DEFAULT NULL,
  p_check_out DATE DEFAULT NULL,
  p_electric BOOLEAN DEFAULT FALSE,
  p_water BOOLEAN DEFAULT FALSE,
  p_sewage BOOLEAN DEFAULT FALSE,
  p_gas BOOLEAN DEFAULT FALSE,
  p_pull_through BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  id UUID,
  listing_type listing_type_enum,
  host_id UUID,
  status listing_status_enum,
  verified BOOLEAN,
  title TEXT,
  description TEXT,
  near_town TEXT,
  lat NUMERIC,
  lng NUMERIC,
  public_lat NUMERIC,
  public_lng NUMERIC,
  max_rig_length INTEGER,
  created_at TIMESTAMPTZ,
  slide_outs_allowed BOOLEAN,
  pull_through BOOLEAN,
  electric electric_type_enum,
  water BOOLEAN,
  sewage BOOLEAN,
  gas BOOLEAN,
  nightly_price_cents INTEGER,
  min_stay_nights INTEGER,
  max_stay_nights INTEGER,
  blocked_dates JSONB,
  distance_miles NUMERIC,
  photos JSONB,
  host_name TEXT,
  host_avatar TEXT,
  host_email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id::uuid,
    l.listing_type::listing_type_enum,
    l.host_id::uuid,
    l.status::listing_status_enum,
    l.verified::boolean,
    l.title::text,
    l.description::text,
    l.near_town::text,
    l.lat::numeric,
    l.lng::numeric,
    l.public_lat::numeric,
    l.public_lng::numeric,
    l.max_rig_length::integer,
    l.created_at::timestamptz,
    l.slide_outs_allowed::boolean,
    l.pull_through::boolean,
    l.electric::electric_type_enum,
    l.water::boolean,
    l.sewage::boolean,
    l.gas::boolean,
    l.nightly_price_cents::integer,
    l.min_stay_nights::integer,
    l.max_stay_nights::integer,
    l.blocked_dates::jsonb,
    (haversine_miles(p_lat, p_lng, l.lat, l.lng))::numeric AS distance_miles,
    (COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('url', lp.url, 'position', lp.position) ORDER BY lp.position)
       FROM listing_photos lp WHERE lp.listing_id = l.id),
      '[]'::jsonb
    ))::jsonb AS photos,
    (p.full_name)::text AS host_name,
    (p.avatar_url)::text AS host_avatar,
    (u.email)::text AS host_email
  FROM listings l
  JOIN auth.users u ON u.id = l.host_id
  LEFT JOIN profiles p ON p.id = l.host_id
  WHERE l.listing_type = 'STAY'
    AND l.status = 'LIVE'
    AND haversine_miles(p_lat, p_lng, l.lat, l.lng) <= p_radius_miles
    AND (NOT p_electric OR l.electric != 'NONE')
    AND (NOT p_water OR l.water = TRUE)
    AND (NOT p_sewage OR l.sewage = TRUE)
    AND (NOT p_gas OR l.gas = TRUE)
    AND (NOT p_pull_through OR l.pull_through = TRUE)
    AND (
      p_check_in IS NULL OR p_check_out IS NULL
      OR NOT EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(l.blocked_dates) AS bd
        WHERE bd::date >= p_check_in AND bd::date < p_check_out
      )
    )
  ORDER BY distance_miles;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Search STORAGE listings within radius with filter checks
CREATE OR REPLACE FUNCTION search_storage(
  p_lat NUMERIC,
  p_lng NUMERIC,
  p_radius_miles NUMERIC DEFAULT 25,
  p_covered_indoor BOOLEAN DEFAULT FALSE,
  p_access_24_7 BOOLEAN DEFAULT FALSE,
  p_gated BOOLEAN DEFAULT FALSE,
  p_cameras BOOLEAN DEFAULT FALSE,
  p_power BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  id UUID,
  listing_type listing_type_enum,
  host_id UUID,
  status listing_status_enum,
  verified BOOLEAN,
  title TEXT,
  description TEXT,
  near_town TEXT,
  lat NUMERIC,
  lng NUMERIC,
  public_lat NUMERIC,
  public_lng NUMERIC,
  max_rig_length INTEGER,
  created_at TIMESTAMPTZ,
  storage_type storage_type_enum,
  access access_type_enum,
  security_features TEXT[],
  power_available BOOLEAN,
  no_living_on_site BOOLEAN,
  monthly_price_cents INTEGER,
  deposit_cents INTEGER,
  minimum_months INTEGER,
  is_available BOOLEAN,
  distance_miles NUMERIC,
  photos JSONB,
  host_name TEXT,
  host_avatar TEXT,
  host_email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id::uuid,
    l.listing_type::listing_type_enum,
    l.host_id::uuid,
    l.status::listing_status_enum,
    l.verified::boolean,
    l.title::text,
    l.description::text,
    l.near_town::text,
    l.lat::numeric,
    l.lng::numeric,
    l.public_lat::numeric,
    l.public_lng::numeric,
    l.max_rig_length::integer,
    l.created_at::timestamptz,
    l.storage_type::storage_type_enum,
    l.access::access_type_enum,
    l.security_features::text[],
    l.power_available::boolean,
    l.no_living_on_site::boolean,
    l.monthly_price_cents::integer,
    l.deposit_cents::integer,
    l.minimum_months::integer,
    l.is_available::boolean,
    (haversine_miles(p_lat, p_lng, l.lat, l.lng))::numeric AS distance_miles,
    (COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('url', lp.url, 'position', lp.position) ORDER BY lp.position)
       FROM listing_photos lp WHERE lp.listing_id = l.id),
      '[]'::jsonb
    ))::jsonb AS photos,
    (p.full_name)::text AS host_name,
    (p.avatar_url)::text AS host_avatar,
    (u.email)::text AS host_email
  FROM listings l
  JOIN auth.users u ON u.id = l.host_id
  LEFT JOIN profiles p ON p.id = l.host_id
  WHERE l.listing_type = 'STORAGE'
    AND l.status = 'LIVE'
    AND l.is_available = TRUE
    AND haversine_miles(p_lat, p_lng, l.lat, l.lng) <= p_radius_miles
    AND (NOT p_covered_indoor OR l.storage_type IN ('COVERED', 'INDOOR'))
    AND (NOT p_access_24_7 OR l.access = '24_7')
    AND (NOT p_gated OR 'GATED' = ANY(l.security_features))
    AND (NOT p_cameras OR 'CAMERAS' = ANY(l.security_features))
    AND (NOT p_power OR l.power_available = TRUE)
  ORDER BY distance_miles;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

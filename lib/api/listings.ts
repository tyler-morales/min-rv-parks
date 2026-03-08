/**
 * Map DB snake_case rows to frontend camelCase and vice versa.
 * Used by host and admin API routes.
 */

import type { StayListing, StorageListing, Host } from "@/lib/types";

interface DbListing {
  id: string;
  listing_type: "STAY" | "STORAGE";
  host_id: string;
  status: string;
  verified: boolean;
  title: string;
  description: string;
  near_town: string;
  lat: number;
  lng: number;
  public_lat: number;
  public_lng: number;
  max_rig_length: number;
  created_at: string;
  updated_at: string;
  slide_outs_allowed?: boolean | null;
  pull_through?: boolean | null;
  electric?: string | null;
  water?: boolean | null;
  sewage?: boolean | null;
  gas?: boolean | null;
  nightly_price_cents?: number | null;
  min_stay_nights?: number | null;
  max_stay_nights?: number | null;
  blocked_dates?: string[] | null;
  storage_type?: string | null;
  access?: string | null;
  security_features?: string[] | null;
  power_available?: boolean | null;
  no_living_on_site?: boolean | null;
  monthly_price_cents?: number | null;
  deposit_cents?: number | null;
  minimum_months?: number | null;
  is_available?: boolean | null;
  listing_photos?: { url: string; position: number }[] | null;
  host?: { full_name: string | null; avatar_url: string | null } | null;
}

interface HostProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email?: string;
}

export function dbListingToFrontend(
  row: DbListing,
  host: HostProfile,
  photos: string[] = []
): StayListing | StorageListing {
  const base = {
    id: row.id,
    listingType: row.listing_type,
    title: row.title,
    description: row.description,
    nearTown: row.near_town,
    lat: Number(row.lat),
    lng: Number(row.lng),
    publicLat: Number(row.public_lat),
    publicLng: Number(row.public_lng),
    maxRigLength: row.max_rig_length,
    status: row.status as StayListing["status"],
    verified: row.verified,
    hostId: row.host_id,
    host: {
      id: host.id,
      name: host.full_name ?? "Host",
      email: host.email ?? "",
      avatar: host.avatar_url ?? "",
      joinedDate: "",
      listingsCount: 0,
    } as Host,
    photos: photos.length
      ? photos
      : (row.listing_photos ?? [])
          .sort((a, b) => a.position - b.position)
          .map((p) => p.url),
    createdAt: row.created_at,
  };

  if (row.listing_type === "STAY") {
    return {
      ...base,
      listingType: "STAY",
      slideOutsAllowed: row.slide_outs_allowed ?? false,
      pullThrough: row.pull_through ?? false,
      electric: (row.electric as StayListing["electric"]) ?? "NONE",
      water: row.water ?? false,
      sewage: row.sewage ?? false,
      gas: row.gas ?? false,
      nightlyPriceCents: row.nightly_price_cents ?? 0,
      minStayNights: row.min_stay_nights ?? 1,
      maxStayNights: row.max_stay_nights ?? 30,
      blockedDates: Array.isArray(row.blocked_dates) ? row.blocked_dates : [],
    } as StayListing;
  }

  return {
    ...base,
    listingType: "STORAGE",
    storageType: (row.storage_type as StorageListing["storageType"]) ?? "OUTDOOR",
    access: (row.access as StorageListing["access"]) ?? "24_7",
    securityFeatures: (row.security_features as StorageListing["securityFeatures"]) ?? [],
    powerAvailable: row.power_available ?? false,
    noLivingOnSite: row.no_living_on_site ?? true,
    monthlyPriceCents: row.monthly_price_cents ?? 0,
    depositCents: row.deposit_cents ?? 0,
    minimumMonths: row.minimum_months ?? 1,
    isAvailable: row.is_available ?? true,
  } as StorageListing;
}

export function frontendToDbListing(body: Record<string, unknown>): Record<string, unknown> {
  const map: Record<string, string> = {
    listingType: "listing_type",
    nearTown: "near_town",
    lat: "lat",
    lng: "lng",
    publicLat: "public_lat",
    publicLng: "public_lng",
    maxRigLength: "max_rig_length",
    slideOutsAllowed: "slide_outs_allowed",
    pullThrough: "pull_through",
    nightlyPriceCents: "nightly_price_cents",
    minStayNights: "min_stay_nights",
    maxStayNights: "max_stay_nights",
    blockedDates: "blocked_dates",
    storageType: "storage_type",
    securityFeatures: "security_features",
    powerAvailable: "power_available",
    noLivingOnSite: "no_living_on_site",
    monthlyPriceCents: "monthly_price_cents",
    depositCents: "deposit_cents",
    minimumMonths: "minimum_months",
    isAvailable: "is_available",
  };
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (k === "host" || k === "photos" || k === "hostId" || k === "createdAt") continue;
    const dbKey = map[k] ?? k;
    out[dbKey] = v;
  }
  return out;
}

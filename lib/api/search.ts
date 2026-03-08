/**
 * Transform RPC search results (snake_case, photos as JSONB)
 * into frontend camelCase StayListing / StorageListing shapes.
 */

import type { StayListing, StorageListing, Host } from "@/lib/types";

interface RpcHost {
  host_id: string;
  host_name: string | null;
  host_avatar: string | null;
  host_email: string;
}

function buildHost(row: RpcHost): Host {
  return {
    id: row.host_id,
    name: row.host_name ?? "Host",
    email: row.host_email ?? "",
    avatar: row.host_avatar ?? "",
    joinedDate: "",
    listingsCount: 0,
  };
}

function parsePhotos(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return (raw as { url: string; position: number }[])
    .sort((a, b) => a.position - b.position)
    .map((p) => p.url);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rpcRowToStay(row: any): StayListing {
  return {
    id: row.id,
    listingType: "STAY",
    title: row.title,
    description: row.description,
    nearTown: row.near_town,
    lat: Number(row.lat),
    lng: Number(row.lng),
    publicLat: Number(row.public_lat),
    publicLng: Number(row.public_lng),
    maxRigLength: row.max_rig_length,
    status: row.status,
    verified: row.verified,
    hostId: row.host_id,
    host: buildHost(row),
    photos: parsePhotos(row.photos),
    createdAt: row.created_at,
    slideOutsAllowed: row.slide_outs_allowed ?? false,
    pullThrough: row.pull_through ?? false,
    electric: row.electric ?? "NONE",
    water: row.water ?? false,
    sewage: row.sewage ?? false,
    gas: row.gas ?? false,
    nightlyPriceCents: row.nightly_price_cents ?? 0,
    minStayNights: row.min_stay_nights ?? 1,
    maxStayNights: row.max_stay_nights ?? 30,
    blockedDates: Array.isArray(row.blocked_dates) ? row.blocked_dates : [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rpcRowToStorage(row: any): StorageListing {
  return {
    id: row.id,
    listingType: "STORAGE",
    title: row.title,
    description: row.description,
    nearTown: row.near_town,
    lat: Number(row.lat),
    lng: Number(row.lng),
    publicLat: Number(row.public_lat),
    publicLng: Number(row.public_lng),
    maxRigLength: row.max_rig_length,
    status: row.status,
    verified: row.verified,
    hostId: row.host_id,
    host: buildHost(row),
    photos: parsePhotos(row.photos),
    createdAt: row.created_at,
    storageType: row.storage_type ?? "OUTDOOR",
    access: row.access ?? "24_7",
    securityFeatures: row.security_features ?? [],
    powerAvailable: row.power_available ?? false,
    noLivingOnSite: row.no_living_on_site ?? true,
    monthlyPriceCents: row.monthly_price_cents ?? 0,
    depositCents: row.deposit_cents ?? 0,
    minimumMonths: row.minimum_months ?? 1,
    isAvailable: row.is_available ?? true,
  };
}

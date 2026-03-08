import { createClient } from "@/lib/supabase/server";
import { dbListingToFrontend, frontendToDbListing } from "@/lib/api/listings";
import { genericServerError } from "@/lib/api-error";
import { createListingSchema, parseAndValidate } from "@/lib/validations/api";
import { NextResponse } from "next/server";

const MAX_BODY_BYTES = 128 * 1024;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: rows, error } = await supabase
    .from("listings")
    .select("*, listing_photos(url, position)")
    .eq("host_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return genericServerError("host/listings GET", error.message);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single();

  const host = {
    id: user.id,
    full_name: profile?.full_name ?? null,
    avatar_url: profile?.avatar_url ?? null,
    email: user.email ?? "",
  };

  const listings = (rows ?? []).map((row) =>
    dbListingToFrontend(
      row as unknown as Parameters<typeof dbListingToFrontend>[0],
      host
    )
  );

  return NextResponse.json(listings);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request too large" }, { status: 400 });
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseAndValidate(body, createListingSchema);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.errorMessage }, { status: 400 });
  }
  const listingType = parsed.data.listingType;

  const dbPayload = frontendToDbListing(body) as Record<string, unknown>;
  dbPayload.host_id = user.id;
  dbPayload.status = "DRAFT";
  dbPayload.listing_type = listingType;

  const lat = Number(body.lat);
  const lng = Number(body.lng);
  if (Number.isNaN(lat) || Number.isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json(
      { error: "Valid location required. Search for a city or place and select it from the list." },
      { status: 400 }
    );
  }
  dbPayload.lat = lat;
  dbPayload.lng = lng;
  if (dbPayload.public_lat == null || dbPayload.public_lng == null) {
    const jitter = () => (Math.random() - 0.5) * 0.04;
    dbPayload.public_lat = lat + jitter();
    dbPayload.public_lng = lng + jitter();
  }

  if (listingType === "STAY") {
    dbPayload.blocked_dates = Array.isArray(body.blockedDates) ? body.blockedDates : [];
  }
  if (listingType === "STORAGE") {
    dbPayload.is_available = body.isAvailable !== false;
  }

  const { data, error } = await supabase
    .from("listings")
    .insert(dbPayload)
    .select("id")
    .single();

  if (error) {
    return genericServerError("host/listings POST", error.message);
  }

  return NextResponse.json({ id: data.id });
}

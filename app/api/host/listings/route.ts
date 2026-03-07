import { createClient } from "@/lib/supabase/server";
import { dbListingToFrontend, frontendToDbListing } from "@/lib/api/listings";
import { NextResponse } from "next/server";

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
    return NextResponse.json({ error: error.message }, { status: 500 });
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
      row as Parameters<typeof dbListingToFrontend>[0],
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

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const listingType = body.listingType as "STAY" | "STORAGE";
  if (!listingType || !["STAY", "STORAGE"].includes(listingType)) {
    return NextResponse.json({ error: "listingType must be STAY or STORAGE" }, { status: 400 });
  }

  const dbPayload = frontendToDbListing(body) as Record<string, unknown>;
  dbPayload.host_id = user.id;
  dbPayload.status = "DRAFT";
  dbPayload.listing_type = listingType;
  if (dbPayload.lat == null) {
    dbPayload.lat = 0;
    dbPayload.lng = 0;
    dbPayload.public_lat = 0;
    dbPayload.public_lng = 0;
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}

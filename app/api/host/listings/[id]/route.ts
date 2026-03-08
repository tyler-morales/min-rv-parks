import { createClient } from "@/lib/supabase/server";
import { dbListingToFrontend, frontendToDbListing } from "@/lib/api/listings";
import { genericServerError } from "@/lib/api-error";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: row, error } = await supabase
    .from("listings")
    .select("*, listing_photos(id, url, position)")
    .eq("id", id)
    .eq("host_id", user.id)
    .single();

  if (error || !row) {
    if (error?.code === "PGRST116") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (error) return genericServerError("host/listings/[id] GET", error.message);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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

  const listing = dbListingToFrontend(
    row as unknown as Parameters<typeof dbListingToFrontend>[0],
    host
  );
  const photoIds = (row.listing_photos ?? [])
    .sort((a: { position: number }, b: { position: number }) => a.position - b.position)
    .map((p: { id: string }) => p.id);
  return NextResponse.json({ ...listing, photoIds });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  const dbPayload = frontendToDbListing(body) as Record<string, unknown>;
  delete dbPayload.host_id;
  delete dbPayload.status;
  delete dbPayload.id;
  delete dbPayload.created_at;

  if (body.lat != null && body.lng != null) {
    const lat = Number(body.lat);
    const lng = Number(body.lng);
    if (
      Number.isNaN(lat) ||
      Number.isNaN(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180 ||
      (lat === 0 && lng === 0)
    ) {
      return NextResponse.json(
        {
          error:
            "Valid location required. Search for a city or place and select it from the list so guests can find your listing.",
        },
        { status: 400 }
      );
    }
    dbPayload.lat = lat;
    dbPayload.lng = lng;
    const jitter = () => (Math.random() - 0.5) * 0.04;
    dbPayload.public_lat = lat + jitter();
    dbPayload.public_lng = lng + jitter();
  }

  const { error } = await supabase
    .from("listings")
    .update(dbPayload)
    .eq("id", id)
    .eq("host_id", user.id);

  if (error) {
    return genericServerError("host/listings/[id] DELETE", error.message);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("listings")
    .delete()
    .eq("id", id)
    .eq("host_id", user.id);

  if (error) {
    return genericServerError("host/listings/[id] DELETE", error.message);
  }

  return NextResponse.json({ ok: true });
}

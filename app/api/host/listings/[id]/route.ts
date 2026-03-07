import { createClient } from "@/lib/supabase/server";
import { dbListingToFrontend, frontendToDbListing } from "@/lib/api/listings";
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
    .select("*, listing_photos(url, position)")
    .eq("id", id)
    .eq("host_id", user.id)
    .single();

  if (error || !row) {
    return NextResponse.json(
      { error: error?.message ?? "Not found" },
      { status: error?.code === "PGRST116" ? 404 : 500 }
    );
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
    row as Parameters<typeof dbListingToFrontend>[0],
    host
  );

  return NextResponse.json(listing);
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

  const { error } = await supabase
    .from("listings")
    .update(dbPayload)
    .eq("id", id)
    .eq("host_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

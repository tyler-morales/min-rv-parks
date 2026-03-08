import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dbListingToFrontend } from "@/lib/api/listings";
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("listings")
    .select("*, listing_photos(url, position)")
    .eq("id", id)
    .single();

  if (error || !row) {
    if (error?.code === "PGRST116") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (error) return genericServerError("admin/listings/[id] GET", error.message);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: hostProfile } = await admin
    .from("profiles")
    .select("id, full_name, avatar_url")
    .eq("id", row.host_id)
    .single();

  const host = {
    id: row.host_id,
    full_name: hostProfile?.full_name ?? null,
    avatar_url: hostProfile?.avatar_url ?? null,
    email: "",
  };

  const listing = dbListingToFrontend(
    row as Parameters<typeof dbListingToFrontend>[0],
    host
  );

  return NextResponse.json(listing);
}

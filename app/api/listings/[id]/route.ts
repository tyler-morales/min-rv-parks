import { createAdminClient } from "@/lib/supabase/admin";
import { dbListingToFrontend } from "@/lib/api/listings";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: row, error } = await supabase
    .from("listings")
    .select("*, listing_photos(url, position)")
    .eq("id", id)
    .eq("status", "LIVE")
    .single();

  if (error || !row) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", row.host_id)
    .single();

  const { data: userData } = await supabase.auth.admin.getUserById(row.host_id);

  const host = {
    id: row.host_id as string,
    full_name: profile?.full_name ?? null,
    avatar_url: profile?.avatar_url ?? null,
    email: userData?.user?.email ?? "",
  };

  const listing = dbListingToFrontend(
    row as unknown as Parameters<typeof dbListingToFrontend>[0],
    host,
  );

  return NextResponse.json(listing);
}

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Dev-only: list LIVE STAY listings with id, lat, lng, near_town.
 * Use to verify listings have correct coordinates for search.
 * e.g. GET /api/debug/stays-listings
 */
export async function GET(_request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("listings")
    .select("id, status, lat, lng, near_town, title")
    .eq("listing_type", "STAY");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const live = (data ?? []).filter((r) => r.status === "LIVE");
  return NextResponse.json({
    total: data?.length ?? 0,
    liveCount: live.length,
    liveListings: live.map((r) => ({
      id: r.id,
      status: r.status,
      lat: r.lat,
      lng: r.lng,
      near_town: r.near_town,
      title: r.title,
    })),
  });
}

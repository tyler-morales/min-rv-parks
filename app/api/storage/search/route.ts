import { createAdminClient } from "@/lib/supabase/admin";
import { rpcRowToStorage } from "@/lib/api/search";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const lat = parseFloat(sp.get("lat") ?? "");
  const lng = parseFloat(sp.get("lng") ?? "");

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json(
      { error: "lat and lng are required numeric params" },
      { status: 400 },
    );
  }

  const radius = parseFloat(sp.get("radius") ?? "25");

  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("search_storage", {
    p_lat: lat,
    p_lng: lng,
    p_radius_miles: radius,
    p_covered_indoor: sp.get("coveredIndoor") === "true",
    p_access_24_7: sp.get("access247") === "true",
    p_gated: sp.get("gated") === "true",
    p_cameras: sp.get("cameras") === "true",
    p_power: sp.get("power") === "true",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const listings = (data ?? []).map(rpcRowToStorage);
  return NextResponse.json(listings);
}

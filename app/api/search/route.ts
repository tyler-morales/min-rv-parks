import { createAdminClient } from "@/lib/supabase/admin";
import { rpcRowToStay } from "@/lib/api/search";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
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
    const checkInRaw = sp.get("checkIn");
    const checkOutRaw = sp.get("checkOut");
    const checkIn = checkInRaw?.trim() ? checkInRaw.trim() : null;
    const checkOut = checkOutRaw?.trim() ? checkOutRaw.trim() : null;

    const supabase = createAdminClient();

    const { data, error } = await supabase.rpc("search_stays", {
      p_lat: Number(lat),
      p_lng: Number(lng),
      p_radius_miles: Number(radius),
      p_check_in: checkIn,
      p_check_out: checkOut,
      p_electric: sp.get("electric") === "true",
      p_water: sp.get("water") === "true",
      p_sewage: sp.get("sewage") === "true",
      p_gas: sp.get("gas") === "true",
      p_pull_through: sp.get("pullThrough") === "true",
    });

    if (error) {
      return NextResponse.json(
        { error: "Search failed", details: error.message },
        { status: 500 },
      );
    }

    const listings = (data ?? []).map(rpcRowToStay);
    return NextResponse.json(listings);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const stack = err instanceof Error ? err.stack : undefined;
    return NextResponse.json(
      {
        error: "Search failed",
        details: message,
        ...(process.env.NODE_ENV === "development" && stack && { stack }),
      },
      { status: 500 },
    );
  }
}

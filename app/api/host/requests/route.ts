import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all listings owned by this host (need IDs for filtering)
  const { data: listings } = await supabase
    .from("listings")
    .select("id, title, listing_type")
    .eq("host_id", user.id);

  const listingIds = (listings ?? []).map((l) => l.id);
  const listingMap = Object.fromEntries(
    (listings ?? []).map((l) => [l.id, { title: l.title, listing_type: l.listing_type }]),
  );

  if (listingIds.length === 0) {
    return NextResponse.json({ bookingRequests: [], storageRequests: [] });
  }

  const [bookingRes, storageRes] = await Promise.all([
    supabase
      .from("booking_requests")
      .select("*")
      .in("listing_id", listingIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("storage_requests")
      .select("*")
      .in("listing_id", listingIds)
      .order("created_at", { ascending: false }),
  ]);

  const bookingRequests = (bookingRes.data ?? []).map((r) => ({
    ...r,
    listing_title: listingMap[r.listing_id]?.title ?? "",
  }));

  const storageRequests = (storageRes.data ?? []).map((r) => ({
    ...r,
    listing_title: listingMap[r.listing_id]?.title ?? "",
  }));

  return NextResponse.json({ bookingRequests, storageRequests });
}

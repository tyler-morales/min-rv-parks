import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const MIN_PHOTOS = 5;

export async function POST(
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

  const { data: listing, error: fetchError } = await supabase
    .from("listings")
    .select("id, status")
    .eq("id", id)
    .eq("host_id", user.id)
    .single();

  if (fetchError || !listing) {
    return NextResponse.json(
      { error: fetchError?.message ?? "Not found" },
      { status: fetchError?.code === "PGRST116" ? 404 : 500 }
    );
  }

  if (listing.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Only DRAFT listings can be submitted" },
      { status: 400 }
    );
  }

  const { count, error: countError } = await supabase
    .from("listing_photos")
    .select("id", { count: "exact", head: true })
    .eq("listing_id", id);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  if ((count ?? 0) < MIN_PHOTOS) {
    return NextResponse.json(
      { error: `At least ${MIN_PHOTOS} photos required` },
      { status: 400 }
    );
  }

  const { error: updateError } = await supabase
    .from("listings")
    .update({ status: "PENDING" })
    .eq("id", id)
    .eq("host_id", user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

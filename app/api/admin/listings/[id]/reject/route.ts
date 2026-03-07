import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: listing } = await admin
    .from("listings")
    .select("status")
    .eq("id", id)
    .single();

  if (!listing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (listing.status !== "PENDING") {
    return NextResponse.json(
      { error: "Only PENDING listings can be rejected" },
      { status: 400 }
    );
  }

  const { error } = await admin
    .from("listings")
    .update({ status: "SUSPENDED" })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { genericServerError } from "@/lib/api-error";
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

  if (listing.status !== "LIVE") {
    return NextResponse.json(
      { error: "Only LIVE listings can be suspended" },
      { status: 400 }
    );
  }

  const { error } = await admin
    .from("listings")
    .update({ status: "SUSPENDED" })
    .eq("id", id);

  if (error) {
    return genericServerError("admin/listings/[id]/suspend", error.message);
  }

  return NextResponse.json({ ok: true });
}

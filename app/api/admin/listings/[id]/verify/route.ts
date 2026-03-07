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
  const { data: listing, error: fetchError } = await admin
    .from("listings")
    .select("verified")
    .eq("id", id)
    .single();

  if (fetchError || !listing) {
    return NextResponse.json(
      { error: fetchError?.message ?? "Not found" },
      { status: fetchError?.code === "PGRST116" ? 404 : 500 }
    );
  }

  const { error } = await admin
    .from("listings")
    .update({ verified: !listing.verified })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, verified: !listing.verified });
}

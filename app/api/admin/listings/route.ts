import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dbListingToFrontend } from "@/lib/api/listings";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;

  const admin = createAdminClient();
  let query = admin
    .from("listings")
    .select("*, listing_photos(url, position)")
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data: rows, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const hostIds = [...new Set((rows ?? []).map((r: { host_id: string }) => r.host_id))];
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", hostIds);

  const profileMap = new Map(
    (profiles ?? []).map((p: { id: string; full_name: string | null; avatar_url: string | null }) => [
      p.id,
      { id: p.id, full_name: p.full_name, avatar_url: p.avatar_url, email: "" },
    ])
  );

  const listings = (rows ?? []).map((row: Record<string, unknown>) => {
    const host = profileMap.get(row.host_id as string) ?? {
      id: row.host_id,
      full_name: null,
      avatar_url: null,
      email: "",
    };
    return dbListingToFrontend(
      row as Parameters<typeof dbListingToFrontend>[0],
      host
    );
  });

  return NextResponse.json(listings);
}

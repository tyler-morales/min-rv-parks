import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("storage_requests")
    .select("*, listings(title, near_town, monthly_price_cents, deposit_cents)")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

import { createClient } from "@/lib/supabase/server";
import { sendRequestAccepted } from "@/lib/email";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch request + verify host ownership
  const { data: req, error: fetchErr } = await supabase
    .from("booking_requests")
    .select("*, listings(title, host_id)")
    .eq("id", id)
    .single();

  if (fetchErr || !req) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }
  if (req.listings?.host_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (req.status !== "REQUESTED") {
    return NextResponse.json(
      { error: `Cannot accept a request with status ${req.status}` },
      { status: 400 },
    );
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { error: updateErr } = await supabase
    .from("booking_requests")
    .update({ status: "ACCEPTED", expires_at: expiresAt })
    .eq("id", id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  const emailSent = await sendRequestAccepted({
    guestEmail: req.guest_email,
    guestName: req.guest_name,
    listingTitle: req.listings?.title ?? "",
    listingId: req.listing_id,
    requestId: id,
    kind: "STAY",
    expiresAt,
  }).catch(() => false);

  return NextResponse.json({ status: "ACCEPTED", expiresAt, emailSent });
}

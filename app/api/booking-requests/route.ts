import { createAdminClient } from "@/lib/supabase/admin";
import { sendStayRequestToHost, sendStayRequestToGuest } from "@/lib/email";
import { genericServerError } from "@/lib/api-error";
import { bookingRequestSchema, parseAndValidate } from "@/lib/validations/api";
import { NextResponse } from "next/server";

const MAX_BODY_BYTES = 64 * 1024;

export async function POST(request: Request) {
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request too large" }, { status: 400 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseAndValidate(body, bookingRequestSchema);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.errorMessage }, { status: 400 });
  }
  const { listingId, guestName, guestEmail, guestPhone, message, checkIn, checkOut } = parsed.data;

  const supabase = createAdminClient();

  // Beta gate: only approved guests can submit requests
  const { data: approval } = await supabase
    .from("beta_applications")
    .select("status")
    .eq("email", guestEmail)
    .eq("status", "APPROVED")
    .maybeSingle();

  if (!approval) {
    return NextResponse.json(
      { error: "You must be beta-approved to submit a request. Apply at /apply." },
      { status: 403 },
    );
  }

  const { data: listing, error: listingErr } = await supabase
    .from("listings")
    .select("id, listing_type, title, nightly_price_cents, host_id, status")
    .eq("id", listingId)
    .single();

  if (listingErr || !listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  if (listing.listing_type !== "STAY") {
    return NextResponse.json({ error: "Listing is not a STAY type" }, { status: 400 });
  }
  if (listing.status !== "LIVE") {
    return NextResponse.json({ error: "Listing is not currently live" }, { status: 400 });
  }

  const nights = Math.max(
    0,
    Math.round(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000,
    ),
  );
  if (nights <= 0) {
    return NextResponse.json({ error: "checkOut must be after checkIn" }, { status: 400 });
  }

  const totalPriceCents = nights * (listing.nightly_price_cents ?? 0);

  const { data: req, error: insertErr } = await supabase
    .from("booking_requests")
    .insert({
      listing_id: listingId,
      guest_name: guestName,
      guest_email: guestEmail,
      guest_phone: guestPhone,
      message: message || null,
      check_in: checkIn,
      check_out: checkOut,
      total_price_cents: totalPriceCents,
      status: "REQUESTED",
    })
    .select("id, status, created_at")
    .single();

  if (insertErr) {
    return genericServerError("booking-requests", insertErr.message);
  }

  // Fetch host info for email
  const { data: host } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", listing.host_id)
    .single();
  const { data: hostAuth } = await supabase.auth.admin.getUserById(listing.host_id);

  const hostEmail = hostAuth?.user?.email;
  if (hostEmail) {
    sendStayRequestToHost({
      hostEmail,
      hostName: host?.full_name ?? "Host",
      guestName,
      guestEmail,
      guestPhone,
      listingTitle: listing.title,
      checkIn,
      checkOut,
      totalPriceCents,
      message: message ?? undefined,
    }).catch(console.error);
  }

  sendStayRequestToGuest({
    guestEmail,
    guestName,
    listingTitle: listing.title,
    checkIn,
    checkOut,
    totalPriceCents,
  }).catch(console.error);

  return NextResponse.json({ id: req.id, status: req.status, totalPriceCents });
}

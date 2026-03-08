import { createAdminClient } from "@/lib/supabase/admin";
import { sendStorageRequestToHost, sendStorageRequestToGuest } from "@/lib/email";
import { genericServerError } from "@/lib/api-error";
import { parseAndValidate, storageRequestSchema } from "@/lib/validations/api";
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

  const parsed = parseAndValidate(body, storageRequestSchema);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.errorMessage }, { status: 400 });
  }
  const {
    listingId,
    guestName,
    guestEmail,
    guestPhone,
    message,
    moveInDate,
    months,
  } = parsed.data;

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
    .select(
      "id, listing_type, title, monthly_price_cents, deposit_cents, minimum_months, host_id, status, is_available",
    )
    .eq("id", listingId)
    .single();

  if (listingErr || !listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  if (listing.listing_type !== "STORAGE") {
    return NextResponse.json({ error: "Listing is not a STORAGE type" }, { status: 400 });
  }
  if (listing.status !== "LIVE") {
    return NextResponse.json({ error: "Listing is not currently live" }, { status: 400 });
  }
  if (!listing.is_available) {
    return NextResponse.json({ error: "Storage slot is not available" }, { status: 400 });
  }

  const resolvedMonths = Math.max(months ?? 1, listing.minimum_months ?? 1);
  const depositCents = listing.deposit_cents ?? 5000;
  const monthlyPriceCents = listing.monthly_price_cents ?? 0;

  const { data: req, error: insertErr } = await supabase
    .from("storage_requests")
    .insert({
      listing_id: listingId,
      guest_name: guestName,
      guest_email: guestEmail,
      guest_phone: guestPhone,
      message: message || null,
      move_in_date: moveInDate,
      months: resolvedMonths,
      deposit_cents: depositCents,
      monthly_price_cents: monthlyPriceCents,
      status: "REQUESTED",
    })
    .select("id, status, created_at")
    .single();

  if (insertErr) {
    return genericServerError("storage-requests", insertErr.message);
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
    sendStorageRequestToHost({
      hostEmail,
      hostName: host?.full_name ?? "Host",
      guestName,
      guestEmail,
      guestPhone,
      listingTitle: listing.title,
      moveInDate,
      months: resolvedMonths,
      monthlyPriceCents,
      depositCents,
      message: message ?? undefined,
    }).catch(console.error);
  }

  sendStorageRequestToGuest({
    guestEmail,
    guestName,
    listingTitle: listing.title,
    moveInDate,
    months: resolvedMonths,
    monthlyPriceCents,
    depositCents,
  }).catch(console.error);

  return NextResponse.json({
    id: req.id,
    status: req.status,
    depositCents,
    monthlyPriceCents,
  });
}

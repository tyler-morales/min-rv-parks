import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBookingConfirmed, sendStorageContractActive } from "@/lib/email";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

interface RequestWithListing {
  id: string;
  listing_id: string;
  guest_name: string;
  guest_email: string;
  check_in?: string;
  check_out?: string;
  total_price_cents?: number;
  move_in_date?: string;
  monthly_price_cents?: number;
  deposit_cents?: number;
  status: string;
  listings: {
    title: string;
    host_id: string;
    profiles: { email: string; full_name: string } | null;
  } | null;
}

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[stripe webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { requestId, type, listingId } = session.metadata ?? {};

    if (!requestId || !type || !listingId) {
      console.error("[stripe webhook] missing metadata on session", session.id);
      return NextResponse.json({ received: true });
    }

    const supabase = createAdminClient();

    if (type === "STAY") {
      await handleStayPayment(supabase, session, requestId, listingId);
    } else if (type === "STORAGE") {
      await handleStoragePayment(supabase, session, requestId, listingId);
    }
  }

  return NextResponse.json({ received: true });
}

async function handleStayPayment(
  supabase: ReturnType<typeof createAdminClient>,
  session: Stripe.Checkout.Session,
  requestId: string,
  listingId: string,
) {
  const { data: raw } = await supabase
    .from("booking_requests")
    .select("*, listings(title, host_id, profiles:host_id(email, full_name))")
    .eq("id", requestId)
    .single();

  const req = raw as unknown as RequestWithListing | null;
  if (!req) {
    console.error("[stripe webhook] booking request not found:", requestId);
    return;
  }

  const { data: existing } = await supabase
    .from("bookings")
    .select("id")
    .eq("booking_request_id", requestId)
    .single();

  if (existing) return;

  const { error } = await supabase.from("bookings").insert({
    booking_request_id: requestId,
    listing_id: listingId,
    guest_name: req.guest_name,
    guest_email: req.guest_email,
    check_in: req.check_in,
    check_out: req.check_out,
    total_price_cents: req.total_price_cents,
    stripe_session_id: session.id,
    stripe_payment_intent_id:
      typeof session.payment_intent === "string" ? session.payment_intent : null,
    status: "CONFIRMED",
    paid_at: new Date().toISOString(),
  });

  if (error) {
    console.error("[stripe webhook] failed to create booking:", error);
    return;
  }

  const host = req.listings?.profiles;
  await sendBookingConfirmed({
    guestEmail: req.guest_email,
    guestName: req.guest_name,
    hostEmail: host?.email ?? "",
    hostName: host?.full_name ?? "Host",
    listingTitle: req.listings?.title ?? "",
    checkIn: req.check_in ?? "",
    checkOut: req.check_out ?? "",
    totalPriceCents: req.total_price_cents ?? 0,
  }).catch((e) => console.error("[stripe webhook] email error:", e));
}

async function handleStoragePayment(
  supabase: ReturnType<typeof createAdminClient>,
  session: Stripe.Checkout.Session,
  requestId: string,
  listingId: string,
) {
  const { data: raw } = await supabase
    .from("storage_requests")
    .select("*, listings(title, host_id, profiles:host_id(email, full_name))")
    .eq("id", requestId)
    .single();

  const req = raw as unknown as RequestWithListing | null;
  if (!req) {
    console.error("[stripe webhook] storage request not found:", requestId);
    return;
  }

  const { data: existing } = await supabase
    .from("storage_contracts")
    .select("id")
    .eq("storage_request_id", requestId)
    .single();

  if (existing) return;

  const { error } = await supabase.from("storage_contracts").insert({
    storage_request_id: requestId,
    listing_id: listingId,
    guest_name: req.guest_name,
    guest_email: req.guest_email,
    move_in_date: req.move_in_date,
    monthly_price_cents: req.monthly_price_cents,
    deposit_cents: req.deposit_cents,
    stripe_session_id: session.id,
    stripe_payment_intent_id:
      typeof session.payment_intent === "string" ? session.payment_intent : null,
    status: "ACTIVE",
    paid_at: new Date().toISOString(),
  });

  if (error) {
    console.error("[stripe webhook] failed to create storage contract:", error);
    return;
  }

  await supabase
    .from("listings")
    .update({ is_available: false })
    .eq("id", listingId);

  const host = req.listings?.profiles;
  await sendStorageContractActive({
    guestEmail: req.guest_email,
    guestName: req.guest_name,
    hostEmail: host?.email ?? "",
    hostName: host?.full_name ?? "Host",
    listingTitle: req.listings?.title ?? "",
    moveInDate: req.move_in_date ?? "",
    monthlyPriceCents: req.monthly_price_cents ?? 0,
    depositCents: req.deposit_cents ?? 0,
  }).catch((e) => console.error("[stripe webhook] email error:", e));
}

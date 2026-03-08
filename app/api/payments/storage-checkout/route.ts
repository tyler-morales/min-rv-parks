import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function POST(request: Request) {
  const { requestId } = await request.json();
  if (!requestId) {
    return NextResponse.json({ error: "requestId is required" }, { status: 400 });
  }

  if (!stripe) {
    return NextResponse.json(
      { error: "Payments are not configured for this environment." },
      { status: 503 },
    );
  }

  const supabase = createAdminClient();

  const { data: req, error } = await supabase
    .from("storage_requests")
    .select("*, listings(title)")
    .eq("id", requestId)
    .single();

  if (error || !req) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (req.status !== "ACCEPTED") {
    return NextResponse.json(
      { error: `Request status is ${req.status}, expected ACCEPTED` },
      { status: 400 },
    );
  }

  if (req.expires_at && new Date(req.expires_at) < new Date()) {
    return NextResponse.json({ error: "Request has expired" }, { status: 400 });
  }

  if (req.stripe_session_id) {
    const existing = await stripe.checkout.sessions.retrieve(req.stripe_session_id);
    if (existing.status === "open") {
      return NextResponse.json({ url: existing.url });
    }
  }

  const listingTitle = req.listings?.title ?? "RV Storage";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: `${listingTitle} — Security Deposit` },
          unit_amount: req.deposit_cents,
        },
        quantity: 1,
      },
      {
        price_data: {
          currency: "usd",
          product_data: { name: `${listingTitle} — First Month's Rent` },
          unit_amount: req.monthly_price_cents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      requestId,
      type: "STORAGE",
      listingId: req.listing_id,
    },
    success_url: `${APP_URL}/store/${req.listing_id}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/store/${req.listing_id}/confirm?requestId=${requestId}`,
    expires_at: Math.min(
      Math.floor(new Date(req.expires_at).getTime() / 1000),
      Math.floor(Date.now() / 1000) + 86400,
    ),
  });

  await supabase
    .from("storage_requests")
    .update({ stripe_session_id: session.id })
    .eq("id", requestId);

  return NextResponse.json({ url: session.url });
}

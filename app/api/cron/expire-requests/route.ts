import { createAdminClient } from "@/lib/supabase/admin";
import { sendRequestExpired } from "@/lib/email";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const bookingResult = await expireBookingRequests(supabase, now);
  const storageResult = await expireStorageRequests(supabase, now);

  return NextResponse.json({
    expiredBookings: bookingResult,
    expiredStorage: storageResult,
    timestamp: now,
  });
}

interface ExpirableRequest {
  id: string;
  guest_name: string;
  guest_email: string;
  listings: {
    title: string;
    host_id: string;
    profiles: { email: string; full_name: string } | null;
  } | null;
}

async function expireBookingRequests(
  supabase: ReturnType<typeof createAdminClient>,
  now: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("booking_requests")
    .select("id, guest_name, guest_email, listings(title, host_id, profiles:host_id(email, full_name))")
    .eq("status", "ACCEPTED")
    .lt("expires_at", now);

  if (error || !data?.length) return 0;

  const requests = data as unknown as ExpirableRequest[];
  const ids = requests.map((r) => r.id);

  await supabase
    .from("booking_requests")
    .update({ status: "EXPIRED" })
    .in("id", ids);

  for (const req of requests) {
    const host = req.listings?.profiles;
    await sendRequestExpired({
      guestEmail: req.guest_email,
      guestName: req.guest_name,
      hostEmail: host?.email ?? "",
      hostName: host?.full_name ?? "Host",
      listingTitle: req.listings?.title ?? "",
      kind: "STAY",
    }).catch((e) => console.error("[cron] expiry email error:", e));
  }

  return ids.length;
}

async function expireStorageRequests(
  supabase: ReturnType<typeof createAdminClient>,
  now: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("storage_requests")
    .select("id, guest_name, guest_email, listings(title, host_id, profiles:host_id(email, full_name))")
    .eq("status", "ACCEPTED")
    .lt("expires_at", now);

  if (error || !data?.length) return 0;

  const requests = data as unknown as ExpirableRequest[];
  const ids = requests.map((r) => r.id);

  await supabase
    .from("storage_requests")
    .update({ status: "EXPIRED" })
    .in("id", ids);

  for (const req of requests) {
    const host = req.listings?.profiles;
    await sendRequestExpired({
      guestEmail: req.guest_email,
      guestName: req.guest_name,
      hostEmail: host?.email ?? "",
      hostName: host?.full_name ?? "Host",
      listingTitle: req.listings?.title ?? "",
      kind: "STORAGE",
    }).catch((e) => console.error("[cron] expiry email error:", e));
  }

  return ids.length;
}

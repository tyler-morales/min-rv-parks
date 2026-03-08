import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const isProd = process.env.NODE_ENV === "production";
const FROM =
  process.env.RESEND_FROM ||
  (isProd ? "Mini RV Parks <noreply@minirvparks.com>" : "Mini RV Parks <onboarding@resend.dev>");

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

/** Returns true if the email was sent, false if skipped (no API key) or send failed. */
async function send(payload: EmailPayload): Promise<boolean> {
  if (!resend) {
    console.warn(
      "[email] RESEND_API_KEY not set — no email sent. Set RESEND_API_KEY in .env.local to notify guests.",
      payload.subject,
      "→",
      payload.to,
    );
    return false;
  }
  const { error } = await resend.emails.send({ from: FROM, ...payload });
  if (error) {
    console.error("[email] send failed:", error);
    return false;
  }
  return true;
}

function fmtDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// ── Beta application submitted (→ admin) ──────────────────────────

export async function sendBetaApplied(data: {
  adminEmail: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
}): Promise<boolean> {
  return send({
    to: data.adminEmail,
    subject: `New beta application from ${data.name}`,
    html: `
      <h2>New Beta Application</h2>
      <table style="border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:4px 12px 4px 0;color:#666">Name</td><td>${data.name}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Email</td><td>${data.email}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Phone</td><td>${data.phone}</td></tr>
      </table>
      ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ""}
      <p><a href="${APP_URL}/admin/applications" style="display:inline-block;background:#059669;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">Review Applications</a></p>
    `,
  });
}

// ── Beta application approved (→ guest) ───────────────────────────

export async function sendBetaApproved(data: {
  guestEmail: string;
  guestName: string;
}): Promise<boolean> {
  return send({
    to: data.guestEmail,
    subject: "You're approved for Mini RV Parks beta!",
    html: `
      <h2>Welcome to Mini RV Parks!</h2>
      <p>Hi ${data.guestName},</p>
      <p>Great news — your beta application has been approved. You can now browse listings and submit booking or storage requests.</p>
      <p><a href="${APP_URL}" style="display:inline-block;background:#059669;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">Start Exploring</a></p>
    `,
  });
}

// ── Stay request submitted ─────────────────────────────────────────

export async function sendStayRequestToHost(data: {
  hostEmail: string;
  hostName: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  listingTitle: string;
  checkIn: string;
  checkOut: string;
  totalPriceCents: number;
  message?: string;
}) {
  await send({
    to: data.hostEmail,
    subject: `New booking request for "${data.listingTitle}"`,
    html: `
      <h2>New Booking Request</h2>
      <p>Hi ${data.hostName},</p>
      <p><strong>${data.guestName}</strong> has requested to book <strong>${data.listingTitle}</strong>.</p>
      <table style="border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:4px 12px 4px 0;color:#666">Dates</td><td>${fmtDate(data.checkIn)} – ${fmtDate(data.checkOut)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Total</td><td>${fmtPrice(data.totalPriceCents)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Email</td><td>${data.guestEmail}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Phone</td><td>${data.guestPhone}</td></tr>
      </table>
      ${data.message ? `<p><strong>Message:</strong> ${data.message}</p>` : ""}
      <p>Log in to your host dashboard to accept or decline this request.</p>
    `,
  });
}

export async function sendStayRequestToGuest(data: {
  guestEmail: string;
  guestName: string;
  listingTitle: string;
  checkIn: string;
  checkOut: string;
  totalPriceCents: number;
}) {
  await send({
    to: data.guestEmail,
    subject: `Your booking request for "${data.listingTitle}" has been submitted`,
    html: `
      <h2>Request Submitted</h2>
      <p>Hi ${data.guestName},</p>
      <p>Your request to book <strong>${data.listingTitle}</strong> has been sent to the host.</p>
      <table style="border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:4px 12px 4px 0;color:#666">Dates</td><td>${fmtDate(data.checkIn)} – ${fmtDate(data.checkOut)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Total</td><td>${fmtPrice(data.totalPriceCents)}</td></tr>
      </table>
      <p>The host will review your request and respond soon. If accepted, you'll have <strong>24 hours</strong> to complete payment.</p>
    `,
  });
}

// ── Storage request submitted ──────────────────────────────────────

export async function sendStorageRequestToHost(data: {
  hostEmail: string;
  hostName: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  listingTitle: string;
  moveInDate: string;
  months: number;
  monthlyPriceCents: number;
  depositCents: number;
  message?: string;
}) {
  await send({
    to: data.hostEmail,
    subject: `New storage request for "${data.listingTitle}"`,
    html: `
      <h2>New Storage Request</h2>
      <p>Hi ${data.hostName},</p>
      <p><strong>${data.guestName}</strong> has requested storage at <strong>${data.listingTitle}</strong>.</p>
      <table style="border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:4px 12px 4px 0;color:#666">Move-in</td><td>${fmtDate(data.moveInDate)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Duration</td><td>${data.months} month${data.months !== 1 ? "s" : ""}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Monthly</td><td>${fmtPrice(data.monthlyPriceCents)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Deposit</td><td>${fmtPrice(data.depositCents)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Email</td><td>${data.guestEmail}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Phone</td><td>${data.guestPhone}</td></tr>
      </table>
      ${data.message ? `<p><strong>Message:</strong> ${data.message}</p>` : ""}
      <p>Log in to your host dashboard to accept or decline this request.</p>
    `,
  });
}

export async function sendStorageRequestToGuest(data: {
  guestEmail: string;
  guestName: string;
  listingTitle: string;
  moveInDate: string;
  months: number;
  monthlyPriceCents: number;
  depositCents: number;
}) {
  await send({
    to: data.guestEmail,
    subject: `Your storage request for "${data.listingTitle}" has been submitted`,
    html: `
      <h2>Request Submitted</h2>
      <p>Hi ${data.guestName},</p>
      <p>Your storage request for <strong>${data.listingTitle}</strong> has been sent to the host.</p>
      <table style="border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:4px 12px 4px 0;color:#666">Move-in</td><td>${fmtDate(data.moveInDate)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Duration</td><td>${data.months} month${data.months !== 1 ? "s" : ""}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">First payment</td><td>${fmtPrice(data.depositCents + data.monthlyPriceCents)} (deposit + 1st month)</td></tr>
      </table>
      <p>The host will review your request and respond soon. If accepted, you'll have <strong>24 hours</strong> to complete payment.</p>
    `,
  });
}

// ── Request accepted ───────────────────────────────────────────────

export async function sendRequestAccepted(data: {
  guestEmail: string;
  guestName: string;
  listingTitle: string;
  listingId: string;
  requestId: string;
  kind: "STAY" | "STORAGE";
  expiresAt: string;
}): Promise<boolean> {
  const expiryLabel = new Date(data.expiresAt).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const prefix = data.kind === "STAY" ? "book" : "store";
  const paymentUrl = `${APP_URL}/${prefix}/${data.listingId}/confirm?requestId=${data.requestId}`;

  return send({
    to: data.guestEmail,
    subject: `Your ${data.kind === "STAY" ? "booking" : "storage"} request has been accepted!`,
    html: `
      <h2>Request Accepted!</h2>
      <p>Hi ${data.guestName},</p>
      <p>Great news — your ${data.kind === "STAY" ? "booking" : "storage"} request for <strong>${data.listingTitle}</strong> has been accepted by the host.</p>
      <p style="background:#f0fdf4;border:1px solid #bbf7d0;padding:12px 16px;border-radius:8px;margin:16px 0">
        <strong>Please complete payment by ${expiryLabel}.</strong><br/>
        If payment is not received within 24 hours, the request will expire.
      </p>
      <p><a href="${paymentUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Complete Payment</a></p>
    `,
  });
}

// ── Request declined ───────────────────────────────────────────────

export async function sendRequestDeclined(data: {
  guestEmail: string;
  guestName: string;
  listingTitle: string;
  kind: "STAY" | "STORAGE";
}): Promise<boolean> {
  return send({
    to: data.guestEmail,
    subject: `Your ${data.kind === "STAY" ? "booking" : "storage"} request was declined`,
    html: `
      <h2>Request Declined</h2>
      <p>Hi ${data.guestName},</p>
      <p>Unfortunately, the host has declined your ${data.kind === "STAY" ? "booking" : "storage"} request for <strong>${data.listingTitle}</strong>.</p>
      <p>Don't worry — there are plenty of other options. Head back to Mini RV Parks to find another spot.</p>
    `,
  });
}

// ── Request expired ───────────────────────────────────────────────

export async function sendRequestExpired(data: {
  guestEmail: string;
  guestName: string;
  hostEmail: string;
  hostName: string;
  listingTitle: string;
  kind: "STAY" | "STORAGE";
}): Promise<{ guestSent: boolean; hostSent: boolean }> {
  const label = data.kind === "STAY" ? "booking" : "storage";

  const guestSent = await send({
    to: data.guestEmail,
    subject: `Your ${label} request for "${data.listingTitle}" has expired`,
    html: `
      <h2>Request Expired</h2>
      <p>Hi ${data.guestName},</p>
      <p>Your ${label} request for <strong>${data.listingTitle}</strong> has expired because payment was not completed within 24 hours.</p>
      <p>If you're still interested, you can submit a new request on Mini RV Parks.</p>
    `,
  });

  const hostSent = await send({
    to: data.hostEmail,
    subject: `${label.charAt(0).toUpperCase() + label.slice(1)} request for "${data.listingTitle}" expired`,
    html: `
      <h2>Request Expired</h2>
      <p>Hi ${data.hostName},</p>
      <p>The ${label} request from <strong>${data.guestName}</strong> for <strong>${data.listingTitle}</strong> has expired. The guest did not complete payment within 24 hours.</p>
      <p>${data.kind === "STAY" ? "The dates are now available for new requests." : "The storage slot is now available for new requests."}</p>
    `,
  });

  return { guestSent, hostSent };
}

// ── Booking confirmed (stay payment complete) ─────────────────────

export async function sendBookingConfirmed(data: {
  guestEmail: string;
  guestName: string;
  hostEmail: string;
  hostName: string;
  listingTitle: string;
  checkIn: string;
  checkOut: string;
  totalPriceCents: number;
}): Promise<{ guestSent: boolean; hostSent: boolean }> {
  const guestSent = await send({
    to: data.guestEmail,
    subject: `Booking confirmed for "${data.listingTitle}"!`,
    html: `
      <h2>Booking Confirmed!</h2>
      <p>Hi ${data.guestName},</p>
      <p>Your payment has been received and your booking for <strong>${data.listingTitle}</strong> is confirmed.</p>
      <table style="border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:4px 12px 4px 0;color:#666">Check-in</td><td>${fmtDate(data.checkIn)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Check-out</td><td>${fmtDate(data.checkOut)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Total paid</td><td>${fmtPrice(data.totalPriceCents)}</td></tr>
      </table>
      <p>The host will share arrival details closer to your check-in date.</p>
    `,
  });

  const hostSent = await send({
    to: data.hostEmail,
    subject: `Payment received — booking confirmed for "${data.listingTitle}"`,
    html: `
      <h2>Booking Confirmed</h2>
      <p>Hi ${data.hostName},</p>
      <p><strong>${data.guestName}</strong> has completed payment for <strong>${data.listingTitle}</strong>.</p>
      <table style="border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:4px 12px 4px 0;color:#666">Check-in</td><td>${fmtDate(data.checkIn)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Check-out</td><td>${fmtDate(data.checkOut)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Total</td><td>${fmtPrice(data.totalPriceCents)}</td></tr>
      </table>
      <p>Please prepare for your guest's arrival.</p>
    `,
  });

  return { guestSent, hostSent };
}

// ── Storage contract active (storage payment complete) ────────────

export async function sendStorageContractActive(data: {
  guestEmail: string;
  guestName: string;
  hostEmail: string;
  hostName: string;
  listingTitle: string;
  moveInDate: string;
  monthlyPriceCents: number;
  depositCents: number;
}): Promise<{ guestSent: boolean; hostSent: boolean }> {
  const guestSent = await send({
    to: data.guestEmail,
    subject: `Storage contract active for "${data.listingTitle}"!`,
    html: `
      <h2>Storage Contract Active!</h2>
      <p>Hi ${data.guestName},</p>
      <p>Your payment has been received and your storage contract for <strong>${data.listingTitle}</strong> is now active.</p>
      <table style="border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:4px 12px 4px 0;color:#666">Move-in</td><td>${fmtDate(data.moveInDate)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Monthly</td><td>${fmtPrice(data.monthlyPriceCents)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Deposit paid</td><td>${fmtPrice(data.depositCents)}</td></tr>
      </table>
      <p>The host will send move-in instructions.</p>
    `,
  });

  const hostSent = await send({
    to: data.hostEmail,
    subject: `Payment received — storage contract active for "${data.listingTitle}"`,
    html: `
      <h2>Storage Contract Active</h2>
      <p>Hi ${data.hostName},</p>
      <p><strong>${data.guestName}</strong> has completed payment for <strong>${data.listingTitle}</strong>. The storage contract is now active.</p>
      <table style="border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:4px 12px 4px 0;color:#666">Move-in</td><td>${fmtDate(data.moveInDate)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Monthly</td><td>${fmtPrice(data.monthlyPriceCents)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666">Deposit</td><td>${fmtPrice(data.depositCents)}</td></tr>
      </table>
      <p>Please send move-in instructions to <strong>${data.guestName}</strong> at ${data.guestEmail}.</p>
    `,
  });

  return { guestSent, hostSent };
}

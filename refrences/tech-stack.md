# Mini RV Parks — Full-stack tech stack (source of truth)

MVP/proof-of-concept stack for a fully usable app: one link, end-to-end user flows, minimal cost.

---

## Service matrix

| Need | Service | Why / cost |
|------|---------|------------|
| **Hosting** | **Vercel** | Free tier (hobby) for Next.js. Upgrade to Pro (~$20/mo) when you need cron or higher limits. |
| **Database** | **Supabase** (Postgres) | Free tier: 500MB DB, 1GB file storage, 50k MAU auth. Single dashboard for DB + auth + storage. |
| **Auth (hosts only)** | **Supabase Auth** or **NextAuth.js** | Supabase: built-in, free. NextAuth: credentials provider + session; no extra cost. |
| **Maps / geocode** | **Mapbox** | Free tier: 50k map loads/mo. Per requirements (section F). |
| **Payments** | **Stripe** | No monthly fee; pay per transaction. Checkout Session for “pay after host accepts” + 24h window. |
| **Photo storage** | **Supabase Storage** (S3-compatible) | 1GB free; same backend as DB. Avoids separate S3 account. |
| **Email** | **Resend** or **SendGrid** | Resend: 3k/mo free, simple API. SendGrid: 100/day free. Postmark (per requirements F) also fine. |
| **Cron (expire requests)** | **Vercel Cron** (Pro) or **external cron** | Pro: `vercel.json` cron → API route. Free: cron-job.org (or similar) hitting a protected route. |

---

## End-to-end flow

1. **Guest (no account):** Browse → search (Mapbox geocode + API) → listing detail → request to book/store (form → API → email).
2. **Host:** Login (Supabase Auth or NextAuth) → dashboard → create listing (photos → Supabase Storage) → submit for review → accept/decline requests → emails sent.
3. **Admin:** Approve listings + beta applications in-app (role check in API).
4. **Payments:** Host accepts → guest gets email with link → Stripe Checkout (deposit + first month for storage, or stay total) → webhook updates booking/contract in Supabase.
5. **Expiry:** Cron hits e.g. `POST /api/cron/expire-requests` (with secret); handler marks expired and reopens dates/slots.

---

## Implementation checklist

- **Supabase:** Project + env vars (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`). Schema: listings, booking_requests, storage_requests, beta_applications, users/hosts (or auth.users).
- **API routes:** Implement section G endpoints under `app/api/...`; read/write Supabase; call Stripe/email where needed.
- **Auth:** Protect host/admin routes (middleware or route checks); Supabase Auth or NextAuth with credentials against Supabase users.
- **Stripe:** Checkout Session in `POST /payments/checkout` and `POST /payments/storage_checkout`; webhook route to confirm payment and set booking/contract CONFIRMED/ACTIVE.
- **Email:** Single module: event type + payload → Resend/SendGrid (request submitted, accepted + payment link, declined, expired, etc.).
- **Cron:** One route (e.g. `app/api/cron/expire-requests/route.ts`) that finds `expires_at` past and status ACCEPTED, marks EXPIRED, reopens availability; trigger via Vercel Cron or external cron with secret.

---

## MVP monthly cost

- **$0:** Vercel (hobby), Supabase (free), Mapbox (free tier), Resend (free tier), Stripe (no monthly fee), external cron.
- **~$20 optional:** Vercel Pro for built-in cron and higher limits.

---

## Alignment with requirements

- **DB:** Postgres (Supabase).
- **Maps/geocode:** Mapbox (per F).
- **Payments/payouts:** Stripe (per F).
- **Photo storage:** S3-compatible (Supabase Storage satisfies this).
- **Email:** Postmark or SendGrid per F; Resend is an alternative for simplicity.

See `refrences/requirements.txt` for scope, milestones, and API contracts.

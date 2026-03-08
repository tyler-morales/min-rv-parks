# Mini RV Parks — TODOS

**Canonical spec:** `refrences/requirements.txt` — milestones (D), functional spec (E), API endpoints (G), and scope (B/C). **Tech stack:** `refrences/tech-stack.md` — services, hosting, and implementation checklist.

## Completed

- [x] **Scaffold**: Next.js 15 + Tailwind v4 + shadcn/ui + Zustand + dependencies
- [x] **Global layout**: Nav with Stays/Storage tabs, Host login link, mobile hamburger menu
- [x] **Mock data**: 9 Stay listings + 5 Storage listings with realistic descriptions, Unsplash photos, host profiles
- [x] **Landing page**: Hero with gradient, tabbed search bar (Stays/Storage), How It Works, Popular Destinations, footer
- [x] **Search results — Stays**: Filter toggles (Electric/Water/Sewage/Gas/Pull-through), sort, list/map toggle, listing cards with badges and pricing
- [x] **Search results — Storage**: Filter toggles (Covered/Indoor, 24/7, Gated, Cameras, Power), sort, listing cards
- [x] **Listing detail — Stay**: Photo gallery (1+4 grid), hookups section, RV fit, rules, map placeholder, sticky booking sidebar, mobile fixed bar
- [x] **Listing detail — Storage**: Photo gallery, storage type/access/security sections, power, "no living on site" warning, sticky sidebar
- [x] **Request to Book**: Guest form with beta approval check, booking summary sidebar, success state
- [x] **Request to Store**: Guest form, months input, deposit + first month breakdown, success state
- [x] **Mock payment pages**: Stripe checkout mock for both stays and storage
- [x] **Beta application**: Apply form + success page
- [x] **Host login**: Mock auth with 5 demo host accounts + admin shortcut
- [x] **Host dashboard**: Stats cards, My Listings grid with status badges, Recent Requests
- [x] **Host listing wizard**: 7-step wizard (type → basics → features → photos → pricing → availability → review)
- [x] **Availability step**: Prev/Next month navigation so users can block dates across many months (up to 24 ahead)
- [x] **Host requests**: Filterable request list with accept/decline actions, expiry countdown; show guest message when present (optional message from request form)
- [x] **Admin dashboard**: Stats cards, quick action links to review queues
- [x] **Admin listing queue**: Filterable table with approve/reject/suspend/verify actions
- [x] **Admin listing detail**: Full listing view with admin action bar
- [x] **Admin beta applications**: Filterable table with approve/reject actions
- [x] **Zustand store**: Global state for auth, listings, requests, beta applications
- [x] **Types**: Full TypeScript types for all data models
- [x] **Tech stack doc**: `refrences/tech-stack.md` — full-stack services, costs, and implementation checklist (source of truth)
- [x] **Git + GitHub**: Repo `min-rv-parks` created and pushed; `origin` → `github.com/tyler-morales/min-rv-parks`; `.cursor` in `.gitignore`
- [x] **Milestone 1 — Backend**: Supabase (Postgres + Auth + Storage), Next.js API routes for host + admin listings, real Supabase Auth (login/signup), middleware route protection, host listing wizard → API (create, photo upload, submit), admin listing queue → API (approve/reject/suspend/verify), host listing detail page
- [x] **Host listing actions**: Edit and Delete on host listing detail; edit page at `/host/listings/[id]/edit` (title, description, nearTown, pricing, availability); DELETE API for host-owned listings
- [x] **Edit listing photos**: Photos section on edit page — show thumbnails, delete per photo (API returns photoIds), add new photos via POST to existing `/api/host/listings/[id]/photos`; min 5 hint, max 10
- [x] **Edit listing — nightly price in dollars**: Host edit form shows/accepts nightly price in dollars (e.g. 50) instead of cents; still stored as cents in API/DB.

- [x] **Milestone 2 — Search + Mapbox + Detail API**: Postgres Haversine search functions (`search_stays`, `search_storage`), search API routes (`GET /api/search`, `GET /api/storage/search`), single-listing API (`GET /api/listings/[id]`), Mapbox geocoding autocomplete (`GeocoderInput` component), Mapbox map view (`MapView` component with fuzzed markers + popups), all guest pages wired to live API, hero search passes lat/lng, `formatPrice` moved to `lib/utils.ts`
- [x] **Host listing location for search**: Host create/edit now require selecting a place via Mapbox geocoder (not free text). API rejects missing or (0,0) lat/lng; public_lat/lng fuzzed for map. Fixes guest search returning 0 results when host had only entered "near Chicago" without coordinates.
- [x] **Footer content pages**: About (`/about`), Host Your Space (`/host`), Join Beta (`/beta`), Support (`/support`) with copy aligned to requirements (request-to-book, Stays/Storage, beta, no guest accounts, Verified meaning).
- [x] **Resend dev/prod from address**: Email "from" is env-driven via `RESEND_FROM`. Dev defaults to Resend sandbox `onboarding@resend.dev` when unset; prod defaults to `noreply@minirvparks.com`. Local `.env.local` set to sandbox for dev.

- [x] **Milestone 3 — Request Flows + Accept/Decline + Email**:
  - Migration `003_request_tables.sql`: `booking_requests` + `storage_requests` tables with `request_status_enum`, RLS (hosts read/update own, anyone inserts), `updated_at` triggers
  - Guest request APIs: `POST /api/booking-requests` (validates listing is STAY+LIVE, computes total from nights × nightly price), `POST /api/storage-requests` (validates STORAGE+LIVE+available, resolves months/deposit/price from listing)
  - Single request APIs: `GET /api/booking-requests/[id]`, `GET /api/storage-requests/[id]`
  - Host accept/decline APIs: `POST /api/host/booking-requests/[id]/accept` (sets ACCEPTED + expires_at = now+24h), `POST /api/host/booking-requests/[id]/decline` (sets DECLINED); same for storage-requests. All verify host ownership via listing FK + auth.
  - Host requests dashboard API: `GET /api/host/requests` (returns all booking + storage requests for host's listings with listing title)
  - Email notifications (`lib/email.ts` via Resend): request submitted (→ host + guest), request accepted (→ guest with 24h expiry), request declined (→ guest). Graceful no-op when `RESEND_API_KEY` unset.
  - Frontend rewired: `/book/[id]`, `/store/[id]`, `/book/[id]/confirm`, `/store/[id]/confirm` fetch listing from API (no more Zustand mock data). `/host/requests` and `/host/dashboard` fetch from `/api/host/requests`. Loading spinners + async submit with error display.
  - Zustand cleanup: removed `bookingRequests`, `storageRequests`, `stayListings`, `storageListings` and all related actions from store. Store now holds only `activeTab`, `searchFilters`, and `betaApplications` (M5 scope).
  - Middleware cleanup: removed debug agent logging from `lib/supabase/middleware.ts`.
  - **Accept/decline email visibility**: Email send now returns success/skip; accept/decline APIs await email and return `emailSent`. Host requests page shows notice when guest was not notified (e.g. `RESEND_API_KEY` unset). No-key case logs a clear warning.

## Before production deploy

- **Resend email**: In Vercel (or wherever prod runs), either **omit** `RESEND_FROM` so the app uses `noreply@minirvparks.com` (after verifying the domain in the Resend dashboard), or set `RESEND_FROM=Mini RV Parks <noreply@minirvparks.com>` explicitly. Do not use the sandbox address (`onboarding@resend.dev`) in production.

### Reminder: Before going live with payments (do these when you have a live URL)

- [ ] **Stripe webhook (production):** In Stripe Dashboard → Developers → Webhooks, add endpoint `https://{your-url}/api/webhooks/stripe` and subscribe to `checkout.session.completed`. Copy the signing secret into `STRIPE_WEBHOOK_SECRET` in production env (replace the Stripe CLI secret).
- [ ] **Expiry cron:** Point an external cron (e.g. [cron-job.org](https://cron-job.org)) at `POST https://{your-url}/api/cron/expire-requests` with header `Authorization: Bearer {CRON_SECRET}`, every 5–10 minutes.

### Reminder: Verify Resend domain when you have one

When you have a domain (e.g. minirvparks.com):

1. Add it at **resend.com/domains** and add the DNS records Resend gives you.
2. Use a **from** address on that domain (e.g. `noreply@minirvparks.com`). The app already supports this via **RESEND_FROM** in production.

- [x] **Milestone 4 — Payments + Expiry Job**:
  - Migration `004_payments.sql`: `bookings` table (CONFIRMED/CANCELLED/COMPLETED), `storage_contracts` table (ACTIVE/CANCELLED/ENDED), `booking_status_enum`, `contract_status_enum`, `stripe_session_id` column on both request tables, RLS policies, `updated_at` triggers
  - Stripe client module (`lib/stripe.ts`): thin wrapper around `stripe` npm package using `STRIPE_SECRET_KEY`
  - Checkout API: `POST /api/payments/checkout` (stays — validates ACCEPTED + not expired, creates Stripe Checkout Session with listing as line item, saves `stripe_session_id` on request, returns checkout URL); `POST /api/payments/storage-checkout` (storage — two line items: deposit + first month)
  - Stripe webhook: `POST /api/webhooks/stripe` — verifies signature, handles `checkout.session.completed`, creates `bookings` (CONFIRMED) or `storage_contracts` (ACTIVE), sets storage listing `is_available=false`, sends confirmation emails to guest + host. Idempotent (skips if record already exists).
  - Confirm pages rewritten: `/book/[id]/confirm` and `/store/[id]/confirm` now accept `requestId` param, fetch request data, show live countdown timer to `expires_at`, call checkout API on click, redirect to Stripe. Handles expired/invalid states gracefully.
  - Success pages: `/book/[id]/success` and `/store/[id]/success` shown after Stripe redirect with confirmation message.
  - Expiry cron: `POST /api/cron/expire-requests` — protected by `CRON_SECRET` Bearer token, uses admin Supabase client, finds ACCEPTED requests past `expires_at`, marks EXPIRED, sends expiry emails to guest + host. Returns count of expired requests.
  - Email updates: `sendRequestAccepted` now includes a "Complete Payment" button linking to confirm page. Added `sendRequestExpired` (guest + host), `sendBookingConfirmed` (guest + host), `sendStorageContractActive` (guest + host).
  - Types: added `Booking` and `StorageContract` interfaces, `stripeSessionId` on request types
  - Platform-only payments (no Stripe Connect for beta); host payouts handled manually
  - External cron (cron-job.org or similar) for expiry; no Vercel Pro dependency
  - **Vercel preview deploy**: Stripe made optional in `lib/stripe.ts`; checkout and webhook routes return 503 when Stripe is disabled. README documents required env vars (Supabase + Mapbox only) for a live preview with no email and no payments. Full prod will add Resend + Stripe + `NEXT_PUBLIC_APP_URL` + cron when ready.

- [x] **Milestone 5 — Beta Application Gating**:
  - Migration `005_beta_applications.sql`: `beta_applications` table with `beta_application_status_enum` (PENDING/APPROVED/REJECTED), unique email constraint, RLS (public INSERT, admin SELECT/UPDATE), `updated_at` trigger
  - Apply API: `POST /api/beta/apply` — public; inserts application, returns 409 on duplicate email, sends admin notification email via `ADMIN_EMAIL` env var
  - Admin APIs: `GET /api/admin/beta_applications` (filterable by `?status=`), `POST /api/admin/beta_applications/[id]/approve` (sets APPROVED + sends guest approval email), `POST /api/admin/beta_applications/[id]/reject` (sets REJECTED)
  - Beta gate enforcement: `POST /api/booking-requests` and `POST /api/storage-requests` now check `beta_applications` table for APPROVED status on the guest's email before allowing request creation. Returns 403 with "apply at /apply" message if not approved.
  - Email: added `sendBetaApplied` (→ admin) and `sendBetaApproved` (→ guest) to `lib/email.ts`
  - Frontend: `/apply` form now calls real API with error handling (409 duplicate, network errors, loading spinner). `/admin/applications` fetches from API, calls approve/reject endpoints, refetches on action.
  - Admin dashboard: application stats now fetched from API instead of Zustand store
  - Zustand cleanup: removed `betaApplications`, `approvedEmails`, `addBetaApplication`, `updateApplicationStatus` from store. Removed `betaApplications` and `approvedEmails` exports from `lib/mock-data.ts`.
  - Env: added `ADMIN_EMAIL` to `.env.local.example`

## Up Next

- [ ] Deploy to staging

## Deleted/Consolidated

- **Button asChild**: UI uses `@base-ui/react/button`, which has no `asChild`; it uses `render`. Added `asChild` support in `components/ui/button.tsx`: strip `asChild` from props and when true pass single child via `render` with merged className and `nativeButton={false}` so Edit/Delete buttons on host listing page work without React DOM warning.
- Photos step: implemented click-to-browse (hidden file input + button trigger), `photoUrls` + `photoFiles` in wizard state, validation min 5, preview grid
- **Milestone 1**: Removed mock auth from Zustand (replaced with Supabase Auth + `useAuth` hook). Removed `updateListingStatus` / `toggleVerified` from store (admin uses API). Kept `stayListings` / `storageListings` in store for guest pages until M2 search API.
- **Milestone 2**: Moved `formatPrice` / `formatPriceDecimal` from `lib/mock-data.ts` to `lib/utils.ts`; updated 12 files. Guest search/detail pages no longer import from `lib/store.ts` or `lib/mock-data.ts` — they fetch from API routes. Replaced map placeholder with live Mapbox `MapView`. Replaced plain text destination input with geocoding autocomplete (`GeocoderInput`). Popular Destinations cards now navigate with lat/lng params. `stayListings`/`storageListings` kept in Zustand store temporarily for M3 request-flow pages (`/book/[id]`, `/store/[id]`).
- **Next.js proxy**: Migrated from deprecated `middleware.ts` to `proxy.ts`; exported function renamed from `middleware` to `proxy`. `lib/supabase/middleware.ts` (Supabase session helper) unchanged.
- **Host location**: Removed default (0,0) for new listings; host must select a location from GeocoderInput so search uses real lat/lng. Edit page shows geocoder and requires valid location; listings with 0,0 must be re-saved with a selected place.
- **Milestone 3**: Removed `bookingRequests`, `storageRequests`, `stayListings`, `storageListings` and all mock-data-backed actions from Zustand store. `/book/[id]`, `/store/[id]`, `/book/[id]/confirm`, `/store/[id]/confirm` now fetch listing from API. `/host/requests` and `/host/dashboard` fetch request data from `/api/host/requests` instead of store. Removed debug agent logging from middleware.
- **Milestone 4**: Replaced mock payment pages (`/book/[id]/confirm`, `/store/[id]/confirm`) with real Stripe Checkout flow. Mock `onClick={() => setPaid(true)}` replaced with API call → Stripe redirect. Removed "This is a demo. No real payment is processed." notices. Updated `sendRequestAccepted` email from "You'll receive a payment link shortly" to a direct "Complete Payment" button with URL.
- **Milestone 5**: Removed `betaApplications`, `approvedEmails`, `addBetaApplication`, `updateApplicationStatus` from Zustand store and `BetaApplication` mock data. Admin dashboard no longer imports `useAppStore`. Apply page no longer writes to client state — all beta data now lives in Postgres.

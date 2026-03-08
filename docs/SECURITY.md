# Security

Mini RV Parks implements defense-in-depth for uploads, input, auth, and API hardening.

## What we validate

- **Listing photo uploads:** Server-side checks on size (max 10MB), MIME type (JPEG/PNG only), and magic-byte signatures. File extension is derived from validated MIME, not from the client. Path is `{listingId}/{uuid}.{ext}` with a server-generated UUID. Max 20 photos per listing; uploads are rate-limited when Redis is configured.
- **Guest and host input:** All request bodies for booking requests, storage requests, beta applications, and listing create are validated with Zod schemas (length limits, email format, UUIDs, date logic). JSON body size is capped (64KB for guest APIs, 128KB for listing create).
- **Payments:** Stripe webhook signature is verified with the raw body before processing. We do not store card data; Stripe Checkout handles payment details.
- **Admin:** Admin routes require an authenticated user and `profiles.role = 'admin'`. Admin actions use the service role only after this check. Host routes verify `host_id` (or listing ownership) before any mutation.

## How we protect

- **Auth:** Supabase Auth with session cookies (no tokens in `localStorage`). Middleware protects `/host` and `/admin`; admin also requires role check.
- **Cron:** The expire-requests job is protected by `Authorization: Bearer {CRON_SECRET}`. Only call it from a trusted scheduler (e.g. Vercel Cron or cron-job.org) with the secret in the header.
- **Storage:** The `listing-photos` bucket is created and gated by RLS in migration `006_storage_listing_photos.sql`. Public read; authenticated insert; delete only for objects in folders that match the user’s own listing IDs.
- **Headers:** `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a Content-Security-Policy are set in `next.config.ts`.
- **Errors:** API routes log details server-side and return a generic message to the client for 500s. No stack traces or internal error strings are exposed.
- **Rate limiting:** When `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set, the proxy applies per-IP limits: strict for photo upload, beta apply, and request submission; moderate for search and general API.

## Env vars (secrets vs public)

- **Server-only (never expose to client):** `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CRON_SECRET`, `RESEND_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `ADMIN_EMAIL`.
- **Safe for client:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_MAPBOX_TOKEN`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_APP_URL`.

See `.env.local.example` for the full list and comments.

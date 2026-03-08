# Runbook

Operational notes for deployment, cron, and storage.

## Environment variables

- **Required for minimal run:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Optional: Mapbox, Resend, Stripe, cron secret, admin email. See `.env.local.example` and [SECURITY.md](SECURITY.md) for which are public vs secret.
- **Production:** Set all secrets in the host (e.g. Vercel) env; never commit `.env.local` or real secrets. Use production Stripe keys and webhook URL for live payments.

## Cron: expire unpaid requests

- **Endpoint:** `POST https://{APP_URL}/api/cron/expire-requests`
- **Auth:** Header `Authorization: Bearer {CRON_SECRET}`. Generate a random secret (e.g. `openssl rand -hex 32`) and set it in env as `CRON_SECRET`.
- **Schedule:** Every 5–10 minutes (e.g. cron-job.org or Vercel Cron).
- **Behavior:** Marks ACCEPTED booking/storage requests past `expires_at` as EXPIRED and sends expiry emails. Returns JSON with counts; 401 if the secret is missing or wrong.

## Storage bucket (listing-photos)

- **Creation and RLS:** Migration `supabase/migrations/006_storage_listing_photos.sql` creates the bucket (if missing) and RLS policies on `storage.objects`: public read, authenticated insert, delete only for paths under the host’s own listing IDs.
- **If you already created the bucket by hand:** Run the migration anyway; it is idempotent for the bucket and adds the policies. If you see duplicate policy errors, drop the existing policies and re-run, or adjust policy names in the migration to match your setup.

## Rate limiting

- **Optional.** If `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set, the app applies per-IP rate limits to API routes (photo upload, beta apply, request submit, search, and general API). If not set, rate limiting is skipped (all requests allowed). Use [Upstash Redis](https://upstash.com) for a serverless-friendly store.

## Development tools (MCP)

- **Configured in project:** **shadcn**, **Stripe** (local stdio), **Supabase** (remote + PAT in headers), **GitHub** (local Docker). Stripe and GitHub use local/stdio so they avoid the "dynamic client registration" OAuth error; Supabase uses a Bearer token in headers. See [.cursor/README.md](../.cursor/README.md) for setup (env vars for Stripe/GitHub, PAT for Supabase) and [MCP_AUDIT.md](MCP_AUDIT.md) for the security audit.
- **Secrets:** Do not put tokens or API keys in `mcp.json`. Use Cursor secret inputs or env only. Keep “confirm before run” enabled for tools that can modify data (Stripe, Supabase write tools if ever enabled).
- **References:** [Supabase MCP security](https://supabase.com/docs/guides/getting-started/mcp#security-risks), [Stripe MCP](https://docs.stripe.com/mcp).

## Dependencies

- Before releases: run `npm audit` and address high/critical. Use `npm ci` in CI for reproducible installs.
- Prefer Dependabot (or similar) for security updates; review and merge non-breaking patches.

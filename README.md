This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

**Source of truth:** All product scope, build order, and API/data decisions come from [`refrences/requirements.txt`](refrences/requirements.txt). Reference it for milestones, feature specs, and endpoints.

## Setup (Milestone 1+)

1. Copy env template: `cp .env.local.example .env.local`
2. Create a [Supabase](https://supabase.com) project (e.g. `mini-rv-parks`).
3. In **Settings → API**, copy Project URL, `anon` key, and `service_role` key into `.env.local` as `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
4. In **Settings → Auth**, enable Email provider. For dev you can disable "Confirm email".
5. Run the initial migration: Supabase Dashboard → SQL Editor → paste and run `supabase/migrations/001_initial_schema.sql`, or use the Supabase CLI (see below).
6. Create the **listing-photos** storage bucket: Storage → New bucket → name `listing-photos`, set **Public bucket** so listing images are publicly readable. No extra policies required if uploads go through the API (server uses service role); for client uploads, add a policy allowing authenticated users to upload to `{listing_id}/*`.

## Supabase CLI (migrations)

To push migrations with `supabase db push`, link the repo to your project once:

1. Install CLI: `brew install supabase/tap/supabase` (or `npm install -g supabase`).
2. Log in: `supabase login` (opens browser).
3. Link (use the project ref from your Supabase URL in `.env.local`, e.g. `https://<project-ref>.supabase.co`):
   ```bash
   supabase link --project-ref <project-ref>
   ```
   When prompted, use the database password from Supabase Dashboard → **Settings → Database**.
4. Push migrations: `supabase db push`.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

**Production env (Resend):** In Vercel (or wherever prod runs), either omit `RESEND_FROM` so the code uses `noreply@minirvparks.com` (after you verify the domain in Resend), or set `RESEND_FROM=Mini RV Parks <noreply@minirvparks.com>` explicitly. Do not use the sandbox address in production.

## Stripe (Milestone 4) — No domain or business yet

You can run the full payment flow **without a domain or business name** by using Stripe in **test mode** and localhost.

### What you need now

1. **Stripe account** — Sign up at [dashboard.stripe.com](https://dashboard.stripe.com). No business verification required for test mode.
2. **Test API keys** — Dashboard → Developers → API keys. Use **Test mode** (toggle in the dashboard). Copy:
   - **Secret key** (`sk_test_...`) → `STRIPE_SECRET_KEY`
   - **Publishable key** (`pk_test_...`) → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. **App URL** — Omit `NEXT_PUBLIC_APP_URL` or set `NEXT_PUBLIC_APP_URL=http://localhost:3000`. The app already defaults to localhost when unset, so redirects and email payment links will use localhost.
4. **Webhooks on localhost** — Stripe can’t reach your machine. Use the **Stripe CLI** to forward events to your app:
   - Install: [Stripe CLI](https://stripe.com/docs/stripe-cli)
   - Run: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
   - The CLI prints a **webhook signing secret** (`whsec_...`). Put it in `.env.local` as `STRIPE_WEBHOOK_SECRET`
   - Keep the CLI running while you test checkout; it forwards `checkout.session.completed` to your app.

### Test the flow

1. Start the app: `npm run dev`
2. In another terminal: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
3. Copy the `whsec_...` into `STRIPE_WEBHOOK_SECRET` and restart the dev server if it was already running
4. Use Stripe test cards (e.g. `4242 4242 4242 4242`). No real charges; no domain or business name required.

### When you have a domain and business

- **Domain:** Set `NEXT_PUBLIC_APP_URL` to your live URL (e.g. `https://minirvparks.com`).
- **Business name:** In Stripe Dashboard → Settings → Business settings you can set your business name; it will appear on the Checkout page and receipts. You can leave it as your account name until then.

### Before going live with payments — do these when you have a live URL

1. **Stripe webhook (production)**  
   In Stripe Dashboard → Developers → Webhooks, add endpoint `https://{your-url}/api/webhooks/stripe` and subscribe to **`checkout.session.completed`**. Copy the new signing secret into `STRIPE_WEBHOOK_SECRET` in your production env (replace the Stripe CLI secret).

2. **Expiry cron**  
   Point an external cron (e.g. [cron-job.org](https://cron-job.org)) at:
   - **URL:** `POST https://{your-url}/api/cron/expire-requests`
   - **Header:** `Authorization: Bearer {CRON_SECRET}`  
   Schedule it every **5–10 minutes**.

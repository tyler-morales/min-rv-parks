This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

**Source of truth:** All product scope, build order, and API/data decisions come from [`refrences/requirements.txt`](refrences/requirements.txt). Reference it for milestones, feature specs, and endpoints.

## Setup (Milestone 1+)

1. Copy env template: `cp .env.local.example .env.local`
2. Create a [Supabase](https://supabase.com) project (e.g. `mini-rv-parks`).
3. In **Settings → API**, copy Project URL, `anon` key, and `service_role` key into `.env.local` as `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
4. In **Settings → Auth**, enable Email provider. For dev you can disable "Confirm email".
5. Run the initial migration: Supabase Dashboard → SQL Editor → paste and run `supabase/migrations/001_initial_schema.sql`.
6. Create the **listing-photos** storage bucket: Storage → New bucket → name `listing-photos`, set **Public bucket** so listing images are publicly readable. No extra policies required if uploads go through the API (server uses service role); for client uploads, add a policy allowing authenticated users to upload to `{listing_id}/*`.

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

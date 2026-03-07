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
- [x] **Host requests**: Filterable request list with accept/decline actions, expiry countdown
- [x] **Admin dashboard**: Stats cards, quick action links to review queues
- [x] **Admin listing queue**: Filterable table with approve/reject/suspend/verify actions
- [x] **Admin listing detail**: Full listing view with admin action bar
- [x] **Admin beta applications**: Filterable table with approve/reject actions
- [x] **Zustand store**: Global state for auth, listings, requests, beta applications
- [x] **Types**: Full TypeScript types for all data models
- [x] **Tech stack doc**: `refrences/tech-stack.md` — full-stack services, costs, and implementation checklist (source of truth)

## Up Next (Post-UI)

- [ ] Postgres database + Prisma schema
- [ ] API routes (Next.js route handlers)
- [ ] Real auth (NextAuth or similar)
- [ ] Mapbox integration for map views
- [ ] Photo upload to S3
- [ ] Stripe integration for payments
- [ ] Email notifications (Postmark/SendGrid)
- [ ] Background job for expiring unpaid requests
- [ ] Deploy to staging

## Deleted/Consolidated

- Removed `asChild` prop usage from listing detail pages — replaced with plain Link components styled inline (shadcn v4 Button doesn't support `asChild`)
- Photos step: implemented click-to-browse (hidden file input + button trigger), `photoUrls` in wizard state, validation min 5, preview grid

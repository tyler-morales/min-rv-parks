# shadcn Styles & Component Audit Report

**Date:** 2025-03-07  
**Scope:** `components/ui/`, `app/`, shared UI (e.g. `components/map-view.tsx`, `components/listing-card.tsx`, `components/geocoder-input.tsx`, `components/nav.tsx`)

---

## Project context (from `npx shadcn@latest info --json`)

| Field | Value |
|-------|--------|
| **Base** | `base` (Base UI, not Radix) — use `render` for custom triggers, not `asChild` |
| **Style** | `base-nova` |
| **Icon library** | `lucide` |
| **Aliases** | `@/components`, `@/components/ui`, `@/lib/utils`, `@/lib`, `@/hooks` |
| **Framework** | Next.js 16, RSC: true, Tailwind v4, `app/globals.css` |

---

## 1. space-x-* / space-y-* → use gap-*

| File | Line(s) | Rule violated | Suggested change |
|------|---------|----------------|-------------------|
| `components/map-view.tsx` | 116 | `space-y-*` | Use `flex flex-col gap-2` instead of `space-y-2` |
| `components/listing-card.tsx` | 39 | `space-y-2` | Use `flex flex-col gap-2` |
| `app/support/page.tsx` | 63 | `space-y-6` | Use `flex flex-col gap-6` (or appropriate container) |
| `app/store/[id]/page.tsx` | 148–149, 160, 172, 184, 201, 250, 265 | `space-y-5`, `space-y-1.5`, `space-y-4`, `space-y-2` | Form: use `flex flex-col gap-5` (or FieldGroup+Field). Field rows: `gap-1.5`. Card/summary: `gap-4`, `gap-2` |
| `app/store/[id]/confirm/page.tsx` | 158, 163 | `space-y-4`, `space-y-2` | Use `flex flex-col gap-4` and `gap-2` |
| `app/storage/[id]/page.tsx` | 254 | `space-y-5` in CardContent | Use `flex flex-col gap-5` |
| `app/stays/[id]/page.tsx` | 211, 337, 355 | `space-y-1`, `space-y-5`, `space-y-1` | Use `gap-1`, `gap-5`, `gap-1` with flex |
| `app/host/listings/[id]/page.tsx` | 113, 190 | `space-y-6`, `space-y-4` | Use `flex flex-col gap-6`, `gap-4` |
| `app/host/listings/[id]/edit/page.tsx` | 200 | `space-y-6` | Use `flex flex-col gap-6` |
| `app/book/[id]/page.tsx` | 149–150, 161, 173, 185, 234, 256 | Multiple `space-y-*` | Same as store flow: form `gap-5`, field rows `gap-1.5`, summary `gap-4`/`gap-2` |
| `app/book/[id]/confirm/page.tsx` | 163 | `space-y-4` | Use `flex flex-col gap-4` |
| `app/beta/page.tsx` | 61 | `space-y-4` | Use `flex flex-col gap-4` |
| `app/apply/page.tsx` | 60–61, 72, 84, 96 | `space-y-5`, `space-y-1.5` | Form: `flex flex-col gap-5`; field rows: `gap-1.5` |
| `app/admin/page.tsx` | 99 | `space-y-8` | Use `flex flex-col gap-8` |
| `app/admin/listings/page.tsx` | 94, 127, 187 | `space-y-6`, `space-y-3`, `space-y-1` | Use `gap-6`, `gap-3`, `gap-1` with flex |
| `app/admin/listings/[id]/page.tsx` | 101, 185 | `space-y-6`, `space-y-4` | Use `gap-6`, `gap-4` |
| `app/admin/applications/page.tsx` | 107, 140, 173, 179 | `space-y-6`, `space-y-3`, `space-y-2`, `space-y-1` | Use corresponding `gap-*` with flex |
| `components/ui/avatar.tsx` | 78 | `-space-x-2` (avatar overlap) | Intentional overlap pattern; document or keep. If converting to gap, use `gap-*-negative` or leave as exception |

---

## 2. Raw color classes → semantic tokens

| File | Line(s) | Rule violated | Suggested change |
|------|---------|----------------|-------------------|
| `components/map-view.tsx` | 93, 133 | `bg-white`, `text-emerald-800`, `ring-emerald-*`, `text-emerald-700` | Use `bg-background`, `text-foreground` or semantic (e.g. `text-primary`), `ring-primary` |
| `components/listing-card.tsx` | 59 | `border-green-200 bg-green-50 text-green-700` | Use Badge variant or semantic tokens, e.g. `border-primary/20 bg-primary/10 text-primary` |
| `components/geocoder-input.tsx` | 112, 123, 131–132, 136 | `border-gray-200`, `bg-white`, `text-gray-*`, `bg-emerald-50`, `focus:border-emerald-500` | Use `border-input`, `bg-background`, `text-foreground`/`text-muted-foreground`, `bg-primary/10`, `focus:border-ring` |
| `app/support/page.tsx` | 41, 44, 48, 51, 60, 67, 69–70, 79, 82, 86, 89, 96, 106, 110, 117 | Many `gray-*`, `emerald-*` | Replace with `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `text-primary`, etc. |
| `app/store/[id]/success/page.tsx` | 31, 49, 51 | `text-neutral-600`, `text-emerald-500` | `text-muted-foreground`, success state token or `text-primary` |
| `app/store/[id]/page.tsx` | 115, 117, 195, 215, 224, 259, 279, 299 | `text-emerald-500`, `text-neutral-*`, `border-red-*`, `bg-red-50`, `bg-emerald-600` | Use semantic: success `text-primary` or dedicated token; errors `border-destructive`, `bg-destructive/10`, `text-destructive`; primary CTA `Button` default or `variant="default"` |
| `app/store/[id]/confirm/page.tsx` | 109, 120, 124, 144, 153, 182, 186 | `text-neutral-600`, `text-amber-500`, `border-amber-*`, `border-red-*`, `text-red-600`, `bg-indigo-600` | Use `text-muted-foreground`; warning/error semantic tokens; primary CTA use `Button` with default variant (not raw indigo) |
| `app/storage/[id]/page.tsx` | 139, 156, 187, 203, 214, 277, 283, 294, 302 | `text-gray-*`, `text-emerald-*`, `text-amber-500`, `border-amber-*`, `bg-emerald-600`, `dark:bg-gray-950` | Same pattern: semantic tokens and Button variant |
| `app/stays/[id]/page.tsx` | 157, 174, 200–203, 276, 284, 371, 377 | Same as storage | Same as above |
| `app/page.tsx` | 100, 113–124, 141, 159, 167, 171, 179, 185, 193, 200, 207, 222, 235, 238, 246, 248, 252, 256–257, 265, 267, 270, 300, 316 | Many `gray-*`, `emerald-*` | Full pass: `text-muted-foreground`, `bg-background`, `text-foreground`, primary via semantic/Button |
| `app/host/requests/page.tsx` | 47, 51, 55, 59, 63, 67, 180, 185, 269, 313, 341, 345 | Status badge colors (blue, emerald, red, gray, yellow), `text-emerald-600`, `bg-emerald-600`, `text-amber-600` | Prefer Badge variants or semantic status tokens; primary actions use Button |
| `app/host/page.tsx` | 35, 38, 42, 45, 54, 64, 71, 74, 80, 84, 87, 96, 99, 103, 106, 112 | Same landing/section pattern | Semantic tokens throughout |
| `app/host/login/page.tsx` | 155, 217, 227 | `text-emerald-600`, `bg-red-50`, `text-red-700`, `bg-emerald-600` | Semantic error/success and Button |
| `app/host/listings/new/page.tsx` | 240, 249, 272, 274, 285, 294, 329, 385, 387, 391, 657, 672, 951–952, 1043, 1049 | Many `emerald-*`, `red-*` | Semantic tokens; use Button and form components |
| `app/host/listings/[id]/page.tsx` | 25–28, 169 | Status map (gray, yellow, emerald, red), `h-48 w-72` | Status: semantic or Badge variants; image container: consider `size` if square, or keep explicit dimensions for aspect |
| `app/admin/listings/[id]/page.tsx` | 165 | `h-48 w-72` | Same as above (aspect container) |

---

## 3. Card / Dialog / Sheet structure

| File | Line(s) | Rule violated | Suggested change |
|------|---------|----------------|-------------------|
| `app/store/[id]/confirm/page.tsx` | 158–198 | Card used without CardHeader/CardTitle; content and actions all in one block | Wrap in full composition: `Card` → `CardHeader` + `CardTitle` (e.g. summary), `CardContent` (line items), `CardFooter` (Pay button) |
| `app/storage/[id]/page.tsx` | 253–291 | Card with only CardContent; sidebar summary has no CardHeader/CardTitle | Add `CardHeader` + `CardTitle` for “Pricing” or section title; keep `CardContent` for body |
| `app/stays/[id]/page.tsx` | 336–384 | Same | Add `CardHeader`/`CardTitle` for booking summary; structure content in CardContent/CardFooter as needed |
| `app/book/[id]/page.tsx` | 222–256 | Summary Card: image + `div` with `p-5 space-y-4` (no CardHeader/CardTitle) | Use `CardHeader`/`CardTitle` for listing title, `CardContent` for details and actions |
| `app/book/[id]/confirm/page.tsx` | 163 | Same as store confirm | Same as store confirm: CardHeader, CardTitle, CardContent, CardFooter |
| `app/host/requests/page.tsx` | 211–213, 250–350 | Empty state and list: some Cards use only CardContent | Ensure each Card has CardHeader (with CardTitle where appropriate) and CardContent; use CardFooter for actions |
| `app/host/listings/new/page.tsx` | 1019–1029 | Card with only CardContent | Add CardHeader/CardTitle if section has a title |
| Dialog (host listing delete) | `app/host/listings/[id]/page.tsx` | Dialog has Title + Description + Footer — **OK** | No change |

---

## 4. Form layout not using FieldGroup / Field

Forms use raw `div` + `Label` + `Input`/`Textarea` with `space-y-1.5` instead of FieldGroup + Field. **Note:** Project may not have `Field`/`FieldGroup` in registry yet (base-nova); if not installed, add via CLI or keep as future refactor.

| File | Line(s) | Rule violated | Suggested change |
|------|---------|----------------|-------------------|
| `app/store/[id]/page.tsx` | 148–210 | Form: `form` + multiple `div className="space-y-1.5"` + Label + Input | Use `FieldGroup` with `Field` per control; `FieldLabel`, optional `FieldDescription`; replace spacing with gap on FieldGroup |
| `app/store/[id]/confirm/page.tsx` | (Card form) | Inline form/actions in Card | When converting to FieldGroup, use it for any form fields in the card |
| `app/book/[id]/page.tsx` | 149–216 | Same as store request form | Same: FieldGroup + Field per field |
| `app/apply/page.tsx` | 60–104 | Same pattern | Same: FieldGroup + Field |
| `app/storage/[id]/page.tsx` | 266–268 | Label + Input for move-in date in Card | Use Field + FieldLabel + Input |
| `app/stays/[id]/page.tsx` | (booking form if any) | Same pattern if present | FieldGroup + Field |
| `app/host/listings/new/page.tsx` | (all form sections) | Large form with many raw divs + labels | Refactor to FieldGroup + Field for consistency and accessibility |

---

## 5. Icons without data-icon

Icons inside buttons (or other components that style by `data-icon`) should use `data-icon="inline-start"` or `data-icon="inline-end"`. No `data-icon` usages found in codebase.

| File | Line(s) | Rule violated | Suggested change |
|------|---------|----------------|-------------------|
| `app/store/[id]/page.tsx` | 140 | `ArrowLeft` in Link/button | Add `data-icon="inline-start"` (or appropriate) on the icon element |
| `app/store/[id]/confirm/page.tsx` | 145, 191, 193 | `Clock`, `Loader2`, `CreditCard` in button/content | Add `data-icon` where icon is inside a Button (e.g. Loader2, CreditCard in Pay button) |
| `app/storage/[id]/page.tsx` | 94, 114, 142, 153, 172–173, 203, 215, 270 | Icons in buttons/links (ChevronLeft, Images, MapPin, etc.) | Add `data-icon="inline-start"` or `"inline-end"` on icon components inside Button/Link |
| `app/stays/[id]/page.tsx` | 90, 112, 160, 171, 189–191, 200–203, 213, 217 | Same | Same |
| `app/book/[id]/page.tsx` | 141 | ArrowLeft | `data-icon="inline-start"` |
| `app/book/[id]/confirm/page.tsx` | 150, 198, 200 | Clock, Loader2, CreditCard | Same as store confirm |
| `app/host/requests/page.tsx` | 180 | ClipboardList; 269+ (status icons) | Button icons: add data-icon |
| `components/nav.tsx` | 30, 97, 178 | Truck, X, Menu in nav | Add data-icon where inside clickable elements |
| All other icon-in-button usages | — | Icons in Button/Link without data-icon | Add `data-icon="inline-start"` or `"inline-end"` so component CSS can size/space correctly |

---

## 6. w-* h-* where size-* applies (equal width and height)

| File | Line(s) | Rule violated | Suggested change |
|------|---------|----------------|-------------------|
| `app/store/[id]/success/page.tsx` | 49 | `h-16 w-16` | Use `size-16` |
| `app/store/[id]/page.tsx` | 115, 140 | `h-16 w-16`, `h-4 w-4` | Use `size-16`, `size-4` |
| `app/store/[id]/confirm/page.tsx` | 120, 145, 191, 193 | `h-12 w-12`, `h-4 w-4` (×3) | Use `size-12`, `size-4` |
| `app/storage/[id]/page.tsx` | 36–38, 48–51, 94, 114, 142, 153, 157, 172–173, 203, 215, 270 | `h-5 w-5`, `h-4 w-4`, `h-3.5 w-3.5` | Use `size-5`, `size-4`, `size-3.5` (Tailwind supports fractional size) |
| `app/stays/[id]/page.tsx` | 90, 112, 160, 171, 175, 189–191, 200–203, 213, 217 | Same | Same |
| `app/host/listings/[id]/page.tsx` | 169 | `h-48 w-72` | Not equal — keep as-is (aspect/ratio). |
| `app/book/[id]/success/page.tsx` | 50 | `h-16 w-16` | Use `size-16` |
| `app/book/[id]/page.tsx` | 116, 141 | `h-16 w-16`, `h-4 w-4` | Use `size-16`, `size-4` |
| `app/book/[id]/confirm/page.tsx` | 124, 150, 198, 200 | `h-12 w-12`, `h-4 w-4` (×3) | Use `size-12`, `size-4` |
| `app/admin/listings/[id]/page.tsx` | 165 | `h-48 w-72` | Not equal — keep as-is. |
| `components/nav.tsx` | 30, 97, 178 | `h-7 w-7`, `h-5 w-5` | Use `size-7`, `size-5` |
| `app/apply/success/page.tsx` | 10 | `h-16 w-16` | Use `size-16` |
| `app/host/login/page.tsx` | 227 | `h-10` on Button | Button height — keep or use size variant; not a square icon. |

---

## 7. MCP audit checklist (from shadcn:get_audit_checklist)

- [ ] Imports: named vs default correct
- [ ] next/image: `images.remotePatterns` in next.config.js if using remote images
- [ ] Dependencies installed
- [ ] Lint and TypeScript clean
- [ ] Use Playwright MCP when available for UI checks

---

## Summary counts (approximate)

| Category | Occurrences (files) |
|----------|----------------------|
| space-x/y → gap | ~25+ locations across 18+ files |
| Raw colors → semantic | 20+ files with multiple lines each |
| Card/Dialog/Sheet structure | 8+ Card usages need Header/Title/Footer |
| Form FieldGroup/Field | 5+ form pages |
| Icons without data-icon | All icon-in-button usages (15+ files) |
| w/h → size (equal) | 30+ icon instances; 2 keep w/h (aspect) |

---

*No edits were applied. Use this report to plan incremental refactors (e.g. by route or component).*

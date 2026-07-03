# Architecture & Conventions

This document is the technical contract for the Balloons Breeze **frontend**. It exists so that
**future-you never has to reverse-engineer a decision.**

- Audience: frontend devs building the UI.
- Scope: the frontend. The **conventions below (folder layout, data contract, i18n,
  styling/desktop-frozen §5, components §6) are still current.**

> **⚠️ Status update:** the "frontend-only / no server" framing throughout this doc is now
> **historical**. The backend has been built (`backend/` — Express + Prisma + PostgreSQL +
> JWT + SSE) and the frontend is wired to it: the `lib/*Store.ts` modules described here as
> `localStorage` stores now call the API via `frontend/lib/api.ts`, with their **exported
> signatures unchanged** — so this doc's component/data contract still holds. For the live
> backend design see `backend/API_CONTRACT.md` + [`docs/backend/`](./docs/backend/); for
> current status and the QA security-hardening pass see [`CLAUDE.md`](./CLAUDE.md). Read
> mentions of "mock data / localStorage" below as "the store's current data source".

---

## 1. Guiding principles

1. **Frontend-only, backend-ready.** Build the entire UI against typed mock data. When the
   backend exists, swapping a mock for a real `fetch` must require **zero** changes to any
   component — only the data-source file changes.
2. **Content is data, not markup.** Every piece of copy, every gallery item, service, and
   review is data in `content/` — never inlined in JSX.
3. **One section = one component folder.** The page is a stack of independent sections
   (Hero, About, Services, Gallery, …). Each is self-contained.
4. **Keep it minimal.** No library is added unless a real need exists (see README "omitted").

---

## 2. Folder structure

```
app/
  [locale]/                  # locale segment: /ru (default), /ro, /en
    layout.tsx               # html shell, fonts, nav, footer, providers
    page.tsx                 # the single landing page = composed sections
  globals.css                # Tailwind base + a few global keyframes/vars

components/
  layout/                    # Nav (desktop+mobile), Footer
  sections/                  # Hero, About, Showcase, Services, Gallery,
                             #   Process, Why, Reviews, FooterCTA
  hero/                      # Balloons3D (R3F scene), intro preloader
  chat/                      # ChatWidget, AdminPanel (UI only, mock-backed)
  ui/                        # small shared primitives (Badge, Pill, Section, Lightbox)

content/                     # ⭐ THE BACKEND HANDOFF BOUNDARY ⭐ (+ lib/*Store.ts)
  i18n/
    ru.ts  ro.ts  en.ts      # translation tables (ported from the DC `T` object)
    index.ts                 # locale → table map + getDictionary()
  photos.ts                  # default photo lists (profile / showcase / gallery)
  reviews.ts                 # getReviews() accessor over the built-in testimonials
  services.ts                # services / wedding groups

lib/
  types.ts                   # shared TS interfaces (Review, Conversation, Dictionary…)
  i18n.tsx                   # LocaleProvider / useLocale / useT (+ text-override merge)
  ui.tsx                     # UIProvider (chat-open flag, balloon burst signal)
  auth.ts                    # TEMPORARY client-side admin login (backend swap point)
  theme.ts  utils.ts         # design tokens; formatTime / initials / cn helpers
  # localStorage-backed stores (admin- & visitor-editable, see BACKEND_TODO.md):
  chatStore.ts               #   chat conversations + admin inbox
  photoStore.ts              #   admin-editable site photos (profile/showcase/gallery)
  contentStore.ts            #   admin-editable site text (all copy, per locale)
  reviewStore.ts             #   visitor-submitted reviews

public/
  assets/                    # logo-bb.jpg, nebula-bg.jpg, intro.mp4
  photos/                    # real event photos (profile / showcase / gallery defaults)
```

---

## 3. The data contract (most important section)

Everything dynamic flows through `content/`. Each data module exports **typed** data and,
where relevant, an **async accessor** so the swap to a real API is mechanical.

### Pattern

```ts
// lib/types.ts
export interface Review {
  id: string;
  name: string;
  role: string;
  rating: number;
  text: string;
}

// content/reviews.ts  ← TODAY: mock
import type { Review } from "@/lib/types";

export const reviews: Review[] = [ /* ...mock data... */ ];

// Accessor the UI calls. Backend dev replaces the body only.
export async function getReviews(): Promise<Review[]> {
  return reviews;                       // TODAY: return mock
  // LATER:  return fetch("/api/reviews").then(r => r.json());
}
```

**Rules for the handoff:**
- Components import **`getReviews()`**, never the raw `reviews` array.
- The backend dev changes only the **body** of accessor functions in `content/`.
- Interfaces in `lib/types.ts` are the agreed shape — change them deliberately, together.
- Search marker: every swap point is tagged with a `// BACKEND:` comment.

### Chat & admin (special case)
The chat widget and admin panel are **fully built UI over a shared `localStorage` store**
(`lib/chatStore.ts`). Conversations are **only** the ones visitors start via the chat intake
form — there are no seeded/hardcoded threads. The intake form collects **first name, surname,
phone, and a first message** (all validated per-field, with an inline confirmation on send);
that seeds the conversation with an operator greeting plus the visitor's message. Because the
customer page (`/`) and admin (`/admin-bb`) are separate documents, they sync through
`localStorage` + the browser's cross-tab `storage` event: a customer's new thread/message
appears in the admin inbox live (with a toast + unread badge), and operator replies flow back
to the customer's widget. Message timestamps render in the **viewer's local time**
(`formatTime`, client-only so no hydration mismatch). The backend dev replaces `load`/`save`
in `chatStore.ts` with a real API + websocket/SSE — the component contract (`Conversation[]`
+ `subscribe(cb)`) is untouched. Tagged `// BACKEND:`.

### Admin CMS & visitor reviews (localStorage stores)
Beyond chat, three more stores back live-editable content, all following the same
`load`/`save` + `subscribe(cb)` contract (swap the insides, keep the signatures):
- **`lib/photoStore.ts`** — admin add/replace/delete of site photos (three groups); consumed
  via `useSitePhotos(groupId)`. Picked files are downscaled to base64 data URLs for demo
  persistence (backend uploads the real `File`).
- **`lib/contentStore.ts`** — admin edits to **every string**, per locale, stored as
  dot-path overrides and overlaid on the shipped dictionary by `mergeDictionary()` in the
  i18n provider (includes the contact phone/email).
- **`lib/reviewStore.ts`** — **visitor-submitted reviews** (name, event/role, half-star
  rating in 0.5 steps, text), shown alongside the built-in testimonials. `removeReview(id)`
  is present to back an admin moderation UI once there's a backend.

---

## 4. i18n strategy

- Three locales: **`ru` (default)**, `ro`, `en`. URLs: `/`→ru, `/ro`, `/en`.
- All copy lives in `content/i18n/{ru,ro,en}.ts`, ported directly from the prototype's `T`
  object. Shapes must match across the three files (enforced via a shared TS type).
- Components receive translations via the locale; **no hard-coded user-facing strings.**
- Default locale falls back to `ru` if a key is missing.

---

## 5. Styling conventions

- **Tailwind utility classes** for everything; no inline `style` except truly dynamic values
  (computed positions, animation delays).
- **Design tokens** (the gold/crimson/near-black palette, accent variants) live as CSS
  variables + Tailwind theme extension, not scattered hex codes.
  - Core: `--bb-bg:#08040a`, gold `#e7b24c`, crimson accent `--bb-accent:#b3243a`.
  - Accent themes from the prototype: crimson / purple / gold-green / sakura.
- Fonts: **Cormorant Garamond** (display/serif headings) + **Jost** (body), via `next/font`.
- Animations: prefer **Framer Motion**; keep CSS `@keyframes` only for tiny ambient loops
  (e.g. balloon bob, button pulse).
- **Responsive / mobile compaction (⚠️ desktop is frozen).** The desktop layout is
  considered final — mobile tweaks must **not** change anything at `≥768px`. Two
  desktop-safe levers are used, and any future spacing change should follow them:
  1. **Lower only the `min` of a `clamp()`.** Section paddings/gaps use
     `clamp(min, Xvw, max)`. At desktop widths the value sits on the `vw`/`max` term,
     so the `min` only engages on narrow screens (e.g. `clamp(38px,9vw,140px)` → the
     `38px` only applies below ~778px). Never lower the `vw` or `max` term.
  2. **`md:` overrides restore desktop exactly.** For fixed Tailwind spacing/grids,
     the mobile-first base value is the compact one and the `md:` variant repeats the
     *original* value (`mt-8 md:mt-[50px]`, `grid-cols-2
     md:[grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]`). So `<768px`
     gets tighter spacing / 2-up card grids (gallery, process, services) while
     `≥768px` is byte-for-byte unchanged. The Hero is left untouched (it's `100svh`).

---

## 6. Component conventions

- **TypeScript + function components.** Props are explicit interfaces, no `any`.
- One section per file under `components/sections/`; section reads its data via a `content/`
  accessor (or receives it as props from `page.tsx`).
- Client interactivity (`"use client"`) only where needed: 3D, chat, lightbox, menu, lang
  switch. Keep static sections as server components for performance/SEO.
- File naming: `PascalCase.tsx` for components, `camelCase.ts` for data/utils.

---

## 7. Decision log

Append one line per non-obvious decision. Newest at top.

- **QA hardening pass (5 reports + polish).** After a full-stack QA sweep, applied
  server-side sanitization + length caps + rate limiting on public writes, JWT-gated
  operator chat messages, unguessable conversation/message ids (capability URLs; also
  fixed a latent `ChatMessage.id` PK collision), `asyncHandler` + Prisma-`P2002`→409 so a
  duplicate id can't crash Express, nginx security headers + `charset utf-8`, iOS safe-area
  insets + lazy gallery images, a global error `Toaster` (no more silent write failures),
  and `preload="none"` on the background audio. Details + branch names in `CLAUDE.md`.
- **Backend built; stores now call a real API.** The four `lib/*Store.ts` seams (chat,
  photos, texts, reviews) and `lib/auth.ts` were swapped from `localStorage` to the
  Express/Prisma backend via `lib/api.ts` (REST + SSE), **keeping every exported signature**
  — so the data contract in §3 and the components are untouched. Read-only accessors
  (`content/services.ts`, `content/reviews.ts`) stay frontend-side by design.
- **Mobile compacted without touching desktop.** The desktop layout was signed off as
  final, so the mobile pass only shortens small screens via two provably desktop-safe
  levers (see §5): lowering `clamp()` **minimums** (desktop sits on the `vw`/`max` term)
  and adding `md:` overrides that restore the exact current value at `≥768px` (incl.
  2-up card grids for the gallery, process steps, and services). Verified with headless
  Chrome: desktop (1440px) total + every section height stayed byte-identical (7531px)
  while mobile (390px) dropped ~27% (10710→7830px). **Don't "simplify" these back into
  single unprefixed values — that would change desktop.**
- **Admin moved to its own `/admin-bb` route, behind a temporary client-side login**
  (`lib/auth.ts`). Static/no-backend means any client check is deterrence, not
  security — so `login()` is the documented swap point for real backend auth, and
  `/admin-bb` is the natural path to protect at the host (Vercel/Netlify/Cloudflare
  Access). The public footer no longer links to it; the route is `noindex`
  (`app/admin-bb/layout.tsx` sets `robots: { index: false, follow: false }`).
- **i18n via client-side React context, not next-intl URL routing** — static
  export (`output: 'export'`) cannot run next-intl's locale middleware, and the
  prototype switched language instantly client-side. Copy still lives as typed
  tables in `content/i18n/`; `LocaleProvider` (`lib/i18n.tsx`) holds the active
  locale, persists it to `localStorage`, and exposes `useLocale()`/`useT()`. The
  default locale (RU) is pre-rendered into the static HTML, so SEO is preserved
  for the primary language. Per-locale URLs can be layered on later if needed.
- **Built on Next.js 16 + React 19 + Tailwind v4** — `create-next-app@latest`
  moved past 15; built on current stable. Tailwind v4 tokens live in `@theme`
  inside `globals.css` (no `tailwind.config.js`).
- **Styling is a Tailwind + inline-style hybrid** — Tailwind utilities for layout
  and design tokens; the prototype's tuned gradients/`clamp()`/exact brand hexes
  are kept as inline `style` objects for visual fidelity (relaxes §5's
  "Tailwind for everything").
- **Locale-reactive content renders synchronously from the dictionary** (via
  `useT()`) for SSR/SEO + instant switching; the async `content/*` accessors
  remain the documented backend swap point (a real API would add a data layer,
  e.g. TanStack Query, per README).
- **Scroll reveals use Framer Motion (`components/ui/Reveal.tsx`)** instead of the
  prototype's CSS `animation-timeline: view()` (Chromium-only) for cross-browser
  support.
- **Next.js (static export) over Vite** — public business landing page → SEO + pre-rendered
  HTML matter; Next.js lets the backend dev add API routes later without a framework change.
- **React Three Fiber over raw Three.js** — the prototype manually managed
  `requestAnimationFrame`/cleanup; R3F makes the balloon scene declarative and leak-safe.
- **No component library / no state manager** — custom luxe design + local-only UI state.
- **Mock-data accessors in `content/`** — establishes a single, mechanical swap point so the
  backend handoff touches zero components.

---

## 8. Open questions / TODO before/at handoff

- [ ] Obtain the final curated event photos from the client and set them as the
      `gallery` defaults in `content/photos.ts` (the grid now shows real photos and is
      editable from the admin; it currently defaults to the wedding/Toronto set).
- [ ] Confirm real contact details (phone, email) — currently placeholders; editable
      from the admin (Texts → Footer) but the shipped defaults are still fake.
- [ ] Agree final data shapes in `lib/types.ts` with the backend dev.
- [ ] Implement the backend swaps catalogued in `BACKEND_TODO.md` (auth, chat, photos,
      text content, accessors) — the whole admin is a `localStorage` CMS until then.

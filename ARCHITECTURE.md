# Architecture & Conventions

This document is the technical contract for the Balloons Breeze frontend. It exists so that
**future-you and the backend colleague never have to reverse-engineer a decision.**

- Audience: frontend devs building the UI, and the backend dev who will wire in real data.
- Scope: frontend only. No server logic lives here.

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

content/                     # ⭐ THE BACKEND HANDOFF BOUNDARY ⭐
  i18n/
    ru.ts  ro.ts  en.ts      # translation tables (ported from the DC `T` object)
    index.ts                 # locale → table map + types
  gallery.ts                 # gallery items (currently category placeholders)
  reviews.ts                 # client reviews
  services.ts                # services / wedding groups
  chat.ts                    # mock conversations for chat + admin UI

lib/
  types.ts                   # shared TS interfaces (Review, GalleryItem, Conversation…)
  hooks/                     # useLocale, useLightbox, etc.
  utils.ts                   # formatTime, initials, classnames helper

public/
  assets/                    # logo-bb.jpg, nebula-bg.jpg, intro.mp4
  uploads/                   # real client photos/videos to wire into the gallery
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
form — there are no seeded/hardcoded threads. Because the customer page (`/`) and admin
(`/admin-bb`) are separate documents, they sync through `localStorage` + the browser's
cross-tab `storage` event: a customer's new thread/message appears in the admin inbox live
(with a toast + unread badge), and operator replies flow back to the customer's widget.
The backend dev replaces `load`/`save` in `chatStore.ts` with a real API + websocket/SSE —
the component contract (`Conversation[]` + `subscribe(cb)`) is untouched. Tagged `// BACKEND:`.

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

- **Admin moved to its own `/admin` route, behind a temporary client-side login**
  (`lib/auth.ts`). Static/no-backend means any client check is deterrence, not
  security — so `login()` is the documented swap point for real backend auth, and
  `/admin` is the natural path to protect at the host (Vercel/Netlify/Cloudflare
  Access). The public footer no longer links to it; the route is `noindex`.
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

- [ ] Obtain real event photos from the client, drop them into `frontend/public/uploads/`,
      and wire them into `content/gallery.ts` (replacing the emoji/CSS placeholders). Note:
      the original `uploads/` folder was deleted — it held duplicates of the brand assets,
      not real gallery media.
- [ ] Confirm real contact details (phone, email, Instagram) — currently placeholders.
- [ ] Agree final data shapes in `lib/types.ts` with the backend dev.
- [ ] Decide what the chat/admin becomes (real-time backend vs. contact form) — UI is ready either way.

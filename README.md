# Balloons Breeze — Frontend

Marketing landing site for **Corporation Balloons Breeze**, an event-décor company
(weddings, birthdays, private & corporate events) operating in Moldova.

This repository is the **frontend only**. There is no backend, database, or API layer
yet — all dynamic content (chat, admin inbox, gallery, reviews) is driven by **typed mock
data** designed to be swapped for real data later by the backend team. See
[`ARCHITECTURE.md`](./ARCHITECTURE.md) for the handoff contract.

---

## Stack

| Concern        | Choice                                        | Notes |
|----------------|-----------------------------------------------|-------|
| Language       | **TypeScript**                                | Typed props/interfaces for a clean backend handoff |
| UI library     | **React**                                     | The components (this is "the frontend") |
| Framework      | **Next.js 15 (App Router)**, static export    | Pre-rendered HTML → SEO + fast first paint |
| Styling        | **Tailwind CSS**                              | Replaces the inline `style="..."` strings |
| 3D hero        | **React Three Fiber** + `@react-three/drei`   | Declarative wrapper over the existing Three.js balloons |
| Animation      | **Framer Motion**                             | Scroll reveals, lightbox, hero burst |
| i18n           | **next-intl** (RU / RO / EN)                  | Locale routing; RU is the default |
| Icons          | **lucide-react**                              | Replaces emoji icons |
| Fonts          | **next/font** (Cormorant Garamond + Jost)     | Self-hosted, no layout shift |
| Deploy         | **Vercel** (static export → any static host)  | Frontend ships as plain files |

> **React vs Next.js:** Next.js *is* React — it's React plus routing, build, and
> pre-rendering. We write plain React + TypeScript components throughout; Next.js is just
> the wrapper that makes them a fast, SEO-friendly site.

### Deliberately omitted (for now)
- **No component library** (MUI/Chakra/shadcn) — the design is fully custom; a kit would fight it.
- **No state manager** (Redux/Zustand) — local UI state only; React `useState` is enough.
  When the backend lands, add **TanStack Query** for server state — not before.
- **No backend / DB / API calls** — out of scope for this repo.

---

## Getting started

```bash
# install dependencies
npm install

# run the dev server (http://localhost:3000)
npm run dev

# type-check + lint
npm run lint

# production build (static export to ./out)
npm run build
```

> Requires Node.js 18.18+ (Node 20 LTS recommended).

---

## Project structure

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full layout and rationale. In short:

```
app/                 # Next.js App Router (routes, layouts, locale segments)
components/           # React UI components (one folder per site section)
content/             # Typed mock data — THE backend handoff boundary
  i18n/              # RU / RO / EN translation tables
lib/                 # Helpers, types, hooks
public/assets/       # Logo, nebula background, intro video, real photos
```

---

## Languages

The site is trilingual: **Russian (default)**, **Romanian**, **English**.
All copy lives in `content/i18n/` — never hard-code user-facing strings in components.

---

## Source of the original

This frontend is a rebuild of an earlier prototype built on a custom "DC" React runtime
(`Ballons Breeze.dc.html` + `support.js`). Those files are kept for reference only and are
**not** part of the build.

---

## Documentation

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — folder structure, data-contract for the backend handoff, i18n strategy, conventions, decision log.

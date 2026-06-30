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
| UI library     | **React 19**                                  | The components (this is "the frontend") |
| Framework      | **Next.js 16 (App Router)**, static export    | Pre-rendered HTML → SEO + fast first paint |
| Styling        | **Tailwind CSS v4**                           | Design tokens via `@theme` in `globals.css`; intricate brand gradients kept as inline styles |
| 3D hero        | **React Three Fiber** + `@react-three/drei`   | Declarative wrapper over the original Three.js balloons |
| Animation      | **Framer Motion**                             | Scroll reveals, lightbox, hero burst |
| i18n           | **Client-side React context** (RU / RO / EN)  | Instant switching, persisted to `localStorage`; **not** next-intl URL routing — see below |
| Icons          | **lucide-react**                              | Replaces emoji icons |
| Fonts          | **next/font** (Cormorant Garamond + Jost)     | Self-hosted, no layout shift |
| Deploy         | **static export** → any static host (Vercel, Netlify, S3…) | `next build` emits plain files to `out/` |

> **React vs Next.js:** Next.js *is* React — it's React plus routing, build, and
> pre-rendering. We write plain React + TypeScript components throughout; Next.js is just
> the wrapper that makes them a fast, SEO-friendly site.

> **Why client-side i18n, not next-intl?** Static export (`output: 'export'`) can't run
> next-intl's locale middleware, and the original prototype switched language instantly on
> the client. So copy lives as typed tables in `content/i18n/` and a `LocaleProvider` swaps
> the active locale in place. The default locale (RU) is pre-rendered into the static HTML,
> so SEO is preserved for the primary language. Full rationale in the
> [`ARCHITECTURE.md`](./ARCHITECTURE.md) decision log (§7).

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

> Requires Node.js 20.9+ (Next.js 16). Run all commands from the `frontend/` folder.

---

## Project structure

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full layout and rationale. In short:

```
frontend/
  app/               # Next.js App Router — single route, root layout + providers
  components/        # React UI components (layout, sections, hero, chat, ui)
  content/           # Typed mock data — THE backend handoff boundary
    i18n/            # RU / RO / EN translation tables
  lib/               # Providers (i18n, ui), types, theme tokens, utils
  public/assets/     # Logo, nebula background, intro video
                     # public/uploads/ — drop real event photos here (see ARCHITECTURE §8)
```

---

## Languages

The site is trilingual: **Russian (default)**, **Romanian**, **English**.
All copy lives in `content/i18n/` — never hard-code user-facing strings in components.

---

## Source of the original

This frontend is a rebuild of an earlier prototype built on a custom "DC" React runtime
(`Ballons Breeze.dc.html` + `support.js`). All of its content and logic has been ported
here, and the prototype files have been **removed** from the working tree. They remain in
git history if ever needed: `git show 96bb632:"Ballons Breeze.dc.html"`.

---

## Documentation

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — folder structure, data-contract for the backend handoff, i18n strategy, conventions, decision log.

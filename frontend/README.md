# Balloons Breeze — frontend app

The Next.js app for the Balloons Breeze landing site. This is a **frontend-only**
build: all dynamic content runs on typed mock data designed to be swapped for a
real API later (see the repo-root docs).

**Stack:** Next.js 16 (App Router, static export) · React 19 · TypeScript ·
Tailwind CSS v4 · React Three Fiber · Framer Motion · lucide-react. Trilingual
(RU / RO / EN) via a client-side locale context.

## Commands

```bash
npm install      # install dependencies
npm run dev      # dev server → http://localhost:3000
npm run lint     # ESLint
npm run build    # static export → ./out
```

> Requires Node.js 20.9+.

## Layout

```
app/            # App Router: single route, root layout + <Providers>
components/      # layout/ · sections/ · hero/ (R3F) · chat/ · ui/
content/         # typed mock data + async accessors (the backend boundary)
  i18n/          # RU / RO / EN dictionaries
lib/             # i18n + ui providers, types, theme tokens, utils
public/assets/   # logo, nebula background, intro video
```

## Where to read more

These live at the **repo root** (one level up):

- **`../CLAUDE.md`** — current status, how to run, decisions, open items.
- **`../ARCHITECTURE.md`** — folder structure, the mock-data contract for the
  backend handoff, i18n strategy, styling conventions, and the decision log.
- **`../README.md`** — stack rationale.

### Backend handoff in one line

Components never read raw mock arrays — they go through the async accessors in
`content/*` (tagged `// BACKEND:`). Swapping in a real API means changing only
those function bodies; the typed shapes live in `lib/types.ts`.

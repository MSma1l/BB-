# CLAUDE.md — Live handoff note

> Read this first. It tells you **where the project is right now** and **what to do next**.
> For the *why* behind decisions, see [`README.md`](./README.md) and
> [`ARCHITECTURE.md`](./ARCHITECTURE.md).

---

## What this project is

Frontend-only rebuild of **Balloons Breeze** — a trilingual (RU/RO/EN) marketing landing
site for an event-décor company. **No backend, no DB, no API calls** — the whole UI runs on
typed mock data so a colleague can wire in real data later. The frontend dev's job is pure
UI/UX.

Agreed stack: **React + Next.js 15 (App Router, static export) + TypeScript + Tailwind CSS**,
with React Three Fiber (3D balloon hero), Framer Motion, next-intl (i18n), lucide-react,
next/font. Full rationale in `README.md`.

---

## ⏱️ Current status (as of this handoff)

- ✅ Project analyzed; stack chosen; rationale documented.
- ✅ `README.md` and `ARCHITECTURE.md` written.
- ✅ **App scaffolded and built** in `frontend/` (see below). All sections, the
  R3F balloon hero, gallery + lightbox, chat + admin (UI-only), and trilingual
  i18n are implemented. `npm run build` produces a clean static export to
  `frontend/out/`, verified visually (desktop + mobile, RU/RO).

**The site is feature-complete as a frontend. Next work is content/polish (real
photos) and the backend handoff (wire the `content/` accessors to an API).**

---

## ▶️ How to run (in `frontend/`)

```bash
cd frontend
npm install        # if node_modules is missing
npm run dev        # http://localhost:3000
npm run build      # static export → frontend/out/
```

## ▶️ Remaining / next steps

1. **Real media** — replace the gallery's CSS-pattern placeholders with the
   photos in `frontend/public/uploads/` (TODO in `ARCHITECTURE.md §8`).
2. **Real contact details** — phone/email/Instagram are still placeholders
   (search `+37360000000`, `hello@balloonsbreeze.md`).
3. **Backend handoff** — the only swap points are the async accessors in
   `frontend/content/*` (tagged `// BACKEND:`); see `ARCHITECTURE.md §3`.

---

## ⚙️ Decisions made during the build (differ slightly from original plan)

1. **Location:** clean **`frontend/`** subfolder (docs stay at repo root).
2. **Package manager:** **npm**.
3. **Mock accessors:** **async** (`getReviews()` etc.), as recommended.
4. **Next.js 16, not 15** — `create-next-app@latest` now ships Next 16 + React 19
   + Tailwind v4. Built on it (latest stable); no blockers.
5. **i18n is client-side context, not next-intl URL routing** — static export
   can't run next-intl middleware, and the prototype switched language instantly
   client-side. Copy still lives as typed data in `content/i18n/`; switching is
   instant and persists to `localStorage`. The default locale (RU) is what gets
   pre-rendered into the static HTML for SEO. See `ARCHITECTURE.md §7` decision log.
6. **Styling is a Tailwind-v4 + inline-style hybrid** — Tailwind for layout +
   design tokens (`@theme` in `globals.css`); the prototype's intricate gradients
   / `clamp()` values are kept as inline styles for fidelity.

---

## 📁 Reference files (the original prototype — DO re-read these)

The site was first built on a custom "DC" React runtime. These are **reference only** (not
part of the new build), but they contain all the real content and logic to port:

- **`Ballons Breeze.dc.html`** — source: HTML template + `<script type="text/x-dc">` with the
  `Component extends DCLogic` class. Contains:
  - The `T` object → full RU/RO/EN copy for every section.
  - Three.js balloon hero logic (`initBalloons`, click-to-burst `_spawn`).
  - Chat + admin panel logic (was `localStorage`-based; becomes mock data here).
  - Props: `defaultLang`, `balloons` (on/off), `accent` (crimson/purple/gold-green/sakura).
- **`Ballons Breeze.html`** (7 MB) — compiled standalone build (reference/preview only).
- **`support.js`** — the DC runtime. Reference only; not reused.
- **`Canvas.dc.html`** — empty DC scaffold.

### Media to reuse
- `assets/` — `logo-bb.jpg`, `nebula-bg.jpg`, `intro.mp4`.
- `uploads/` — real client photos/video (2026-06-29) to wire into the gallery (replacing
  emoji placeholders).
- `screenshots/` — rendered previews of the original for visual reference.

---

## ⚠️ Known placeholders (not real yet)

- Contact details are fake: phone `+37360000000`, email `hello@balloonsbreeze.md`, Instagram link.
- Gallery + About images are CSS-pattern placeholders with emoji icons (real media in `uploads/`).
- Chat/admin had no real persistence — localStorage only in the prototype.

---

## 🚚 Moving to a new folder?

Bring **all** of: the two `.dc.html` files, `support.js`, `assets/`, `uploads/`,
`screenshots/`, and the three `.md` files (`CLAUDE.md`, `README.md`, `ARCHITECTURE.md`).
With those, a fresh session can fully reconstruct the project context from this file.

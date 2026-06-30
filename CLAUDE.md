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

Stack (as built): **React 19 + Next.js 16 (App Router, static export) + TypeScript +
Tailwind CSS v4**, with React Three Fiber (3D balloon hero), Framer Motion, lucide-react,
next/font, and a **client-side React context for i18n** (RU/RO/EN). Full rationale in
`README.md`; the deviations from the original plan are in the decision log below and in
`ARCHITECTURE.md §7`.

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

## 📁 Original prototype (removed — see git history)

The site was first built on a custom "DC" React runtime. Those files
(`Ballons Breeze.dc.html` — the source with the `T` copy table + Three.js balloon
/ chat / admin logic; `Ballons Breeze.html` — 7 MB compiled build; `support.js` —
the DC runtime; `Canvas.dc.html`) have been **deleted now that the rebuild is
complete**. Everything in them was ported into `frontend/`. If you ever need to
cross-check the original copy or behaviour, restore from git:

```bash
git show 96bb632:"Ballons Breeze.dc.html" > prototype.html   # the source
```

Brand media (`logo-bb.jpg`, `nebula-bg.jpg`, `intro.mp4`) now lives only in
`frontend/public/assets/`. `screenshots/` (rendered previews of the original)
is kept at the repo root for visual reference.

---

## ⚠️ Known placeholders (not real yet)

- Contact details are fake: phone `+37360000000`, email `hello@balloonsbreeze.md`, Instagram link.
- Gallery + About images are CSS-pattern placeholders with emoji icons.
  **There is no real gallery media yet** — the old `uploads/` folder turned out to
  be byte-identical copies of the brand logo/background/intro, not client event
  photos, so it was removed. Real event photos still need to be supplied, dropped
  into `frontend/public/uploads/`, and wired into `content/gallery.ts`.
- Chat/admin had no real persistence — mock React state only (localStorage in the prototype).

---

## 🚚 Moving to a new folder?

Bring `frontend/` and the three root `.md` files (`CLAUDE.md`, `README.md`,
`ARCHITECTURE.md`); `screenshots/` is optional reference. With those, a fresh
session can fully reconstruct the project context from this file.

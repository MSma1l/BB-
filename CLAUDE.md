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
- ❌ **Next.js project NOT scaffolded yet.** This folder currently contains only the docs
  and the original prototype (below). `create-next-app` has not been run.

**The very next action is to scaffold the Next.js app.**

---

## ▶️ Next steps (in order)

1. **Resolve the 2 open decisions** below with the user.
2. **Scaffold** Next.js 15 (App Router, TypeScript, Tailwind, ESLint).
3. **Design tokens** → port palette/fonts into Tailwind config + `globals.css`.
4. **i18n + content** → port the `T` table (RU/RO/EN) + data arrays into `content/` with types.
5. **Build sections top-to-bottom:** Nav → Hero (R3F balloons) → About → Showcase →
   Services → Gallery (+lightbox) → Process → Why → Reviews → Footer/CTA → Chat + Admin (UI only).
6. Wire `assets/` + `uploads/`, run dev server, screenshot to verify.

See `ARCHITECTURE.md §2` for the target folder structure and `§3` for the mock-data contract.

---

## ❓ Open decisions (ask the user before scaffolding)

1. **Scaffold location** — into **this folder** (docs at repo root) or a clean `frontend/` subfolder?
   *Leaning: this folder.*
2. **Package manager** — npm (default) / pnpm / yarn? *Leaning: npm.*
3. **Mock accessor style** — `ARCHITECTURE.md §3` proposes **async** accessors
   (`getReviews()`) even for mock data, so the backend swap touches zero components.
   Recommended; confirm the user is happy with this vs. plain sync arrays.

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

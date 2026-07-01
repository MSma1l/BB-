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
  R3F balloon hero, real-photo gallery + lightbox, the chat widget, the admin
  **CMS** (messages / photos / texts), visitor-submitted reviews, and trilingual
  i18n are implemented. `npm run build` produces a clean static export to
  `frontend/out/`, verified visually (desktop + mobile, RU/RO).
- ✅ **Mobile compaction pass** (branch `mobile-responsive`): small screens are
  ~27% shorter (tighter section spacing + 2-up card grids for gallery / process /
  services) while the **desktop layout is provably unchanged** (see the
  desktop-frozen convention in `ARCHITECTURE.md §5` — do not collapse the
  `clamp()` mins or `md:` overrides back to single values).

**The site is feature-complete as a frontend. Next work is real content (final
curated gallery photos + real contact details) and the backend handoff (replace
the four `localStorage` stores + `content/` accessors with a real API — all
catalogued in [`BACKEND_TODO.md`](./BACKEND_TODO.md)).**

- ✅ **Real backend built** in `backend/` (Node 20 + Express + TypeScript +
  Prisma + PostgreSQL). JWT admin auth (bcrypt-hashed password seeded from env),
  chat + admin inbox with **SSE** realtime, photo uploads (multer → disk volume),
  per-locale editable texts, and visitor reviews. Frozen contract in
  `backend/API_CONTRACT.md`; full docs in [`docs/backend/`](./docs/backend/).
- ✅ **Frontend wired to the API** — `frontend/lib/{auth,chatStore,photoStore,contentStore,reviewStore}.ts`
  now call the backend via `frontend/lib/api.ts` (cache+revalidate + SSE),
  keeping every exported signature unchanged (the golden rule). Read-only
  accessors (`content/services.ts`, `content/reviews.ts`) intentionally stay
  frontend-side (they read the shipped dictionary; editing flows via Texts).
- ✅ **Dockerized** — `docker compose up --build` from repo root runs `db`
  (postgres) + `backend` + `web` (nginx serving the static frontend and
  reverse-proxying `/api` + `/uploads` to the backend, single origin). Config in
  root `.env` / `.env.example`. **Not yet run live against Postgres in-repo**
  (code compiles clean; run it on a Docker host). Admin: `/admin-bb`, default
  `admin` / `bbreeze-admin` (change `ADMIN_*` in `.env` before deploy).

---

## ▶️ How to run (in `frontend/`)

```bash
cd frontend
npm install        # if node_modules is missing
npm run dev        # http://localhost:3000
npm run build      # static export → frontend/out/
```

## ▶️ Remaining / next steps

1. **Real media** — the About (profile carousel), Showcase strip, and **gallery
   grid** all now use real photos in `frontend/public/photos/` and are editable
   from the admin. Supply the final curated portfolio set for the gallery when
   ready (defaults in `content/photos.ts`, or add via the admin). TODO in
   `ARCHITECTURE.md §8`.
2. **Real contact details** — phone/email are still placeholders
   (search `+37360000000`, `hello@balloonsbreeze.md`; editable in Texts → Footer,
   but the shipped defaults are fake).
3. **Backend handoff** — swap points are tagged `// BACKEND:` in code and fully
   catalogued in **[`BACKEND_TODO.md`](./BACKEND_TODO.md)** (auth, chat store,
   photo uploads, text overrides, visitor reviews, content accessors, real
   media/contacts). See `ARCHITECTURE.md §3`.

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

- Contact details are fake: phone `+37360000000`, email `hello@balloonsbreeze.md`.
- The **gallery grid** now shows **real photos** (an editable `gallery` photo group,
  defaulting to the wedding/Toronto set in `frontend/public/photos/`); it's managed
  from the admin like About/Showcase. Supply the final curated portfolio set when
  ready (defaults in `content/photos.ts`, or add via the admin).
- Everything dynamic persists to **`localStorage`** (real cross-tab sync, no
  server) via **four stores**, each with a `load`/`save` + `subscribe(cb)`
  contract the backend swaps behind:
  - `lib/chatStore.ts` — chat conversations + admin inbox.
  - `lib/photoStore.ts` — admin-editable site photos.
  - `lib/contentStore.ts` — admin-editable site text (all copy, per locale).
  - `lib/reviewStore.ts` — visitor-submitted reviews.
  This is demo-grade persistence (per-browser only) — the backend swap is in
  `BACKEND_TODO.md`.
- Admin lives at its own route **`/admin-bb`** behind a **temporary client-side
  login** (`frontend/lib/auth.ts`, default `admin` / `bbreeze-admin`). This is
  deterrence, not real security — credentials ship in the bundle. The footer no
  longer links to it. **Backend swap:** replace `login()` with a real auth API
  (and/or protect `/admin-bb` at the host with Vercel/Netlify/Cloudflare Access).
- The admin is a **dashboard** (`components/admin/AdminShell.tsx`) with three
  sections — effectively a **full CMS** over `localStorage` (BACKEND makes it
  server-side + multi-device):
  - **Messages** — per-customer inbox. Visitors open a thread via the chat
    intake form (name + surname + phone + a first message, all validated); new
    customer activity fires a toast + unread badge. Conversations are **only**
    ones real visitors start (no seeded demos). Timestamps show in the viewer's
    local time (`formatTime`).
  - **Photos** — **add / replace / delete** images in three groups: `profile`
    (About carousel), `showcase` (Showcase strip), `gallery` (portfolio grid).
    Changes persist and reflect on the site live via `useSitePhotos`; "Reset"
    restores defaults. Store: `lib/photoStore.ts`; defaults in `content/photos.ts`.
  - **Texts** — edit **every string** on the site, per language (RU/RO/EN tabs),
    including contact phone/email. Overrides are overlaid on the shipped dictionary
    by the i18n provider and shown live. Store: `lib/contentStore.ts`
    (`mergeDictionary` + dot-path overrides keyed by locale).
- **Visitor reviews** (public site, not admin) — anyone can leave a review from the
  Reviews section: name, event/role, a **half-star rating (0.5 steps, 1–5)**, and
  text. Shown alongside the built-in testimonials; stored as written (not
  translated), so identical across locales. Store: `lib/reviewStore.ts`
  (`removeReview` is ready to back an admin moderation UI once there's a backend).

---

## 🚚 Moving to a new folder?

Bring `frontend/` and the three root `.md` files (`CLAUDE.md`, `README.md`,
`ARCHITECTURE.md`); `screenshots/` is optional reference. With those, a fresh
session can fully reconstruct the project context from this file.

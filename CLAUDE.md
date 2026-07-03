# CLAUDE.md — Live handoff note

> Read this first. It tells you **where the project is right now** and **what to do next**.
> For the *why* behind decisions, see [`README.md`](./README.md),
> [`ARCHITECTURE.md`](./ARCHITECTURE.md), and the backend docs in
> [`docs/backend/`](./docs/backend/).

---

## What this project is

**Balloons Breeze** — a trilingual (RU/RO/EN) marketing site for an event-décor
company. It is now a **full-stack app**:

- **`frontend/`** — React 19 + Next.js 16 (App Router, **static export**) +
  TypeScript + Tailwind CSS v4, with React Three Fiber (3D balloon hero), Framer
  Motion, lucide-react, next/font, and **client-side React-context i18n** (RU/RO/EN).
- **`backend/`** — Node 20 + Express + TypeScript + Prisma + PostgreSQL. JWT admin
  auth (bcrypt, seeded from env), chat + admin inbox with **SSE** realtime, photo
  uploads (multer → sharp/WebP → disk volume), per-locale editable texts, and
  moderated visitor reviews. Frozen contract in `backend/API_CONTRACT.md`.
- **Deploy** — `docker compose` runs `db` (postgres) + `backend` + `web` (nginx
  serving the static frontend and reverse-proxying `/api` + `/uploads` to the
  backend, single origin). Host TLS proxy example in `deploy/`.

> **History:** this began as a frontend-only rebuild against `localStorage` mocks.
> The backend has since been built and the frontend wired to it — the four
> `lib/*Store.ts` modules now call the API via `frontend/lib/api.ts`, keeping
> their exported signatures unchanged (the "golden rule"). `README.md` /
> `ARCHITECTURE.md` still carry some frontend-only framing; treat this file and
> `docs/backend/` as the current truth. `BACKEND_TODO.md` is **largely done**
> (kept as historical context — see its header).

---

## ⏱️ Current status

- ✅ Frontend feature-complete (all sections, R3F hero, gallery + lightbox, chat
  widget, admin CMS, visitor reviews, trilingual i18n). `npm run build` → clean
  static export.
- ✅ Backend built + frontend wired to it (REST + SSE, JWT auth, uploads,
  moderation). Backend + frontend unit tests green (`vitest`).
- ✅ Dockerized (root `docker-compose.yml`; prod/server variants + nginx configs).
- ✅ **QA hardening pass (5 reports + polish) applied** — see below.

### QA hardening applied (branches all merged to `main`)
| Area | What changed |
|------|--------------|
| Desktop security (`qa1-backend-security`) | Server-side HTML sanitization (`backend/src/sanitize.ts`) on reviews + conversations; nginx security headers (`frontend/nginx.conf`, `deploy/nginx-host.conf.example`). |
| Mobile (`qa1-mobile-fixes`) | iOS `env(safe-area-inset-*)` on the fixed FABs; `loading="lazy"` on the gallery; `touch-action: manipulation`. |
| Chat (`qa3-chat-security`) | Operator messages require admin JWT (`optionalAdmin`); empty/oversize message validation; per-minute chat rate limiter; unguessable conversation/message ids (also fixed a latent `ChatMessage.id` PK collision); send/submit debounce. |
| Backend resilience (`qa4-backend-resilience`) | `asyncHandler` + Prisma `P2002`→409 so a duplicate id no longer crashes the process; `unhandledRejection` safety net; `x-powered-by` off. |
| Multilingual (`qa5-charset`) | `charset utf-8` on text responses. |
| Polish (`polish-error-toasts`, `optimize-mobile-assets`) | Global `Toaster` — failed chat/review writes revert the optimistic item and notify the user (no more silent fail); background music `preload="none"` (defers the 7 MB track). |

---

## ▶️ How to run

**Frontend only (UI work):**
```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
npm run build      # static export → frontend/out/
npx vitest run     # unit tests
```

**Full stack (Docker, from repo root):**
```bash
cp .env.example .env      # set ADMIN_*, JWT_SECRET, DB creds before real use
docker compose up --build # db + backend + web (nginx) on one origin
```

**Backend only:**
```bash
cd backend
npm install
npm run dev        # tsx watch (needs DATABASE_URL + JWT_SECRET)
npx vitest run     # unit tests
```
Admin panel: `/admin-bb`, default `admin` / `bbreeze-admin` — **change `ADMIN_*`
in `.env` before deploying.**

---

## ▶️ Remaining / next steps

1. **Real media** — About carousel, Showcase, and gallery use real photos in
   `frontend/public/photos/` and are admin-editable. Supply the final curated
   portfolio set when ready (defaults in `content/photos.ts` **and** the mirror in
   `backend/src/constants.ts` `PHOTO_DEFAULTS`, which the DB seed writes in).
2. **Verify contact details** — the shipped copy now uses real-looking contacts
   (`+37376616384`, `balloonsbreeze@gmail.com`); confirm they're final. Editable
   in admin → Texts → Footer.
3. **Run live against Postgres** — code + tests are green; do a real
   `docker compose up` on a host and smoke-test chat/uploads/moderation.
4. **Deferred asset optimization (QA-1 mobile MOB-2)** — static `/photos/*.jpg`
   are **not** converted to WebP (the DB seed writes those exact paths, so renaming
   would break live serving for no gain) and `srcset` isn't feasible under
   `output: export` + `images.unoptimized`; the 4.6 MB intro video is core brand
   media. Revisit only with a real image pipeline / CDN.
5. **Social/messenger links** — intentionally **omitted** by owner decision.

---

## ⚙️ Key conventions (don't regress these)

- **Golden rule:** the `frontend/lib/*Store.ts` exported signatures are the
  component contract — change bodies, not shapes. Data shapes live in
  `frontend/lib/types.ts`; the backend mirrors them.
- **Desktop layout is frozen** — mobile tweaks must not change ≥768px. Use the two
  desktop-safe levers in `ARCHITECTURE.md §5` (lower `clamp()` *mins* only; `md:`
  overrides restore desktop). Don't collapse them back to single values.
- **i18n:** all user-facing copy lives in `content/i18n/{ru,ro,en}.ts` (all three
  implement the `Dictionary` type — the compiler keeps them in sync). No hard-coded
  strings; RU is the pre-rendered default + fallback.
- **Security (from QA):** never trust client input — the backend sanitizes + length-
  caps + rate-limits public writes, gates operator messages behind JWT, and wraps
  async handlers so DB errors become clean HTTP (not crashes). Keep new public
  endpoints to the same pattern.

---

## 📁 Original prototype (removed — see git history)

The site was first built on a custom "DC" React runtime (`Ballons Breeze.dc.html`
+ `support.js` etc.), since deleted. Everything was ported into `frontend/`. To
cross-check the original copy/behaviour, restore from git:

```bash
git show 96bb632:"Ballons Breeze.dc.html" > prototype.html
```

Brand media (`logo-bb.jpg`, `nebula-bg.jpg`, `intro.mp4`, `Moby-Flower.mp3`) lives
in `frontend/public/assets/`. `screenshots/` (previews of the original) is kept at
the repo root for reference.

---

## 🚚 Moving to a new folder?

Bring `frontend/`, `backend/`, `docs/`, `deploy/`, the root `docker-compose*.yml` +
`.env.example`, and the root `.md` files (`CLAUDE.md`, `README.md`,
`ARCHITECTURE.md`, `BACKEND_TODO.md`). With those, a fresh session can reconstruct
the full project context from this file.

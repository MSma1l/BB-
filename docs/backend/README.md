# Balloons Breeze — Backend & Dockerization

This folder documents the **real backend** for Balloons Breeze and how the whole
app is wired together and run with Docker. The site was originally a
frontend-only static export backed by browser `localStorage`; this effort
replaces those mocks with a real API without changing the UI (the "golden rule"
from [`../../BACKEND_TODO.md`](../../BACKEND_TODO.md): keep the frontend function
signatures and data shapes, swap only the internals).

## What the backend is

A small, self-contained API service that provides everything the admin CMS and
the public site need:

- **Admin auth** — JWT access token. Login returns a Bearer token; all admin
  routes are protected. The admin password is bcrypt-hashed and seeded from env.
- **Chat conversations + admin inbox** — visitors start threads, the admin
  replies, with **SSE** (Server-Sent Events) for realtime updates.
- **Photo uploads** — `multer` writes files to a disk volume, served at
  `/uploads`; three editable photo groups (`profile`, `showcase`, `gallery`).
- **Per-locale editable site text** — dot-path text overrides per locale
  (RU/RO/EN), overlaid on the shipped dictionary by the frontend.
- **Visitor reviews** — public submission + admin moderation delete.

The full endpoint contract lives in [`../../backend/API_CONTRACT.md`](../../backend/API_CONTRACT.md)
(the frozen source of truth) and is summarized in [`API.md`](./API.md).

## Stack

| Layer | Choice |
|---|---|
| Runtime | Node 20 |
| Web framework | Express 4 (TypeScript) |
| ORM | Prisma 6 |
| Database | PostgreSQL |
| Auth | JWT (`jsonwebtoken`) + `bcryptjs` password hashing |
| Validation | `zod` |
| Uploads | `multer` (disk storage) |
| Realtime | Server-Sent Events (native, no extra dep) |
| Frontend | React 19 + Next.js 16 static export (unchanged UI) |
| Reverse proxy | nginx (serves static frontend, proxies `/api` + `/uploads`) |
| Orchestration | Docker Compose (`db`, `backend`, `web`) |

## High-level architecture

Single origin: the browser only ever talks to `web` (nginx). nginx serves the
static frontend and reverse-proxies `/api` and `/uploads` to the backend, so
there is **no CORS** in production.

```
                    ┌──────────────────────────────────────────────┐
   Browser  ─────▶  │  web  (nginx, port :8080 → WEB_PORT)          │
   (:8080)          │   • serves static Next.js export (frontend)   │
                    │   • proxies /api      ─────────┐              │
                    │   • proxies /uploads  ───────┐ │              │
                    └──────────────────────────────┼─┼──────────────┘
                                                    │ │
                                                    ▼ ▼
                                     ┌───────────────────────────────┐
                                     │  backend (Express, :4000/PORT)│
                                     │   • /api/* routes             │
                                     │   • SSE streams               │
                                     │   • /uploads static files     │
                                     └───────┬───────────────┬───────┘
                                             │               │
                              DATABASE_URL   │               │  disk volume
                                             ▼               ▼
                                   ┌──────────────────┐  ┌──────────────┐
                                   │  db (PostgreSQL) │  │  UPLOAD_DIR  │
                                   │  Prisma schema   │  │  /uploads    │
                                   └──────────────────┘  └──────────────┘
```

- `web → backend`: nginx forwards `/api` and `/uploads`. SSE streams pass through
  with buffering disabled (`X-Accel-Buffering: no`).
- `backend → db`: Prisma client over `DATABASE_URL`.
- `backend → volume`: uploaded images persist on a mounted volume
  (`UPLOAD_DIR`, default `uploads`) so they survive container restarts.

## The docs in this folder

| Doc | What it covers |
|---|---|
| [`RUN.md`](./RUN.md) | Running the stack: Docker Compose and local dev, plus troubleshooting. |
| [`API.md`](./API.md) | Readable endpoint reference (auth/public split, SSE, error shape). |
| [`ADMIN.md`](./ADMIN.md) | **Admin access guide** — URL, default credentials, JWT, security warnings. |
| [`ENV.md`](./ENV.md) | Every environment variable, with defaults and secret flags. |
| [`PLAN.md`](./PLAN.md) | Goal, decision log, build breakdown, remaining work. |

## Project status — done vs. remaining

Done:

- [x] Prisma schema modelling `AdminUser`, `Conversation`, `ChatMessage`,
      `PhotoGroup`, `TextOverride`, `Review` (mirrors `frontend/lib/types.ts`).
- [x] Express app (`backend/src/app.ts`) with health check, JSON body limit,
      `/uploads` static serving, domain routers, 404 + central error handler.
- [x] JWT auth: `POST /api/admin/login`, `GET /api/admin/me`, `requireAdmin`
      middleware, bcrypt password compare.
- [x] Idempotent seed (`backend/src/seed.ts`) — upserts the admin from env on
      every start and seeds the three photo groups if missing.
- [x] Conversations router with SSE (`/api/conversations/stream`).
- [x] Photos router: get/set/reset per group + multipart upload + SSE.
- [x] Texts router: get all / per-locale, set/clear one path, reset locale + SSE.
- [x] Reviews router: public list/create, admin delete + SSE.
- [x] Typed, fail-fast env config (`backend/src/env.ts`).
- [x] Frozen API contract (`backend/API_CONTRACT.md`).
- [x] Frontend rewired — the four `lib/*Store.ts` + `lib/auth.ts` now call the
      API (via `lib/api.ts`) with a cache+revalidate + SSE pattern, signatures
      unchanged (the golden rule). Frontend `npm run build` passes.
- [x] Docker artifacts committed — `docker-compose.yml` (`db` / `backend` /
      `web`), backend `Dockerfile` + entrypoint, `web` (nginx) image + config,
      root `.env` / `.env.example`.

Remaining / in progress (see [`PLAN.md`](./PLAN.md)):

- [ ] Real media (final curated gallery photos) and real contact details
      (phone/email are still placeholders `+37360000000` / `hello@balloonsbreeze.md`).
- [ ] Optional future work: move read-only content accessors
      (`content/services.ts`, `content/reviews.ts`) server-side; add a review
      moderation UI (the `approved` flag + `DELETE /api/reviews/:id` already
      support it); edge-protect `/admin-bb`.

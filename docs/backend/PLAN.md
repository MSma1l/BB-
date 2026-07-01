# Work Plan & Decision Log

## Goal

Turn Balloons Breeze from a frontend-only static site (backed by browser
`localStorage`) into a real, deployable app with a proper backend and database —
**without changing the UI**. The guiding constraint is the "golden rule" from
[`../../BACKEND_TODO.md`](../../BACKEND_TODO.md): keep the frontend's function
signatures and the frozen data shapes in `frontend/lib/types.ts`; swap only the
internals of the four `lib/*Store.ts` files and `lib/auth.ts`. Everything is
coded against the frozen contract in
[`../../backend/API_CONTRACT.md`](../../backend/API_CONTRACT.md).

## Decisions

| Decision | Why |
|---|---|
| **Node 20 + Express + TypeScript** | Small, familiar, matches the frontend's TS toolchain; low ceremony for a handful of REST routes. |
| **Prisma + PostgreSQL** | Typed schema that mirrors `frontend/lib/types.ts`; real relational store for conversations/messages; easy migrations via `prisma db push`. |
| **JWT access-token auth** | Stateless, simple to protect admin routes with one `requireAdmin` middleware; token stored client-side and sent as `Bearer`. Replaces the old in-bundle credential check. |
| **bcrypt password, seeded from env** | No plaintext secrets in code or DB; the idempotent seed re-syncs the admin password from `ADMIN_PASSWORD` on every start. |
| **SSE for realtime** | Chat inbox, live photo/text refresh, and reviews need push. SSE is one-way server→client (all we need), needs no extra dependency, and survives proxies with a heartbeat + `X-Accel-Buffering: no`. The frontend `subscribe(cb)` just re-fetches on each event. |
| **Single-origin nginx proxy** | `web` (nginx) serves the static frontend and reverse-proxies `/api` and `/uploads` to the backend, so the browser talks to one origin — **no CORS** in production. |
| **Uploads on a disk volume** | `multer` writes images to `UPLOAD_DIR`, served at `/uploads`; the directory is a mounted volume so files persist across restarts. (Cloud object storage remains a future option.) |
| **Read-only content stays frontend-side** | `content/services.ts` and `content/reviews.ts` read the shipped i18n dictionary; editable copy already flows through the Texts override API, so porting the whole dictionary server-side adds no value now. Documented as optional future work. |
| **Docker Compose orchestration** | One command (`docker compose up --build`) brings up `db` + `backend` + `web`; config centralized in root `.env`. |

## Build breakdown (parallel subagents)

The work was split into independent tracks so it could be built quickly in
parallel, each coding against the frozen API contract:

1. **Backend routes** — Prisma schema + seed, Express app, JWT auth middleware,
   and the five domain routers (auth, conversations, photos, texts, reviews)
   with SSE and zod validation. (This is what exists in `backend/src/*` today.)
2. **Frontend wiring** — rewire `lib/auth.ts` and the four `lib/*Store.ts` to
   call the API while preserving every exported signature and return shape;
   swap `fileToScaledDataUrl` for a real multipart `uploadPhoto`; turn
   `subscribe(cb)` into an `EventSource` over the SSE streams.
3. **Docker** — backend `Dockerfile`, `web` (nginx) image + proxy config,
   `docker-compose.yml` (`db`/`backend`/`web`), and root `.env` / `.env.example`.
4. **Docs** — this `docs/backend/` set (index, run, API, admin, env, plan).

## Status

Done: the backend service (`backend/src/*`), Prisma schema + idempotent seed,
JWT auth, all five routers with SSE, typed fail-fast env config, and the frozen
API contract. See the checklist in [`README.md`](./README.md).

## Remaining / next steps

> Frontend rewire and Docker artifacts are **done** (see the checklist in
> [`README.md`](./README.md)). What's left is real content + hardening, plus a
> live end-to-end run (`docker compose up --build`) on a machine with Docker —
> the code compiles clean (backend `tsc`, frontend `next build`) but the stack
> has not yet been run against a live Postgres in this build environment.

1. **Verify each store against the live API** (auth → chat → photos → texts →
   reviews) once the stack is running, confirming signatures behave unchanged.
2. **Real content:** supply the final curated gallery photos and replace the
   placeholder contact details (phone `+37360000000`, email
   `hello@balloonsbreeze.md`).
4. **Optional / future:**
   - Move the read-only content accessors (`content/services.ts`,
     `content/reviews.ts`) server-side (or fold them into the Texts store).
   - Add a **review moderation UI** — the `approved` flag and
     `DELETE /api/reviews/:id` already support approve/reject-before-publish.
   - **Edge-protect `/admin-bb`** at the host (Vercel/Netlify/Cloudflare Access)
     as defense in depth on top of the JWT auth.
   - Consider cloud object storage for uploads and operator push/email/Telegram
     notifications for new chat activity.

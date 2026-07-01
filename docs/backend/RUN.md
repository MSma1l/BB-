# Running Balloons Breeze

Two ways to run: the **full stack with Docker Compose** (recommended — mirrors
production, single origin, no CORS) or **local dev without Docker** (fastest
edit/reload loop while building).

See [`ENV.md`](./ENV.md) for every variable and [`ADMIN.md`](./ADMIN.md) for how
to reach the admin once it is up.

---

## A. Full stack via Docker Compose

Runs three services — `db` (PostgreSQL), `backend` (Express), `web` (nginx
serving the static frontend and proxying `/api` + `/uploads`).

**Prerequisites:** Docker (with Compose v2).

```bash
# from the repo root
cp .env.example .env          # then edit secrets (see ENV.md / ADMIN.md)
docker compose up --build
```

Then open:

- App: **http://localhost:8080** (host port comes from `WEB_PORT`, default `8080`)
- Admin: **http://localhost:8080/admin-bb** (default `admin` / `bbreeze-admin` —
  change it, see [`ADMIN.md`](./ADMIN.md))
- Health: **http://localhost:8080/api/health** → `{ "ok": true }`

On start the backend applies the Prisma schema and runs the **idempotent seed**
(`backend/src/seed.ts`): it upserts the admin user from `ADMIN_USERNAME` /
`ADMIN_PASSWORD` and seeds the three photo groups if they are missing. Uploaded
images live on a mounted volume (`UPLOAD_DIR`) and survive restarts.

To stop / reset:

```bash
docker compose down           # stop
docker compose down -v        # stop AND wipe the db + uploads volumes
```

---

## B. Local dev without Docker

Run Postgres yourself, then the backend and frontend as separate processes.

### 1. Start a local PostgreSQL

Any local Postgres works. Point `DATABASE_URL` at it, e.g.:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/balloons?schema=public"
```

(Quick option: `docker run --name bb-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=balloons -p 5432:5432 -d postgres:16`.)

### 2. Backend (port 4000)

```bash
cd backend
npm install
npx prisma db push     # create tables from prisma/schema.prisma
npm run seed           # seed admin user + photo groups
npm run dev            # tsx watch → http://localhost:4000
```

Useful scripts (`backend/package.json`): `dev`, `build`, `start`,
`prisma:generate`, `db:push`, `seed`, `typecheck`.

Verify: `curl http://localhost:4000/api/health` → `{"ok":true}`.

### 3. Frontend (port 3000)

Point the frontend at the backend via `NEXT_PUBLIC_API_URL`:

```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:4000/api npm run dev   # http://localhost:3000
```

In dev the browser calls the backend directly, so the backend's `CORS_ORIGIN`
must allow the frontend origin (default `*` allows everything — fine for dev).
In production nginx makes everything same-origin, so CORS is a non-issue.

Admin in dev: **http://localhost:3000/admin-bb**.

---

## Troubleshooting

**Database not ready / connection refused on first boot.**
Under Compose, `backend` may start before `db` finishes initializing. It should
retry/restart; if it exits, re-run `docker compose up` (the db is now up) or
wait for the `db` healthcheck. Locally, confirm Postgres is listening on the
host/port in `DATABASE_URL` and that the database named in the URL exists.

**"Missing required env var: DATABASE_URL" (or JWT_SECRET in prod).**
`backend/src/env.ts` fails fast. Ensure `.env` exists (Docker) or the var is
exported (local dev). `JWT_SECRET` is mandatory when `NODE_ENV=production`;
in dev it falls back to an insecure default.

**Port already in use.**
`8080` (web), `4000` (backend), or `5432` (db) may be taken. Change `WEB_PORT`
in `.env`, change the local dev `PORT`, or free the port. Find the culprit with
`lsof -i :8080`.

**SSE feels laggy / never updates (realtime chat, live photo/text refresh).**
SSE needs unbuffered streaming through the proxy. The backend already sends
`Cache-Control: no-cache, no-transform`, `Connection: keep-alive`, and
`X-Accel-Buffering: no`, plus a 25s heartbeat. If you put another proxy in
front, disable response buffering and proxy read timeouts on `/api/*/stream`
(for nginx: `proxy_buffering off;` and a long `proxy_read_timeout`). Also ensure
HTTP/1.1 is used for those upstream connections.

**Uploads disappear after a restart.**
The upload directory must be a persistent volume. Under Compose it is mounted at
`UPLOAD_DIR`; if you `docker compose down -v` you intentionally wipe it.

**Admin password change didn't take.**
The seed re-syncs the admin password from env on every start. Update
`ADMIN_PASSWORD` in `.env` and restart the backend (`docker compose up` or
re-run `npm run seed`). See [`ADMIN.md`](./ADMIN.md).

# Environment Variables

All configuration lives in the root `.env` (copy `.env.example` → `.env`). The
backend reads its vars via `backend/src/env.ts`, which is typed and **fails fast**
on missing critical values. The frontend reads `NEXT_PUBLIC_API_URL` at build/dev
time. Docker Compose passes the shared vars into the `db`, `backend`, and `web`
services.

> Keep `.env` out of version control. `.env.example` should hold safe
> placeholders only — never real secrets.

## All variables

| Variable | What it does | Example / default | Secret? |
|---|---|---|---|
| `POSTGRES_USER` | Postgres superuser for the `db` container; used to build `DATABASE_URL`. | `postgres` | no |
| `POSTGRES_PASSWORD` | Password for `POSTGRES_USER`. | `postgres` (change for prod) | **yes** |
| `POSTGRES_DB` | Database name created on first boot. | `balloons` | no |
| `DATABASE_URL` | Prisma connection string the backend uses. | `postgresql://postgres:postgres@db:5432/balloons?schema=public` (host `db` in Compose, `localhost` in local dev) | **yes** (contains password) |
| `JWT_SECRET` | Signs & verifies admin JWTs. Mandatory when `NODE_ENV=production`; in dev falls back to `dev-insecure-secret-change-me`. Changing it invalidates issued tokens. | long random string | **yes** |
| `JWT_EXPIRES_IN` | Admin token lifetime (any `jsonwebtoken` duration). | `12h` | no |
| `ADMIN_USERNAME` | Seeded admin login username. | `admin` | no |
| `ADMIN_PASSWORD` | Seeded admin password (bcrypt-hashed by the seed; re-synced on restart). | `bbreeze-admin` (change for prod) | **yes** |
| `MAX_UPLOAD_MB` | Max photo upload size in MB (multer limit). | `8` | no |
| `UPLOAD_DIR` | Directory where uploaded images are written and served from at `/uploads`. Mount as a persistent volume. | `uploads` | no |
| `WEB_PORT` | Host port the `web` (nginx) service is published on. | `8080` | no |
| `NODE_ENV` | Node environment; `production` makes `JWT_SECRET` mandatory. | `development` / `production` | no |
| `PORT` | Port the backend Express server listens on. | `4000` | no |
| `CORS_ORIGIN` | Allowed CORS origin(s), comma-separated; `*` allows all. Only matters when the browser hits the backend directly (dev); irrelevant behind the single-origin nginx proxy. | `*` (dev) / your site origin (prod) | no |
| `NEXT_PUBLIC_API_URL` | Frontend's API base URL. `/api` (same-origin, behind nginx) or `http://localhost:4000/api` for local dev. Baked into the frontend at build/dev time. | `/api` | no |

## Notes

- **Fail-fast:** `DATABASE_URL` is always required. `JWT_SECRET` is required when
  `NODE_ENV=production`. Missing either throws `Missing required env var: <NAME>`
  at startup.
- **`DATABASE_URL` host differs by mode:** use `db` (the service name) inside
  Docker Compose, and `localhost` for local dev.
- **Secrets to rotate before deploying:** `POSTGRES_PASSWORD`, `JWT_SECRET`,
  `ADMIN_PASSWORD` (and the `DATABASE_URL` password to match). See
  [`ADMIN.md`](./ADMIN.md).
- **`NEXT_PUBLIC_*`** is a Next.js convention: it is exposed to the browser, so
  never put a secret there.

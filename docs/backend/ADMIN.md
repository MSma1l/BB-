# Admin Access Guide

The admin CMS (Messages inbox, Photos, Texts, **Reviews moderation**) lives at its
own route and is protected by a **single login**: the in-app JWT login form, which
authenticates against a bcrypt-hashed admin user seeded from env.

## How to reach it

Open the URL and you get **one** login form. Enter the admin username + password
(from `.env`) and you're in.

| | Value |
|---|---|
| **URL (Docker)** | `http://localhost:8080/admin-bb` |
| **URL (local dev)** | `http://localhost:3000/admin-bb` |
| **Username** | `ADMIN_USERNAME` (default `admin`) |
| **Password** | `ADMIN_PASSWORD` (default `bbreeze-admin`) |

The route path is `/admin-bb`. The public footer does **not** link to it.

> ⚠️ **CHANGE THE DEFAULT CREDENTIALS BEFORE DEPLOYING.**
> `admin` / `bbreeze-admin` are well-known defaults. Set `ADMIN_USERNAME` and
> `ADMIN_PASSWORD` in the root `.env` (see [`ENV.md`](./ENV.md)) and restart so
> the seed re-syncs the admin user. Never ship the defaults to a public host.

## How login works

1. The admin submits username + password to `POST /api/admin/login`.
2. The backend looks up the `AdminUser` and compares the password against the
   stored **bcrypt hash** (`bcrypt.compare`). No plaintext password is stored.
3. On success it returns `{ token, expiresIn }`, where `token` is a signed JWT
   with payload `{ sub, username }`.
4. The frontend stores the token client-side (localStorage key `bb_admin_token`,
   per `frontend/lib/auth.ts`) and sends it as `Authorization: Bearer <token>`
   on every admin request. `isAuthed()` decodes `exp` to check expiry;
   `logout()` clears it.
5. Protected routes run the `requireAdmin` middleware, which verifies the token
   with `JWT_SECRET`; invalid or expired tokens get `401`.

Relevant env vars (full list in [`ENV.md`](./ENV.md)):

| Var | Role |
|---|---|
| `JWT_SECRET` | Signs & verifies tokens. **Secret.** Mandatory in production; a weak default is used only in dev. Changing it invalidates all existing tokens. |
| `JWT_EXPIRES_IN` | Token lifetime (default `12h`). After this the admin must log in again. |
| `ADMIN_USERNAME` | Seeded admin login (default `admin`). |
| `ADMIN_PASSWORD` | Seeded admin password (default `bbreeze-admin`). **Secret.** |

## Password re-sync on restart

The seed (`backend/src/seed.ts`) runs on every start and **upserts** the admin
user from env: it hashes `ADMIN_PASSWORD` and updates the stored hash. So to
rotate the password you just change `ADMIN_PASSWORD` in `.env` and restart
(`docker compose up`, or `npm run seed` locally) — no manual DB edit needed.
Photo groups are only seeded when missing, so this never clobbers admin edits.

## Security notes

- This is real server-side auth (unlike the old static build, where credentials
  shipped in the browser bundle). Still, treat it as app-level protection.
- Change `ADMIN_PASSWORD` (and `JWT_SECRET`) before deploying; keep `.env` out of
  version control.

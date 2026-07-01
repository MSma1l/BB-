# API Reference

A readable summary of the frozen contract in
[`../../backend/API_CONTRACT.md`](../../backend/API_CONTRACT.md). If the two ever
disagree, the contract file wins.

- **Base path:** `/api`. In production nginx proxies `/api` and `/uploads` to the
  backend, so the frontend uses same-origin relative URLs. In dev the frontend
  can target `NEXT_PUBLIC_API_URL` (default `/api`, or `http://localhost:4000/api`).
- **Auth:** admin routes require `Authorization: Bearer <token>` (see
  [`ADMIN.md`](./ADMIN.md)). Public routes need no token.
- **Data shapes** are frozen in `frontend/lib/types.ts` (`Conversation`,
  `ChatMessage`, `Review`, `Dictionary`, `Locale`) and mirrored in
  `backend/prisma/schema.prisma`.

## Auth

| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| POST | `/api/admin/login` | public | `{ username, password }` | `200 { token, expiresIn }` or `401 { error }` |
| GET | `/api/admin/me` | Bearer | – | `200 { username }` or `401` |

Login verifies the bcrypt hash of the seeded admin user. The token is a signed
JWT (`{ sub, username }`) valid for `JWT_EXPIRES_IN` (default `12h`).

## Conversations (chat + admin inbox)

| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| GET | `/api/conversations` | **Bearer** | – | `Conversation[]` (admin inbox, newest activity first) |
| GET | `/api/conversations/:id` | public | – | `Conversation` (visitor resumes own thread) or `404` |
| POST | `/api/conversations` | public | `Conversation` (client-built, with `id`) | `201 Conversation` |
| POST | `/api/conversations/:id/messages` | public | `ChatMessage` | `201 ChatMessage` (also bumps conversation `ts`) or `404` |
| GET | `/api/conversations/stream` | public | – | **SSE** — emits `message` on any change |

Notes: visitors create conversations and append messages without auth; only
listing **all** conversations requires the Bearer token. `from: "operator"`
messages are admin replies (the field is trusted for the demo). `id` and `ts`
(epoch ms) are client-generated.

## Photos

Groups: `profile | showcase | gallery`. URLs are either defaults (`/photos/...`)
or uploaded files (`/uploads/...`).

| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| GET | `/api/photos/:group` | public | – | `string[]` (current urls; defaults if no row) |
| PUT | `/api/photos/:group` | **Bearer** | `{ images: string[] }` | `string[]` |
| DELETE | `/api/photos/:group` | **Bearer** | – | `string[]` (reset → defaults) |
| POST | `/api/photos/:group/upload` | **Bearer** | multipart `file` | `{ url }` |
| GET | `/api/photos/stream` | public | – | **SSE** on change |

Upload: `multer` disk storage, image mimetypes only, size cap `MAX_UPLOAD_MB`
(default 8). Stored files are served at `/uploads/<generated-name>` from a
persistent volume. An oversize/invalid file yields a `4xx` error.

## Texts (per-locale overrides)

Overrides are keyed by a dot-path into the `Dictionary` (e.g. `"hero.titleA"`,
`"footer.phone"`). Shape: `{ [locale]: { "dot.path": value } }`.

| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| GET | `/api/texts` | public | – | `AllOverrides` (grouped by locale) |
| GET | `/api/texts/:locale` | public | – | `LocaleOverrides` (`{ path: value }`) |
| PUT | `/api/texts/:locale` | **Bearer** | `{ path, value }` | `LocaleOverrides` (set/update one) |
| DELETE | `/api/texts/:locale?path=...` | **Bearer** | – | `LocaleOverrides` (clear one path) |
| DELETE | `/api/texts/:locale` | **Bearer** | – | `LocaleOverrides` (reset whole locale) |
| GET | `/api/texts/stream` | public | – | **SSE** on change |

`locale` must be one of `ru | ro | en`. `value` may be a string or number and is
stored as a string.

## Reviews (visitor-submitted)

| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| GET | `/api/reviews` | public | – | `Review[]` (approved only, newest first) |
| POST | `/api/reviews` | public | `{ name, role, rating, text }` | `201 Review` |
| DELETE | `/api/reviews/:id` | **Bearer** | – | `204` (moderation delete) |
| GET | `/api/reviews/stream` | public | – | **SSE** on change |

`rating` is validated to `0.5–5` (half-star steps). New reviews are created with
`approved: true`; the flag exists so a future moderation UI can gate publishing.

## Health

| Method | Path | Auth | Returns |
|---|---|---|---|
| GET | `/api/health` | public | `{ ok: true }` |

## SSE streams

Every domain exposes a `GET /api/<domain>/stream` endpoint (`conversations`,
`photos`, `texts`, `reviews`). The stream:

- sends an initial `event: ready` with `data: {}`,
- sends `event: message` with `data: {"t":<epoch>}` whenever that domain changes,
- sends `: ping` comment heartbeats every 25s to keep proxies from dropping idle
  connections.

The frontend `subscribe(cb)` opens an `EventSource` and simply **re-fetches** on
each `message` event (payload is a change signal, not the data). Headers set by
the backend: `Content-Type: text/event-stream`, `Cache-Control: no-cache,
no-transform`, `Connection: keep-alive`, `X-Accel-Buffering: no`.

## Error shape

All errors are JSON:

```json
{ "error": "human-readable message" }
```

| Status | Meaning |
|---|---|
| 400 | Validation failed (zod) or unknown group/locale |
| 401 | Missing / invalid / expired Bearer token, or bad login |
| 404 | Resource not found (conversation, unknown `/api` route) |
| 413 | Upload too large (over `MAX_UPLOAD_MB`) |
| 500 | Unexpected server error |

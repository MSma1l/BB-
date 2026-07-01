# Balloons Breeze — API Contract (frozen)

> Single source of truth for the backend endpoints and the frontend wiring.
> Everyone (backend routes, frontend stores, docker) codes against THIS file.
> Base path: **`/api`** (nginx reverse-proxies `/api` and `/uploads` to the backend,
> so the frontend calls same-origin relative URLs). In dev the frontend may target
> `NEXT_PUBLIC_API_URL` (default `/api`, or `http://localhost:4000/api`).

Data shapes are the ones already frozen in `frontend/lib/types.ts`
(`Conversation`, `ChatMessage`, `Review`, `Dictionary`, `Locale`). Do not change them.

## Auth

JWT access token (Bearer). Admin routes require `Authorization: Bearer <token>`.

| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| POST | `/api/admin/login` | – | `{ username, password }` | `200 { token, expiresIn }` or `401 { error }` |
| GET  | `/api/admin/me` | Bearer | – | `200 { username }` or `401` |

Frontend `lib/auth.ts`:
- `login(u,p)` → POST login, on 200 stores `token` (localStorage `bb_admin_token`), returns `true`.
- `isAuthed()` → token present & not expired (decode `exp`).
- `logout()` → clears token.
- `authHeader()` (new helper) → `{ Authorization: 'Bearer <token>' }` for admin calls.

## Chat / conversations

| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| GET  | `/api/conversations` | Bearer | – | `Conversation[]` (admin inbox) |
| GET  | `/api/conversations/:id` | – | – | `Conversation` (visitor resumes own) or `404` |
| POST | `/api/conversations` | – | `Conversation` (client-built) | `201 Conversation` |
| POST | `/api/conversations/:id/messages` | – | `ChatMessage` | `201 ChatMessage` |
| GET  | `/api/conversations/stream` | – | – | **SSE**: emits `message` event on any change |

Notes: visitor endpoints are public (create conv, append visitor/operator msg, read own,
subscribe). Listing ALL conversations requires Bearer. `from: "operator"` messages are the
admin replies (admin UI already sends them; server trusts the field for the demo).

Frontend `lib/chatStore.ts` (keep signatures):
- `loadConversations()` sync → returns in-memory cache; a background `fetch('/api/conversations')`
  (with auth header) refreshes cache + fires subscribers.
- `addConversation(conv)` → POST, optimistic cache update.
- `appendMessage(id,msg)` → POST message, optimistic cache update.
- `getMyConversationId()/setMyConversationId(id)` → keep localStorage.
- `subscribe(cb)` → open `EventSource('/api/conversations/stream')`, call `cb()` on `message`,
  return unsubscribe; also keep the same-tab custom event.
- `dropDemoConversations()` → no-op (kept for compat).

## Photos

Groups: `profile | showcase | gallery`. URLs may be defaults (`/photos/...`) or uploads (`/uploads/...`).

| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| GET  | `/api/photos/:group` | – | – | `string[]` (current urls) |
| PUT  | `/api/photos/:group` | Bearer | `{ images: string[] }` | `string[]` |
| DELETE | `/api/photos/:group` | Bearer | – | `string[]` (reset → defaults) |
| POST | `/api/photos/:group/upload` | Bearer | multipart `file` | `{ url }` |
| GET  | `/api/photos/stream` | – | – | **SSE** on change |

Frontend `lib/photoStore.ts` (keep signatures): `loadGroup` sync from cache (default until fetched),
`saveGroup/replacePhoto/addPhoto/removePhoto` compute the new list then `PUT` it, `resetGroup` → DELETE,
`subscribe` → SSE + same-tab event, `useSitePhotos` unchanged. `fileToScaledDataUrl` is replaced by an
`uploadPhoto(group, file)` that POSTs multipart and returns the stored URL (PhotosSection uses it at the
`// BACKEND:` upload site).

## Texts (per-locale overrides)

Overrides shape: `{ [locale]: { "dot.path": value } }` (same as `AllOverrides`).

| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| GET  | `/api/texts` | – | – | `AllOverrides` |
| GET  | `/api/texts/:locale` | – | – | `LocaleOverrides` |
| PUT  | `/api/texts/:locale` | Bearer | `{ path, value }` | `LocaleOverrides` (set/update one) |
| DELETE | `/api/texts/:locale?path=...` | Bearer | – | `LocaleOverrides` (clear one path) |
| DELETE | `/api/texts/:locale` | Bearer | – | `{}` (reset whole locale) |
| GET  | `/api/texts/stream` | – | – | **SSE** on change |

Frontend `lib/contentStore.ts` (keep signatures): `loadAllOverrides/loadLocaleOverrides` sync from
cache (empty until fetched); a background fetch hydrates the cache + fires subscribers so the i18n
provider re-applies overrides. `setTextOverride/clearTextOverride/resetLocaleTexts` call the API
(optimistic). Keep `mergeDictionary` + dot-path helpers pure/unchanged. `subscribe` → SSE + same-tab.

## Reviews (visitor-submitted, with moderation)

Submissions are created **pending** (`approved=false`) and only appear publicly
after an admin approves them.

| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| GET  | `/api/reviews` | – | – | `Review[]` approved only, newest first |
| POST | `/api/reviews` | – | `{ name, role, rating, text }` | `201 Review` (pending) |
| GET  | `/api/reviews/pending` | Bearer | – | `Review[]` awaiting moderation |
| PUT  | `/api/reviews/:id/approve` | Bearer | – | `{ ok: true }` (publish) |
| DELETE | `/api/reviews/:id` | Bearer | – | `204` (reject / remove) |
| GET  | `/api/reviews/stream` | – | – | **SSE** on change |

Frontend admin moderation UI: `components/admin/ReviewsSection.tsx` (a 4th admin
nav tab) uses `loadPendingReviews()`/`usePendingReviews()`, `approveReview(id)`
(PUT approve) and `removeReview(id)` (DELETE reject) from `lib/reviewStore.ts`.

## Read-only content (#5) — served server-side, locale-aware

| Method | Path | Auth | Query | Returns |
|---|---|---|---|---|
| GET | `/api/content/services` | – | `?locale=ru\|ro\|en` | `ServicesData { wedding, others }` |
| GET | `/api/content/testimonials` | – | `?locale=ru\|ro\|en` | `Review[]` (built-in testimonials) |

Invalid/missing locale falls back to `ru`. Frontend `content/services.ts`
`getServices(locale)` and `content/reviews.ts` `getReviews(locale)` fetch these
and **fall back to the shipped dictionary** on any error (so SSR / `next build` /
offline never breaks). Data source: `backend/src/content/catalogue.ts`.

Frontend `lib/reviewStore.ts` (keep signatures): `loadReviews` sync from cache, `addReview(input,ts)`
POSTs and returns the created `Review`, `removeReview(id)` DELETEs, `subscribe` → SSE + same-tab,
`useVisitorReviews` unchanged.

> **Note:** #5 was originally kept frontend-side; it is now served server-side
> via `/api/content/*` (see the "Read-only content (#5)" section above), with a
> dictionary fallback so nothing breaks offline.

## Errors

JSON `{ error: string }`, standard status codes. `401` unauthorized, `400` validation (zod),
`404` not found, `413` upload too large, `500` server.

## Health

`GET /api/health` → `{ ok: true }`.

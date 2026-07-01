# Backend TODO — Balloons Breeze

> **For the backend developer (and their AI assistant).**
> The site is a **frontend-only** static export (Next.js 16, `output: "export"`).
> Everything works today on **mock data / browser `localStorage`**. Your job is to
> replace those mocks with a real API — **without changing the UI**.
>
> **The golden rule:** every swap point is marked in code with a `// BACKEND:`
> comment, and the data shapes are frozen in **`frontend/lib/types.ts`**. If you
> keep the same function signatures and return the same shapes, no component
> needs to change. Search the repo for `BACKEND:` to find every seam.

---

## How the frontend is wired (context you need)

- **No server today.** The app is exported to static HTML in `frontend/out/`.
- **Three "stores" fake persistence with `localStorage`** so features work in a demo
  and sync across browser tabs (via the `storage` event):
  - `frontend/lib/chatStore.ts` — chat conversations.
  - `frontend/lib/photoStore.ts` — admin-editable site photos.
  - `frontend/lib/contentStore.ts` — admin-editable site text (all copy, per locale).
  Each exposes a tiny contract: **a load/save pair + a `subscribe(cb)` function**.
  Replace the *insides* of these; leave the exported function names/shapes alone.
- **Read-only content** (services, reviews) is served by `async` accessor functions
  in `frontend/content/*` that currently `return` local mock arrays.
- **i18n**: all three languages (RU/RO/EN) share one `Dictionary` shape. If content
  comes from the backend it must be returned **per locale** (the accessors already
  take a `locale` argument).

---

## 1. Admin authentication  🔴 security-critical

**File:** `frontend/lib/auth.ts`

**Now:** `login()` compares against hardcoded `admin` / `bbreeze-admin` **in the
browser bundle**. This is *deterrence only* — the credentials ship to every visitor.
The admin lives at the route **`/admin-bb`**.

**Do:**
- Replace the body of `login(username, password)` with a real server call that
  verifies credentials **server-side** and returns a session token / sets an
  httpOnly cookie. Keep the signature `async (username, password) => boolean`
  (or extend it to return a token — then update `isAuthed()`/`logout()` alongside).
- **Also protect `/admin-bb` at the edge** (Vercel/Netlify/Cloudflare Access, or a
  real server route). Client-side gating can always be bypassed on a static site.
- Do not log or persist passwords in the client.

**Shape:** see `isAuthed()`, `logout()`, `login()` in `lib/auth.ts`.

---

## 2. Chat conversations + admin inbox  🟠 needs realtime

**Files:** `frontend/lib/chatStore.ts` (the seam), consumed by
`frontend/components/chat/ChatWidget.tsx` (customer) and
`frontend/components/admin/MessagesSection.tsx` + `AdminShell.tsx` (admin).

**Now:** conversations live in `localStorage` under key `bb_conversations`.
Customer submits an intake form (name, surname, phone) → a `Conversation` is
created; each message is appended. The admin inbox mirrors the same store and
shows a **toast + unread badge** when new customer activity arrives. Cross-tab
sync is done with the browser `storage` event. **There are no seeded/demo
conversations** — only ones real visitors start.

**Do — replace these exported functions in `chatStore.ts`:**
- `loadConversations(): Conversation[]` → fetch from your API.
- `addConversation(conv)` → `POST` a new conversation.
- `appendMessage(convId, msg)` → `POST` a message to a conversation.
- `subscribe(cb): () => void` → open a **WebSocket / SSE** and call `cb()` on any
  change (new conversation or message). Return an unsubscribe function.
- `getMyConversationId()` / `setMyConversationId(id)` → tie a visitor to their
  thread (cookie/localStorage is fine; the *messages* must be server-side).
- `dropDemoConversations()` can be deleted once there is no localStorage seed.

**Data shapes** (`lib/types.ts`): `Conversation { id, first, last, phone, messages: ChatMessage[], ts }`,
`ChatMessage { id, from: "visitor" | "operator", text, ts }`. `ts` is epoch ms.

**Notes for realtime:** the admin "new message" detector counts conversations +
visitor messages. As long as `subscribe(cb)` fires on new activity, the toast and
unread badge keep working. Consider real push/email/Telegram notification to the
operator when they're not on the page.

---

## 3. Admin-editable site photos  🟡 needs upload + storage

**Files:** `frontend/lib/photoStore.ts` (the seam), admin UI in
`frontend/components/admin/PhotosSection.tsx`, consumed on the public site by
`frontend/components/sections/About.tsx` and `Showcase.tsx` via the
`useSitePhotos(groupId)` hook.

**Now:** the admin can **replace, add, and delete** images in three groups —
`"profile"` (About carousel), `"showcase"` (Showcase strip), and `"gallery"` (the
portfolio grid, which now shows real photos instead of the old CSS placeholders).
The picked file is **downscaled and stored as a base64 data URL in `localStorage`**
(key `bb_site_photos`), then shown on the public site live (same-browser). Defaults
are the static files in `frontend/public/photos/` (listed in
`frontend/content/photos.ts`).

**Why it needs you:** `localStorage` data URLs are **per-browser** — an edit on the
admin's laptop is NOT visible to real site visitors, and there's a ~5 MB storage
cap. Real photo management needs server upload + storage (S3/Cloudinary/CMS).

**Do — replace these exported functions in `photoStore.ts`:**
- `fileToScaledDataUrl(file)` → **upload the raw `File`** to your media storage and
  return the stored URL (drop the client-side base64 encoding).
- `saveGroup(id, images)` / `replacePhoto(id, index, src)` / `addPhoto(id, src)` /
  `removePhoto(id, index)` → persist the group's image URLs server-side.
- `loadGroup(id): string[]` → fetch the current URLs for the group (fall back to
  the defaults in `content/photos.ts`).
- `resetGroup(id)` → restore the group to defaults.
- `subscribe(cb)` → (optional) push updates so open pages refresh live; otherwise a
  page reload picking up `loadGroup` is acceptable.

**Groups:** `PhotoGroupId = "profile" | "showcase" | "gallery"` (`content/photos.ts`).
Adding a new editable group = add an id + defaults there and a card renders
automatically.

The exact upload call site is marked in `PhotosSection.tsx`:
`// BACKEND: upload `file` and store the returned URL instead of a data URL.`

---

## 4. Editable site text (all copy, all languages)  🟡 needs content store

**Files:** `frontend/lib/contentStore.ts` (the seam) + the merge in
`frontend/lib/i18n.tsx`; admin UI in `frontend/components/admin/TextsSection.tsx`.

**Now:** the admin "Texts" section lets the operator edit **every string on the
site**, per language (RU/RO/EN tabs). Edits are stored as **path→value overrides in
`localStorage`** (key `bb_text_overrides`, shape `{ [locale]: { "hero.titleA": "…" } }`)
and overlaid on the built-in copy by `mergeDictionary()` inside the i18n provider,
so the public site updates live. Only changed fields are stored; everything else
falls back to the shipped copy in `content/i18n/{ru,ro,en}.ts`. **This includes the
contact phone/email** (`footer.phone`, `footer.email`) — the footer dial link is
derived from the edited phone.

**Do — replace these exported functions in `contentStore.ts`:**
- `loadAllOverrides()` / `loadLocaleOverrides(locale)` → fetch overrides from your
  content API/CMS.
- `setTextOverride(locale, path, value)` / `clearTextOverride(locale, path)` /
  `resetLocaleTexts(locale)` → persist edits server-side.
- `subscribe(cb)` → (optional) push updates for live refresh.
- Keep `mergeDictionary()` + the dot-path helpers as-is (pure functions).

**Shape:** overrides are keyed by a dot-path into `Dictionary` (`lib/types.ts`) —
e.g. `"hero.titleA"`, `"about.points.0"`, `"services.wedding.groups.1.title"`,
`"footer.phone"`. A full CMS could instead serve the whole `Dictionary` per locale;
if so, drop the override layer and have the provider fetch the dictionary directly.

---

## 5. Read-only content accessors  🟢 straightforward

These already have the right shape — just replace the mock `return` with a fetch.
Each takes a `locale` where content is translatable. (Note: these overlap with #4 —
if the text store serves the whole dictionary, these can fold into it.)

| Feature  | File                        | Function                                   |
|----------|-----------------------------|--------------------------------------------|
| Services | `frontend/content/services.ts` | `getServices(locale): Promise<ServicesData>` |
| Reviews  | `frontend/content/reviews.ts`  | `getReviews(locale): Promise<Review[]>`      |

Shapes are in `lib/types.ts` (`ServiceGroup`, `ServiceCategory`, `Review`).
(The gallery is now an editable photo group — see #3 — not a separate accessor.)

---

## 6. Real content still missing (not code — assets/copy)

- **Gallery media:** the gallery now shows **real photos** and is editable from the
  admin (#3), currently defaulting to the wedding/Toronto set in
  `frontend/public/photos/`. Supply the final curated portfolio images (drop them in
  `frontend/public/photos/` and set them as the `gallery` defaults in
  `content/photos.ts`, or just add them via the admin once uploads are real).
- **Contact details are placeholders.** The admin can now edit them (Texts → Footer),
  but the shipped defaults are still fake — replace in `content/i18n/{ru,ro,en}.ts`:
  - phone **`+37360000000`**  (`footer.phone`)
  - email **`hello@balloonsbreeze.md`**  (`footer.email`)
- **The three profile photos + showcase photos** in `frontend/public/photos/` are
  real; confirm they're the final approved set.

---

## Suggested order

1. **Auth** (#1) — lock down `/admin-bb` before anything else is real.
2. **Chat** (#2) — the core interactive feature; needs a datastore + realtime.
3. **Photos** (#3) — upload + storage so edits are global, not per-browser.
4. **Text content** (#4) + **accessors** (#5) + **real media/contacts** (#6) — as content is ready.

## Ground rules (so the frontend keeps working)

- Change **function bodies**, not signatures or return shapes.
- Treat **`frontend/lib/types.ts`** as the contract; if a shape must change, change
  it there and let TypeScript flag every affected spot.
- Every seam is tagged `// BACKEND:` — grep for it.
- The app is a static export; anything requiring a server (auth, chat, uploads)
  also needs a hosting/runtime decision (API routes, serverless, or a separate
  backend service the static site calls).

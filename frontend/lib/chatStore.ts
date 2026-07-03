// Shared conversation store for the customer chat widget and the admin inbox.
//
// Backed by the REST/SSE API (backend/API_CONTRACT.md §Chat). The exported
// signatures are unchanged so the components (ChatWidget, MessagesSection,
// AdminShell) need no edits: the sync `loadConversations()` returns an in-memory
// cache, a background fetch hydrates it, and `subscribe(cb)` fires on same-tab
// custom events AND server pushes over SSE.
//
// The admin inbox lists ALL conversations (needs the Bearer token). The visitor
// widget has no token; it resumes its own thread via GET /conversations/:id,
// keyed by the localStorage `myConversationId`.

import { apiFetch, apiJson, getToken, sse } from "@/lib/api";
import { showToast } from "@/lib/toast";
import type { ChatMessage, Conversation } from "@/lib/types";

/** Remembers which conversation belongs to this visitor, so they resume it. */
const MY_KEY = "bb_my_conversation";
/** Same-tab change notification. */
const EVENT = "bb-conversations-changed";

const canUse = () => typeof window !== "undefined";

/** In-memory cache; the source of truth the sync loaders return. */
let cache: Conversation[] = [];

/** Notify listeners in *this* tab (SSE + storage-style refresh path). */
function emit(): void {
  if (!canUse()) return;
  window.dispatchEvent(new Event(EVENT));
}

function upsert(conv: Conversation): void {
  const i = cache.findIndex((c) => c.id === conv.id);
  if (i === -1) cache = [...cache, conv];
  else cache = cache.map((c) => (c.id === conv.id ? conv : c));
}

/** Read the full conversation list from the in-memory cache. */
export function loadConversations(): Conversation[] {
  return cache;
}

/**
 * Refresh the cache from the API, then notify subscribers. Admins (token
 * present) list everything; a tokenless visitor fetches only their own thread.
 */
async function hydrate(): Promise<void> {
  if (!canUse()) return;
  try {
    if (getToken()) {
      const list = await apiJson<Conversation[]>("/conversations");
      cache = Array.isArray(list) ? list : [];
      emit();
      return;
    }
    const myId = getMyConversationId();
    if (myId) {
      const mine = await apiJson<Conversation>(
        `/conversations/${encodeURIComponent(myId)}`,
      );
      if (mine && mine.id) {
        upsert(mine);
        emit();
      }
    }
  } catch {
    /* offline / unauthorized — keep whatever is cached */
  }
}

/**
 * Remove leftover pre-seeded demo threads. No-op now that data is server-side
 * (kept for compatibility with existing callers).
 */
export function dropDemoConversations(): void {
  /* no-op: there is no localStorage seed anymore */
}

/** Add a brand-new conversation (customer just submitted the intake form). */
export function addConversation(conv: Conversation): void {
  upsert(conv); // optimistic
  emit();
  if (!canUse()) return;
  apiFetch("/conversations", { method: "POST", json: conv })
    .then((res) => res.json())
    .then((saved: Conversation) => {
      if (saved && saved.id) {
        upsert(saved);
        emit();
      }
    })
    .catch(() => {
      // Keep the optimistic thread (kicking back to the form would be jarring),
      // but tell the visitor the request didn't reach the server (QA-3 Rec #6).
      showToast("error", "network");
    });
}

/** Append a message to a conversation and bump its last-activity timestamp. */
export function appendMessage(convId: string, msg: ChatMessage): void {
  // optimistic
  cache = cache.map((c) =>
    c.id === convId ? { ...c, ts: msg.ts, messages: [...c.messages, msg] } : c,
  );
  emit();
  if (!canUse()) return;
  apiFetch(`/conversations/${encodeURIComponent(convId)}/messages`, {
    method: "POST",
    json: msg,
  }).catch(() => {
    // Send failed — drop the optimistic message so it doesn't look delivered,
    // and notify the sender (QA-3 Rec #6).
    cache = cache.map((c) =>
      c.id === convId
        ? { ...c, messages: c.messages.filter((m) => m.id !== msg.id) }
        : c,
    );
    emit();
    showToast("error", "network");
  });
}

/** This visitor's own conversation id (persists across reloads), or null. */
export function getMyConversationId(): string | null {
  if (!canUse()) return null;
  try {
    return window.localStorage.getItem(MY_KEY);
  } catch {
    return null;
  }
}

/** Remember this visitor's conversation id for future visits. */
export function setMyConversationId(id: string): void {
  if (!canUse()) return;
  try {
    window.localStorage.setItem(MY_KEY, id);
  } catch {
    /* ignore */
  }
}

/**
 * Subscribe to any change. Returns an unsubscribe function. Kicks off a
 * background hydrate, listens for same-tab custom events, and opens the SSE
 * stream (server pushes trigger a re-fetch → cache update → cb).
 */
export function subscribe(cb: () => void): () => void {
  if (!canUse()) return () => {};
  void hydrate();
  window.addEventListener(EVENT, cb);
  const closeSse = sse("/conversations/stream", () => {
    void hydrate().then(cb);
  });
  return () => {
    window.removeEventListener(EVENT, cb);
    closeSse();
  };
}

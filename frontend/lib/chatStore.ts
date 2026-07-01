// Shared conversation store for the customer chat widget and the admin inbox.
//
// The site is a static export with no backend, yet the customer chat (on `/`)
// and the admin panel (on `/admin-bb`) are separate pages that must see the
// same conversations. localStorage is the only channel that spans both: the
// browser fires a `storage` event in *other* tabs on every write, so an admin
// tab is notified the instant a customer (in another tab) sends a message. For
// updates within the *same* tab we dispatch a custom event, since `storage`
// does not fire in the tab that made the change.
//
// BACKEND: replace load/save with a real API + websocket/SSE subscription. The
// component contract (Conversation[] + a subscribe(cb) callback) stays the same.

import type { ChatMessage, Conversation } from "@/lib/types";

const KEY = "bb_conversations";
/** Remembers which conversation belongs to this visitor, so they resume it. */
const MY_KEY = "bb_my_conversation";
/** Same-tab change notification (storage events only reach *other* tabs). */
const EVENT = "bb-conversations-changed";

const canUse = () => typeof window !== "undefined";

/** Read the full conversation list; `[]` if unset or corrupt. */
export function loadConversations(): Conversation[] {
  if (!canUse()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Conversation[]) : [];
  } catch {
    return [];
  }
}

function save(convs: Conversation[]): void {
  if (!canUse()) return;
  window.localStorage.setItem(KEY, JSON.stringify(convs));
  // Notify listeners in *this* tab; other tabs get the native `storage` event.
  window.dispatchEvent(new Event(EVENT));
}

/** Seed demo conversations once, only if the store is still empty. */
export function seedIfEmpty(seed: Conversation[]): void {
  if (!canUse()) return;
  if (window.localStorage.getItem(KEY) === null) save(seed);
}

/** Add a brand-new conversation (customer just submitted the intake form). */
export function addConversation(conv: Conversation): void {
  save([...loadConversations(), conv]);
}

/** Append a message to a conversation and bump its last-activity timestamp. */
export function appendMessage(convId: string, msg: ChatMessage): void {
  save(
    loadConversations().map((c) =>
      c.id === convId
        ? { ...c, ts: msg.ts, messages: [...c.messages, msg] }
        : c,
    ),
  );
}

/** This visitor's own conversation id (persists across reloads), or null. */
export function getMyConversationId(): string | null {
  if (!canUse()) return null;
  return window.localStorage.getItem(MY_KEY);
}

/** Remember this visitor's conversation id for future visits. */
export function setMyConversationId(id: string): void {
  if (!canUse()) return;
  window.localStorage.setItem(MY_KEY, id);
}

/**
 * Subscribe to any change from either tab. Returns an unsubscribe function.
 * Fires on the native cross-tab `storage` event and our same-tab custom event.
 */
export function subscribe(cb: () => void): () => void {
  if (!canUse()) return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) cb();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(EVENT, cb);
  };
}

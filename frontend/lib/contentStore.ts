// Shared "site text" store: lets the admin edit every string in the site's
// dictionary (per language) and have the change show up on the public site.
//
// Backed by the REST/SSE API (backend/API_CONTRACT.md §Texts). The exported
// signatures are unchanged: sync `loadAllOverrides()`/`loadLocaleOverrides()`
// return an in-memory cache (empty until fetched), a background fetch hydrates
// it + fires subscribers so the i18n provider re-applies overrides, and
// mutations call the API optimistically. `mergeDictionary` + the dot-path
// helpers stay pure/unchanged.

"use client";

import { apiFetch, apiJson, sse } from "@/lib/api";
import type { Dictionary, Locale } from "@/lib/types";

const EVENT = "bb-texts-changed";

const canUse = () => typeof window !== "undefined";

/** One locale's overrides: dot-path → replacement value. */
export type LocaleOverrides = Record<string, string | number>;
export type AllOverrides = Partial<Record<Locale, LocaleOverrides>>;

/** In-memory cache; the source of truth the sync loaders return. */
let cache: AllOverrides = {};

function emit(): void {
  if (!canUse()) return;
  window.dispatchEvent(new Event(EVENT));
}

export function loadAllOverrides(): AllOverrides {
  return cache;
}

export function loadLocaleOverrides(locale: Locale): LocaleOverrides {
  return cache[locale] ?? {};
}

/** Refresh the cache from the API, then notify subscribers. */
async function hydrate(): Promise<void> {
  if (!canUse()) return;
  try {
    const all = await apiJson<AllOverrides>("/texts");
    cache = all && typeof all === "object" ? all : {};
    emit();
  } catch {
    /* offline — keep cache */
  }
}

/** Set (or update) one field's override for a locale (PUT, optimistic). */
export function setTextOverride(locale: Locale, path: string, value: string | number): boolean {
  cache = { ...cache, [locale]: { ...(cache[locale] ?? {}), [path]: value } };
  emit();
  if (!canUse()) return true;
  apiFetch(`/texts/${locale}`, { method: "PUT", json: { path, value } })
    .then((res) => res.json())
    .then((saved: LocaleOverrides) => {
      if (saved && typeof saved === "object") {
        cache = { ...cache, [locale]: saved };
        emit();
      }
    })
    .catch(() => {
      /* keep optimistic copy */
    });
  return true;
}

/** Remove a single field override (revert it to the built-in copy). */
export function clearTextOverride(locale: Locale, path: string): boolean {
  const next: AllOverrides = { ...cache };
  if (next[locale]) {
    const localeCopy = { ...next[locale]! };
    delete localeCopy[path];
    if (Object.keys(localeCopy).length === 0) delete next[locale];
    else next[locale] = localeCopy;
  }
  cache = next;
  emit();
  if (!canUse()) return true;
  apiFetch(`/texts/${locale}?path=${encodeURIComponent(path)}`, { method: "DELETE" })
    .then((res) => res.json())
    .then((saved: LocaleOverrides) => {
      if (saved && typeof saved === "object") {
        cache = { ...cache, [locale]: saved };
        emit();
      }
    })
    .catch(() => {
      /* keep optimistic copy */
    });
  return true;
}

/** Revert every text edit for one language (DELETE, optimistic). */
export function resetLocaleTexts(locale: Locale): boolean {
  const next: AllOverrides = { ...cache };
  delete next[locale];
  cache = next;
  emit();
  if (!canUse()) return true;
  apiFetch(`/texts/${locale}`, { method: "DELETE" }).catch(() => {
    /* keep optimistic copy */
  });
  return true;
}

/**
 * Subscribe to text changes. Returns an unsubscribe fn. Hydrates in the
 * background, listens for same-tab custom events, and opens the SSE stream
 * (server pushes re-fetch → cache update → cb).
 */
export function subscribe(cb: () => void): () => void {
  if (!canUse()) return () => {};
  void hydrate();
  window.addEventListener(EVENT, cb);
  const closeSse = sse("/texts/stream", () => {
    void hydrate().then(cb);
  });
  return () => {
    window.removeEventListener(EVENT, cb);
    closeSse();
  };
}

/** Set a value at a dot-path (numeric segments index into arrays). */
function setByPath(obj: unknown, path: string, value: string | number): void {
  const parts = path.split(".");
  let node = obj as Record<string, unknown>;
  for (let i = 0; i < parts.length - 1; i++) {
    const next = node[parts[i]];
    if (next === null || typeof next !== "object") return; // path no longer valid
    node = next as Record<string, unknown>;
  }
  node[parts[parts.length - 1]] = value;
}

/**
 * Return a copy of `base` with `overrides` applied. Unknown/stale paths are
 * ignored, so edits survive future copy changes without breaking the site.
 */
export function mergeDictionary(base: Dictionary, overrides: LocaleOverrides): Dictionary {
  if (!overrides || Object.keys(overrides).length === 0) return base;
  const clone = JSON.parse(JSON.stringify(base)) as Dictionary;
  for (const [path, value] of Object.entries(overrides)) {
    try {
      setByPath(clone, path, value);
    } catch {
      /* ignore a stale path */
    }
  }
  return clone;
}

// Shared "site text" store: lets the admin edit every string in the site's
// dictionary (per language) and have the change show up on the public site.
//
// Same pattern as chatStore/photoStore — the admin (/admin-bb) and the public
// site (/) are separate documents, synced through localStorage + the browser's
// cross-tab `storage` event. Overrides are keyed by locale and a dot-path into
// the Dictionary (e.g. "hero.titleA", "about.points.0", "footer.phone"); only
// changed fields are stored, everything else falls back to the built-in copy.
//
// BACKEND: replace load/save with a real content API/CMS. mergeDictionary and
// the dot-path helpers stay the same; the provider just fetches overrides.

"use client";

import type { Dictionary, Locale } from "@/lib/types";

const KEY = "bb_text_overrides";
const EVENT = "bb-texts-changed";

const canUse = () => typeof window !== "undefined";

/** One locale's overrides: dot-path → replacement value. */
export type LocaleOverrides = Record<string, string | number>;
export type AllOverrides = Partial<Record<Locale, LocaleOverrides>>;

export function loadAllOverrides(): AllOverrides {
  if (!canUse()) return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AllOverrides) : {};
  } catch {
    return {};
  }
}

export function loadLocaleOverrides(locale: Locale): LocaleOverrides {
  return loadAllOverrides()[locale] ?? {};
}

function writeAll(all: AllOverrides): boolean {
  if (!canUse()) return false;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(all));
    window.dispatchEvent(new Event(EVENT));
    return true;
  } catch {
    return false;
  }
}

/** Set (or update) one field's override for a locale. */
export function setTextOverride(locale: Locale, path: string, value: string | number): boolean {
  const all = loadAllOverrides();
  all[locale] = { ...(all[locale] ?? {}), [path]: value };
  return writeAll(all);
}

/** Remove a single field override (revert it to the built-in copy). */
export function clearTextOverride(locale: Locale, path: string): boolean {
  const all = loadAllOverrides();
  if (all[locale]) {
    delete all[locale]![path];
    if (Object.keys(all[locale]!).length === 0) delete all[locale];
  }
  return writeAll(all);
}

/** Revert every text edit for one language. */
export function resetLocaleTexts(locale: Locale): boolean {
  const all = loadAllOverrides();
  delete all[locale];
  return writeAll(all);
}

/** Subscribe to text changes from either tab. Returns an unsubscribe fn. */
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

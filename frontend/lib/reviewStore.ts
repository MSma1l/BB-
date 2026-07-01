// Visitor-submitted reviews. The built-in testimonials live in the dictionary
// (content/i18n, editable from the admin); these are the ones site visitors add
// themselves. Same localStorage + cross-tab pattern as the other stores.
//
// Visitor reviews are locale-independent (a testimonial isn't auto-translated),
// so they show as written across all three languages.
//
// BACKEND: replace load/add with a real API. Real reviews usually want
// moderation — expose an admin approve/delete step (removeReview is already here)
// and only show approved ones publicly. The UI contract (Review[] + subscribe)
// stays the same.

"use client";

import { useEffect, useState } from "react";
import type { Review } from "@/lib/types";

const KEY = "bb_reviews";
const EVENT = "bb-reviews-changed";

const canUse = () => typeof window !== "undefined";

/** All visitor-submitted reviews, newest first. */
export function loadReviews(): Review[] {
  if (!canUse()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as Review[]) : [];
  } catch {
    return [];
  }
}

function save(list: Review[]): boolean {
  if (!canUse()) return false;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new Event(EVENT));
    return true;
  } catch {
    return false;
  }
}

/** Add a review (id/ts assigned here) and persist it. Returns the created review. */
export function addReview(input: Omit<Review, "id">, ts: number): Review | null {
  const review: Review = { id: `u${ts}`, ...input };
  const ok = save([review, ...loadReviews()]); // newest first
  return ok ? review : null;
}

/** Remove a visitor review by id (admin moderation / undo). */
export function removeReview(id: string): boolean {
  return save(loadReviews().filter((r) => r.id !== id));
}

/** Subscribe to review changes from either tab. Returns an unsubscribe fn. */
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

/** Visitor reviews, empty on first render (SSR-safe) then loaded + live-updated. */
export function useVisitorReviews(): Review[] {
  const [list, setList] = useState<Review[]>([]);
  useEffect(() => {
    const refresh = () => setList(loadReviews());
    refresh();
    return subscribe(refresh);
  }, []);
  return list;
}

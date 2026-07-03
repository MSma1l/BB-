// Visitor-submitted reviews. The built-in testimonials live in the dictionary
// (content/i18n, editable from the admin); these are the ones site visitors add
// themselves.
//
// Backed by the REST/SSE API (backend/API_CONTRACT.md §Reviews). Signatures are
// unchanged: sync `loadReviews()` returns an in-memory cache (empty until
// fetched), a background fetch hydrates it, `addReview` POSTs (optimistic
// prepend) and returns the created Review, `removeReview` DELETEs, and
// `subscribe` fires on same-tab events AND SSE pushes.

"use client";

import { useEffect, useState } from "react";
import { apiFetch, apiJson, sse } from "@/lib/api";
import { showToast } from "@/lib/toast";
import type { Review } from "@/lib/types";

const EVENT = "bb-reviews-changed";

const canUse = () => typeof window !== "undefined";

/** In-memory cache (newest first); the source of truth the sync loader returns. */
let cache: Review[] = [];
/** In-memory cache of reviews awaiting moderation (admin only). */
let pendingCache: Review[] = [];

function emit(): void {
  if (!canUse()) return;
  window.dispatchEvent(new Event(EVENT));
}

/** All published (approved) visitor reviews, newest first. */
export function loadReviews(): Review[] {
  return cache;
}

/** Reviews awaiting moderation, newest first (admin queue). */
export function loadPendingReviews(): Review[] {
  return pendingCache;
}

/** Refresh the public (approved) cache from the API, then notify subscribers. */
async function hydrate(): Promise<void> {
  if (!canUse()) return;
  try {
    const list = await apiJson<Review[]>("/reviews");
    cache = Array.isArray(list) ? list : [];
    emit();
  } catch {
    /* offline — keep cache */
  }
}

/** Refresh the pending (moderation) cache from the API (admin, needs token). */
async function hydratePending(): Promise<void> {
  if (!canUse()) return;
  try {
    const list = await apiJson<Review[]>("/reviews/pending");
    pendingCache = Array.isArray(list) ? list : [];
    emit();
  } catch {
    /* not authed / offline — keep cache */
  }
}

/**
 * Add a review (POST). Optimistically prepends a local copy and returns it; the
 * server's canonical Review replaces it once the request resolves.
 */
export function addReview(input: Omit<Review, "id">, ts: number): Review | null {
  const review: Review = { id: `u${ts}`, ...input };
  cache = [review, ...cache]; // optimistic, newest first
  emit();
  if (canUse()) {
    apiFetch("/reviews", {
      method: "POST",
      json: {
        name: input.name,
        role: input.role,
        rating: input.rating,
        text: input.text,
      },
    })
      .then((res) => res.json())
      .then((saved: Review) => {
        if (saved && saved.id) {
          cache = [saved, ...cache.filter((r) => r.id !== review.id)];
          emit();
        }
      })
      .catch(() => {
        // Persist failed — revert the optimistic review and tell the user, so a
        // dropped submission doesn't look like it succeeded (QA-3 Rec #6).
        cache = cache.filter((r) => r.id !== review.id);
        emit();
        showToast("error", "network");
      });
  }
  return review;
}

/**
 * Approve a pending review (PUT). Optimistically drops it from the pending
 * queue; SSE re-hydration then moves it into the public cache.
 */
export function approveReview(id: string): void {
  pendingCache = pendingCache.filter((r) => r.id !== id); // optimistic
  emit();
  if (!canUse()) return;
  apiFetch(`/reviews/${encodeURIComponent(id)}/approve`, { method: "PUT" }).catch(() => {
    /* keep optimistic copy; SSE will reconcile */
  });
}

/** Remove a review by id (DELETE, optimistic). Works for public + pending. */
export function removeReview(id: string): boolean {
  cache = cache.filter((r) => r.id !== id); // optimistic
  pendingCache = pendingCache.filter((r) => r.id !== id); // optimistic (reject)
  emit();
  if (!canUse()) return true;
  apiFetch(`/reviews/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {
    /* keep optimistic copy */
  });
  return true;
}

/**
 * Subscribe to review changes. Returns an unsubscribe fn. Hydrates in the
 * background, listens for same-tab custom events, and opens the SSE stream
 * (server pushes re-fetch → cache update → cb).
 */
export function subscribe(cb: () => void): () => void {
  if (!canUse()) return () => {};
  void hydrate();
  void hydratePending();
  window.addEventListener(EVENT, cb);
  const closeSse = sse("/reviews/stream", () => {
    void Promise.all([hydrate(), hydratePending()]).then(cb);
  });
  return () => {
    window.removeEventListener(EVENT, cb);
    closeSse();
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

/** Pending (unmoderated) reviews, live-updated — backs the admin queue. */
export function usePendingReviews(): Review[] {
  const [list, setList] = useState<Review[]>([]);
  useEffect(() => {
    const refresh = () => setList(loadPendingReviews());
    refresh();
    return subscribe(refresh);
  }, []);
  return list;
}

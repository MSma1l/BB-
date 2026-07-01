// Shared "site photos" store: lets the admin replace images and have the change
// show up on the public site (About carousel + Showcase strip + Gallery grid).
//
// Backed by the REST/SSE API (backend/API_CONTRACT.md §Photos). The UI contract
// (per-group string[] + subscribe(cb) + useSitePhotos) is unchanged: sync
// `loadGroup(id)` returns an in-memory cache (defaults until fetched), a
// background fetch hydrates it, mutations PUT the new list optimistically, and
// `subscribe` fires on same-tab events AND SSE pushes.
//
// Uploads go through `uploadPhoto(group, file)` (multipart POST) which returns
// the stored URL, replacing the old client-side data-URL encoding.

"use client";

import { useEffect, useState } from "react";
import {
  galleryPhotos,
  profilePhotos,
  showcasePhotos,
  type PhotoGroupId,
} from "@/content/photos";
import { apiFetch, apiJson, sse } from "@/lib/api";

const EVENT = "bb-photos-changed";

const canUse = () => typeof window !== "undefined";

/** The built-in default image list for each group (the /public/photos files). */
const DEFAULTS: Record<PhotoGroupId, string[]> = {
  profile: profilePhotos,
  showcase: showcasePhotos,
  gallery: galleryPhotos,
};

/** In-memory cache per group; the source of truth the sync loader returns. */
const cache: Partial<Record<PhotoGroupId, string[]>> = {};

function emit(): void {
  if (!canUse()) return;
  window.dispatchEvent(new Event(EVENT));
}

/** Current images for a group — the cached list if hydrated, else the defaults. */
export function loadGroup(id: PhotoGroupId): string[] {
  return cache[id] ?? [...DEFAULTS[id]];
}

/** Refresh one group's list from the API, then notify subscribers. */
async function hydrate(id: PhotoGroupId): Promise<void> {
  if (!canUse()) return;
  try {
    const list = await apiJson<string[]>(`/photos/${id}`);
    if (Array.isArray(list)) {
      cache[id] = list;
      emit();
    }
  } catch {
    /* offline — keep cache/defaults */
  }
}

/**
 * Persist a group's image list (PUT). Optimistically updates the cache and
 * returns true; the network write happens in the background.
 */
export function saveGroup(id: PhotoGroupId, images: string[]): boolean {
  cache[id] = images; // optimistic
  emit();
  if (!canUse()) return true;
  apiFetch(`/photos/${id}`, { method: "PUT", json: { images } })
    .then((res) => res.json())
    .then((saved: string[]) => {
      if (Array.isArray(saved)) {
        cache[id] = saved;
        emit();
      }
    })
    .catch(() => {
      /* keep optimistic copy */
    });
  return true;
}

/** Replace a single image in a group and persist. */
export function replacePhoto(id: PhotoGroupId, index: number, src: string): boolean {
  return saveGroup(
    id,
    loadGroup(id).map((im, i) => (i === index ? src : im)),
  );
}

/** Append a new image to a group and persist. */
export function addPhoto(id: PhotoGroupId, src: string): boolean {
  return saveGroup(id, [...loadGroup(id), src]);
}

/** Remove the image at `index` from a group and persist. */
export function removePhoto(id: PhotoGroupId, index: number): boolean {
  return saveGroup(
    id,
    loadGroup(id).filter((_, i) => i !== index),
  );
}

/** Restore a group back to the built-in default photos (DELETE). */
export function resetGroup(id: PhotoGroupId): boolean {
  if (!canUse()) return false;
  cache[id] = [...DEFAULTS[id]]; // optimistic
  emit();
  apiFetch(`/photos/${id}`, { method: "DELETE" })
    .then((res) => res.json())
    .then((saved: string[]) => {
      if (Array.isArray(saved)) {
        cache[id] = saved;
        emit();
      }
    })
    .catch(() => {
      /* keep optimistic copy */
    });
  return true;
}

/**
 * Subscribe to photo changes. Returns an unsubscribe fn. Hydrates all groups in
 * the background, listens for same-tab custom events, and opens the SSE stream
 * (server pushes re-fetch every group → cache update → cb).
 */
export function subscribe(cb: () => void): () => void {
  if (!canUse()) return () => {};
  (Object.keys(DEFAULTS) as PhotoGroupId[]).forEach((id) => void hydrate(id));
  window.addEventListener(EVENT, cb);
  const closeSse = sse("/photos/stream", () => {
    (Object.keys(DEFAULTS) as PhotoGroupId[]).forEach((id) => void hydrate(id));
    cb();
  });
  return () => {
    window.removeEventListener(EVENT, cb);
    closeSse();
  };
}

/**
 * Read the current photos for a group, defaulting to the static files for the
 * first (server-matching) render, then swapping in any saved override after
 * mount. Live-updates when the admin replaces an image (same tab or SSE).
 */
export function useSitePhotos(id: PhotoGroupId): string[] {
  const [images, setImages] = useState<string[]>(() => [...DEFAULTS[id]]);
  useEffect(() => {
    const refresh = () => setImages(loadGroup(id));
    refresh();
    return subscribe(refresh);
  }, [id]);
  return images;
}

/**
 * Upload a picked file to media storage (multipart POST) and return the stored
 * URL. Replaces the old client-side data-URL encoding.
 */
export async function uploadPhoto(id: PhotoGroupId, file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await apiJson<{ url: string }>(`/photos/${id}/upload`, {
    method: "POST",
    body: form,
  });
  return res.url;
}

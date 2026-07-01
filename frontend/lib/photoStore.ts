// Shared "site photos" store: lets the admin replace images and have the change
// show up on the public site (About carousel + Showcase strip) immediately.
//
// Same idea as lib/chatStore.ts — the admin (/admin-bb) and the public site (/)
// are separate documents, so they sync through localStorage + the browser's
// cross-tab `storage` event. Defaults are the static files in /public/photos;
// once the admin replaces one, the override is stored and read everywhere.
//
// A replacement is persisted as a *data URL* (not a blob: object URL, which is
// only valid in the tab that created it and dies on reload). We downscale +
// re-encode to JPEG first so the base64 stays small enough for localStorage.
//
// BACKEND: replace load/save with a real media API/CMS + upload endpoint. The
// UI contract (per-group string[] + subscribe(cb)) is unchanged. See
// fileToScaledDataUrl — the backend uploads the File and stores the returned
// URL instead of embedding a data URL.

"use client";

import { useEffect, useState } from "react";
import {
  galleryPhotos,
  profilePhotos,
  showcasePhotos,
  type PhotoGroupId,
} from "@/content/photos";

const KEY = "bb_site_photos";
const EVENT = "bb-photos-changed";

const canUse = () => typeof window !== "undefined";

/** The built-in default image list for each group (the /public/photos files). */
const DEFAULTS: Record<PhotoGroupId, string[]> = {
  profile: profilePhotos,
  showcase: showcasePhotos,
  gallery: galleryPhotos,
};

type Overrides = Partial<Record<PhotoGroupId, string[]>>;

function readOverrides(): Overrides {
  if (!canUse()) return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Overrides) : {};
  } catch {
    return {};
  }
}

/** Current images for a group — the admin's override if set, else the defaults. */
export function loadGroup(id: PhotoGroupId): string[] {
  return readOverrides()[id] ?? [...DEFAULTS[id]];
}

/**
 * Persist a group's image list. Returns false if the write fails (e.g. the
 * localStorage quota is exceeded by large images), so the UI can warn.
 */
export function saveGroup(id: PhotoGroupId, images: string[]): boolean {
  if (!canUse()) return false;
  try {
    const all = readOverrides();
    all[id] = images;
    window.localStorage.setItem(KEY, JSON.stringify(all));
    window.dispatchEvent(new Event(EVENT));
    return true;
  } catch {
    return false;
  }
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

/** Restore a group back to the built-in default photos. */
export function resetGroup(id: PhotoGroupId): boolean {
  if (!canUse()) return false;
  try {
    const all = readOverrides();
    delete all[id];
    window.localStorage.setItem(KEY, JSON.stringify(all));
    window.dispatchEvent(new Event(EVENT));
    return true;
  } catch {
    return false;
  }
}

/** Subscribe to photo changes from either tab. Returns an unsubscribe fn. */
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

/**
 * Read the current photos for a group, defaulting to the static files for the
 * first (server-matching) render, then swapping in any saved override after
 * mount. Live-updates when the admin replaces an image in another tab.
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
 * Downscale + JPEG-encode a picked file to a data URL small enough to persist
 * in localStorage. BACKEND: skip this and upload the raw File instead.
 */
export function fileToScaledDataUrl(
  file: File,
  maxDim = 1400,
  quality = 0.85,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas 2D context unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load the selected image"));
    };
    img.src = url;
  });
}

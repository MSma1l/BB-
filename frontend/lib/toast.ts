"use client";

// Tiny fire-and-forget toast bus. The localStorage/API stores are plain modules
// (not React), so they announce failures by dispatching a window event; the
// <Toaster/> component renders it and localizes the message via the dictionary.
// This is how QA-3 Rec #6 is addressed — a failed write no longer fails silently.

export const TOAST_EVENT = "bb-toast";

export type ToastKind = "error" | "success";

export interface ToastDetail {
  kind: ToastKind;
  /** Key under the dictionary's `errors` map; resolved + localized by <Toaster/>. */
  key: string;
}

export function showToast(kind: ToastKind, key: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ToastDetail>(TOAST_EVENT, { detail: { kind, key } }));
}

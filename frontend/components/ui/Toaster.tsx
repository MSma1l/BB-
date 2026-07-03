"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { TOAST_EVENT, type ToastDetail, type ToastKind } from "@/lib/toast";

interface Toast {
  id: number;
  kind: ToastKind;
  text: string;
}

let seq = 0;

/**
 * Global transient notifications. Listens on the toast bus (lib/toast.ts) and
 * shows a localized, auto-dismissing message — mounted once at the app root so
 * both the site and the admin can surface store/network errors (QA-3 Rec #6).
 */
export default function Toaster() {
  const t = useT();
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const onToast = (e: Event) => {
      const detail = (e as CustomEvent<ToastDetail>).detail;
      if (!detail) return;
      const text = t.errors[detail.key as keyof typeof t.errors] ?? detail.key;
      const id = ++seq;
      setToasts((list) => [...list, { id, kind: detail.kind, text }]);
      window.setTimeout(
        () => setToasts((list) => list.filter((x) => x.id !== id)),
        5000,
      );
    };
    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, [t]);

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed left-1/2 z-[80] flex -translate-x-1/2 flex-col items-center gap-2 px-4"
      style={{ top: "calc(76px + env(safe-area-inset-top))", width: "min(92vw,460px)" }}
      role="status"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto w-full rounded-[12px] px-[18px] py-[13px] text-center text-[14px] font-medium"
          style={
            toast.kind === "error"
              ? {
                  background: "linear-gradient(160deg,#3a151d,#22101a)",
                  color: "#f6d9de",
                  border: "1px solid rgba(224,114,138,.5)",
                  boxShadow: "0 18px 50px rgba(0,0,0,.5)",
                }
              : {
                  background: "linear-gradient(160deg,#1c2a16,#12180d)",
                  color: "#dcecc7",
                  border: "1px solid rgba(120,190,120,.45)",
                  boxShadow: "0 18px 50px rgba(0,0,0,.5)",
                }
          }
        >
          {toast.text}
        </div>
      ))}
    </div>
  );
}

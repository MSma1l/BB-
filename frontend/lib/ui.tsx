"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import type { BurstSignal } from "@/lib/types";

/**
 * Cross-cutting UI state that lives at the page root: the chat widget and the
 * global balloon background's click-to-burst signal. Hero/Footer buttons call
 * openChat(); ChatWidget reads the flag. The balloon background reads
 * `burstRef`, which `triggerBurst` mutates on click. (The admin panel now lives
 * on its own /admin-bb route, so it no longer uses this context.)
 */
interface UIContextValue {
  chatOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  /** Shared with the balloon background (read each animation frame). */
  burstRef: React.RefObject<BurstSignal>;
  /** Release a burst of balloons at viewport pixel coords. */
  triggerBurst: (clientX: number, clientY: number) => void;
}

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [chatOpen, setChatOpen] = useState(false);
  const burstRef = useRef<BurstSignal>({ x: 0.5, y: 0.5, n: 0 });

  const openChat = useCallback(() => setChatOpen(true), []);
  const closeChat = useCallback(() => setChatOpen(false), []);
  const toggleChat = useCallback(() => setChatOpen((v) => !v), []);

  const triggerBurst = useCallback((clientX: number, clientY: number) => {
    const prev = burstRef.current;
    burstRef.current = {
      x: clientX / Math.max(1, window.innerWidth),
      y: clientY / Math.max(1, window.innerHeight),
      n: prev.n + 1,
    };
  }, []);

  const value = useMemo<UIContextValue>(
    () => ({
      chatOpen,
      openChat,
      closeChat,
      toggleChat,
      burstRef,
      triggerBurst,
    }),
    [chatOpen, openChat, closeChat, toggleChat, triggerBurst],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within a UIProvider");
  return ctx;
}

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
 * Cross-cutting UI state that several sections trigger but that lives at the
 * page root: the chat widget, the (mock) admin panel, and the global balloon
 * background's click-to-burst signal. Hero/Footer buttons call
 * openChat()/openAdmin(); ChatWidget + AdminPanel read the flags. The balloon
 * background reads `burstRef`, which `triggerBurst` mutates on click.
 */
interface UIContextValue {
  chatOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  adminOpen: boolean;
  openAdmin: () => void;
  closeAdmin: () => void;
  /** Shared with the balloon background (read each animation frame). */
  burstRef: React.RefObject<BurstSignal>;
  /** Release a burst of balloons at viewport pixel coords. */
  triggerBurst: (clientX: number, clientY: number) => void;
}

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const burstRef = useRef<BurstSignal>({ x: 0.5, y: 0.5, n: 0 });

  const openChat = useCallback(() => setChatOpen(true), []);
  const closeChat = useCallback(() => setChatOpen(false), []);
  const toggleChat = useCallback(() => setChatOpen((v) => !v), []);
  const openAdmin = useCallback(() => setAdminOpen(true), []);
  const closeAdmin = useCallback(() => setAdminOpen(false), []);

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
      adminOpen,
      openAdmin,
      closeAdmin,
      burstRef,
      triggerBurst,
    }),
    [chatOpen, adminOpen, openChat, closeChat, toggleChat, openAdmin, closeAdmin, triggerBurst],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within a UIProvider");
  return ctx;
}

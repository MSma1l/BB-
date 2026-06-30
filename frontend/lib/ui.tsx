"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

/**
 * Cross-cutting UI state that several sections trigger but that lives at the
 * page root: the chat widget and the (mock) admin panel. Hero/Footer buttons
 * call openChat()/openAdmin(); ChatWidget + AdminPanel read the flags.
 */
interface UIContextValue {
  chatOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  adminOpen: boolean;
  openAdmin: () => void;
  closeAdmin: () => void;
}

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  const openChat = useCallback(() => setChatOpen(true), []);
  const closeChat = useCallback(() => setChatOpen(false), []);
  const toggleChat = useCallback(() => setChatOpen((v) => !v), []);
  const openAdmin = useCallback(() => setAdminOpen(true), []);
  const closeAdmin = useCallback(() => setAdminOpen(false), []);

  const value = useMemo<UIContextValue>(
    () => ({
      chatOpen,
      openChat,
      closeChat,
      toggleChat,
      adminOpen,
      openAdmin,
      closeAdmin,
    }),
    [chatOpen, adminOpen, openChat, closeChat, toggleChat, openAdmin, closeAdmin],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within a UIProvider");
  return ctx;
}

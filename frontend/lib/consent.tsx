"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

/**
 * Shared open/close state for the privacy & cookie policy modal, so that both
 * the consent banner and the footer link trigger the same dialog. Mirrors the
 * lightweight context pattern used by `lib/ui.tsx` / `lib/i18n.tsx`.
 */
interface ConsentContextValue {
  /** Whether the policy modal is currently open. */
  policyOpen: boolean;
  openPolicy: () => void;
  closePolicy: () => void;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [policyOpen, setPolicyOpen] = useState(false);

  const openPolicy = useCallback(() => setPolicyOpen(true), []);
  const closePolicy = useCallback(() => setPolicyOpen(false), []);

  const value = useMemo<ConsentContextValue>(
    () => ({ policyOpen, openPolicy, closePolicy }),
    [policyOpen, openPolicy, closePolicy],
  );

  return (
    <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
  );
}

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error("useConsent must be used within a ConsentProvider");
  return ctx;
}

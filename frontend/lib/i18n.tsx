"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Accent, Dictionary, Locale } from "@/lib/types";
import { DEFAULT_LOCALE, LOCALES } from "@/lib/types";
import { getDictionary } from "@/content/i18n";
import { ACCENTS, DEFAULT_ACCENT } from "@/lib/theme";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  /** Current locale's translation table. */
  t: Dictionary;
  accent: Accent;
  setAccent: (a: Accent) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

const LANG_KEY = "bb_lang";

function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as string[]).includes(v);
}

/**
 * Client-side i18n + accent provider.
 *
 * Language switching is instant (no navigation), matching the DC prototype and
 * staying compatible with static export. The initial render uses DEFAULT_LOCALE
 * so server HTML and first client paint agree; a stored preference is applied
 * after mount.
 */
export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [accent, setAccentState] = useState<Accent>(DEFAULT_ACCENT);

  // Restore a stored language preference after hydration.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LANG_KEY);
      if (isLocale(stored) && stored !== locale) setLocaleState(stored);
    } catch {
      /* localStorage unavailable — keep default */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep <html lang> in sync for a11y / SEO.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  // Apply accent CSS variables whenever the accent changes.
  useEffect(() => {
    const { accent: a, deep } = ACCENTS[accent];
    const root = document.documentElement;
    root.style.setProperty("--bb-accent", a);
    root.style.setProperty("--bb-accent-deep", deep);
  }, [accent]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t: getDictionary(locale),
      accent,
      setAccent: setAccentState,
    }),
    [locale, setLocale, accent],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within a LocaleProvider");
  return ctx;
}

/** Convenience: just the current dictionary. */
export function useT(): Dictionary {
  return useLocale().t;
}

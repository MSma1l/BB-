import type { Dictionary, Locale } from "@/lib/types";
import { ru } from "./ru";
import { ro } from "./ro";
import { en } from "./en";

/** All translation tables, keyed by locale. */
export const dictionaries: Record<Locale, Dictionary> = { ru, ro, en };

/**
 * Resolve the translation table for a locale, falling back to RU.
 * Synchronous because the tables are bundled — components that need only copy
 * can call this directly; structured data goes through the `content/` accessors.
 */
export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.ru;
}

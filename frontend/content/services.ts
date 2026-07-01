import type { Locale, ServiceCategory, ServiceGroup } from "@/lib/types";
import { getDictionary } from "@/content/i18n";
import { apiJson } from "@/lib/api";

export interface ServicesData {
  wedding: {
    title: string;
    desc: string;
    note: string;
    groups: ServiceGroup[];
  };
  others: ServiceCategory[];
}

/** Shipped-dictionary value — the fallback when the API is unreachable. */
function servicesFromDictionary(locale: Locale): ServicesData {
  const { wedding, others } = getDictionary(locale).services;
  return { wedding, others };
}

// BACKEND: wired to GET /api/content/services?locale=… with a graceful fallback
// to the shipped dictionary, so SSR / `next build` (no server) / offline always
// render.
export async function getServices(locale: Locale): Promise<ServicesData> {
  try {
    return await apiJson<ServicesData>(`/content/services?locale=${locale}`);
  } catch {
    return servicesFromDictionary(locale);
  }
}

import type { Locale, Review } from "@/lib/types";
import { getDictionary } from "@/content/i18n";
import { apiJson } from "@/lib/api";

// Reviews are localized (they live in the i18n tables). The accessor stamps a
// stable id by position so the same review keeps its key across locales.

/** Shipped-dictionary value — the fallback when the API is unreachable. */
function reviewsFromDictionary(locale: Locale): Review[] {
  return getDictionary(locale).reviews.list.map((r, i) => ({
    id: `rev-${i + 1}`,
    ...r,
  }));
}

// BACKEND: wired to GET /api/content/testimonials?locale=… with a graceful
// fallback to the shipped dictionary, so SSR / `next build` (no server) /
// offline always render.
export async function getReviews(locale: Locale): Promise<Review[]> {
  try {
    return await apiJson<Review[]>(`/content/testimonials?locale=${locale}`);
  } catch {
    return reviewsFromDictionary(locale);
  }
}

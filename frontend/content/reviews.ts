import type { Locale, Review } from "@/lib/types";
import { getDictionary } from "@/content/i18n";

// Reviews are localized (they live in the i18n tables). The accessor stamps a
// stable id by position so the same review keeps its key across locales.

// BACKEND: replace the body to fetch real reviews for the given locale.
export async function getReviews(locale: Locale): Promise<Review[]> {
  return getDictionary(locale).reviews.list.map((r, i) => ({
    id: `rev-${i + 1}`,
    ...r,
  }));
  // LATER: return fetch(`/api/reviews?locale=${locale}`).then((r) => r.json());
}

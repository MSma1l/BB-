import type { GalleryCategory, GalleryItem } from "@/lib/types";

// Gallery items. TODAY these are category placeholders (CSS pattern + emoji,
// per the DC prototype). LATER they map to real photos in /public/uploads.
// Category labels are localized in the dictionary (`gallery.cats`).

const order: GalleryCategory[] = [
  "weddings",
  "arches",
  "photozones",
  "weddings",
  "corporate",
  "birthdays",
  "arches",
  "photozones",
  "weddings",
  "birthdays",
  "corporate",
  "weddings",
];

export const galleryItems: GalleryItem[] = order.map((category, i) => ({
  id: `g-${i + 1}`,
  category,
}));

/** Visual placeholder per category — CSS gradient + emoji icon. */
export const categoryMeta: Record<
  GalleryCategory,
  { bg: string; icon: string }
> = {
  weddings: {
    bg: "repeating-linear-gradient(135deg,#1b0a10,#1b0a10 12px,#240f1a 12px,#240f1a 24px)",
    icon: "💍",
  },
  arches: {
    bg: "repeating-linear-gradient(135deg,#160a14,#160a14 12px,#26102b 12px,#26102b 24px)",
    icon: "🎈",
  },
  photozones: {
    bg: "repeating-linear-gradient(135deg,#170a0a,#170a0a 12px,#2c1410 12px,#2c1410 24px)",
    icon: "📸",
  },
  birthdays: {
    bg: "repeating-linear-gradient(135deg,#0f0a16,#0f0a16 12px,#1e1230 12px,#1e1230 24px)",
    icon: "🎂",
  },
  corporate: {
    bg: "repeating-linear-gradient(135deg,#0d0a0a,#0d0a0a 12px,#231a0f 12px,#231a0f 24px)",
    icon: "🏢",
  },
};

/** The filter chips shown above the gallery grid. */
export const galleryFilters: ("all" | GalleryCategory)[] = [
  "all",
  "weddings",
  "birthdays",
  "photozones",
  "arches",
  "corporate",
];

// BACKEND: replace the body to fetch real gallery items from the API.
export async function getGallery(): Promise<GalleryItem[]> {
  return galleryItems;
  // LATER: return fetch("/api/gallery").then((r) => r.json());
}

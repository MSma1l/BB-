import type { MetadataRoute } from "next";

// Required for `output: export` (Next 16) so this route is emitted statically.
export const dynamic = "force-static";

// Generated at build → out/sitemap.xml (static export). The site is a single
// landing page; locales (RU/RO/EN) switch client-side on the same URL.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://balloonsbreeze.md",
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}

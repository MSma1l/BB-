import type { MetadataRoute } from "next";

// Required for `output: export` (Next 16) so this route is emitted statically.
export const dynamic = "force-static";

// Generated at build → out/robots.txt (static export). Allows crawling except
// the admin route; points crawlers at the sitemap.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/admin-bb",
    },
    sitemap: "https://balloonsbreeze.md/sitemap.xml",
    host: "https://balloonsbreeze.md",
  };
}

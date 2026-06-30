import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Frontend-only build: ships as plain static files (see ARCHITECTURE.md).
  output: "export",
  // next/image optimization needs a server; static export has none.
  images: { unoptimized: true },
  // Emit /about/index.html style folders so the export hosts cleanly anywhere.
  trailingSlash: true,
};

export default nextConfig;

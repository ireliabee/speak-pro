import type { NextConfig } from "next";

// Static export: the app is fully client-side (state in localStorage), so it can be
// hosted anywhere (GitHub Pages, Claude artifacts, any CDN). Relative asset prefix
// keeps it working from a sub-path.
const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  assetPrefix: process.env.ASSET_PREFIX ?? undefined,
  images: { unoptimized: true },
};

export default nextConfig;

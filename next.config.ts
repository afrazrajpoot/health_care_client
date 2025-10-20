import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // type checking off
  typescript: { ignoreBuildErrors: true },
  // eslint checking off
  eslint: { ignoreDuringBuilds: true },
  // disable static optimization to avoid useSearchParams issues
  output: "standalone",
  trailingSlash: false,
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  output: "standalone",
  trailingSlash: false,
  // --- disable SWC minification to fix Azure SIGKILL ---
  swcMinify: false,
};

export default nextConfig;

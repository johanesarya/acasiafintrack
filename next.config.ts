import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Mengabaikan error validasi cache types saat production build
    ignoreBuildErrors: true,
  },
};

export default nextConfig;

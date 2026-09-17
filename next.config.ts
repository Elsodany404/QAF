import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["v5jd33rn-3000.uks1.devtunnels.ms", "localhost:3000"],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
        pathname: "/photos/**",
      },
      {
        protocol: "https",
        hostname: "bdksjsmaqssxasrlyzci.supabase.co",
        pathname: "/storage/v1/object/sign/**",
      },
    ],
    qualities: [25, 50, 70, 100],
  },
};

export default nextConfig;

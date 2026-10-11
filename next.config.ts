import type { NextConfig } from "next";

import { getSiteUrl } from "./src/lib/siteUrl";

// Server actions only accept requests from the site's own host
// (NEXT_PUBLIC_SITE_URL).
function serverActionOrigins(): string[] {
  try {
    return [new URL(getSiteUrl()).host];
  } catch {
    // Missing NEXT_PUBLIC_SITE_URL: same-origin only. Auth and payments
    // report the missing variable themselves.
    return [];
  }
}

// Product images live in this project's Supabase storage.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { allowedOrigins: serverActionOrigins() },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
        pathname: "/photos/**",
      },
      ...(supabaseHost
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHost,
              pathname: "/storage/v1/object/**",
            },
          ]
        : []),
    ],
    qualities: [25, 50, 70, 100],
  },
};

export default nextConfig;

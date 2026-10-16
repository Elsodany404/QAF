import type { NextConfig } from "next";

import { remoteImageSources } from "./src/lib/imageHosts";
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

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    serverActions: { allowedOrigins: serverActionOrigins() },
    // Required by forbidden() in the admin pages.
    authInterrupts: true,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  images: {
    remotePatterns: remoteImageSources().map(
      ({ hostname, pathnamePrefix }) => ({
        protocol: "https" as const,
        hostname,
        pathname: `${pathnamePrefix}**`,
      }),
    ),
    qualities: [25, 50, 70, 100],
  },
};

export default nextConfig;

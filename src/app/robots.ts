import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/siteUrl";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Account, checkout and admin pages are personal or private.
      disallow: [
        "/admin",
        "/api/",
        "/checkout",
        "/empty-cart",
        "/order-success/",
        "/user",
        "/sign-in",
        "/sign-up",
        "/forgot-password",
        "/reset-password",
        "/verify-email",
      ],
    },
    sitemap: siteUrl("/sitemap.xml"),
  };
}

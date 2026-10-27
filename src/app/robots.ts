import type { MetadataRoute } from "next";
import { localizePath } from "@/i18n/config";
import { siteUrl } from "@/lib/siteUrl";

// Account, checkout and admin pages are personal or private.
const PRIVATE_PAGES = [
  "/checkout",
  "/empty-cart",
  "/order-success/",
  "/user",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/api/",
        ...PRIVATE_PAGES,
        // The same pages in English.
        ...PRIVATE_PAGES.map((path) => localizePath("en", path)),
      ],
    },
    sitemap: siteUrl("/sitemap.xml"),
  };
}

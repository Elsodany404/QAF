import type { MetadataRoute } from "next";
import { DEFAULT_LOCALE, LOCALES, localizePath } from "@/i18n/config";
import { siteUrl } from "@/lib/siteUrl";
import { getAllProducts } from "@/services/Product";

// Picks up new products without a redeploy.
export const revalidate = 3600;

/** A page in every language, each listing the others as alternates. */
function entries(path: string): MetadataRoute.Sitemap {
  const languages = {
    ...Object.fromEntries(
      LOCALES.map((locale) => [locale, siteUrl(localizePath(locale, path))]),
    ),
    "x-default": siteUrl(localizePath(DEFAULT_LOCALE, path)),
  };
  return LOCALES.map((locale) => ({
    url: siteUrl(localizePath(locale, path)),
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ["/", "/menu", "/about", "/contact", "/policies"].flatMap(
    entries,
  );

  try {
    const products = await getAllProducts();
    return [
      ...pages,
      ...products.flatMap(({ product }) =>
        entries(`/products/${product.id}`),
      ),
    ];
  } catch (error) {
    console.error("Sitemap: couldn't load products", error);
    return pages;
  }
}

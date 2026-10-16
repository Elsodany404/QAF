import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/siteUrl";
import { getAllProducts } from "@/services/Product";

// Picks up new products without a redeploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ["/", "/menu", "/about", "/contact", "/policies"].map(
    (path) => ({ url: siteUrl(path) }),
  );

  try {
    const products = await getAllProducts();
    return [
      ...pages,
      ...products.map(({ product }) => ({
        url: siteUrl(`/products/${product.id}`),
      })),
    ];
  } catch (error) {
    console.error("Sitemap: couldn't load products", error);
    return pages;
  }
}

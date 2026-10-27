import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { productDescription, productName } from "@/i18n/catalog";
import { alternates } from "@/i18n/metadata";
import { getLocale } from "@/i18n/server";
import { getProductByID, getAllProducts } from "@/services/Product";
import ProductClient from "./productClient";
import { DataItem } from "@/types/customTypes";

// Re-render at most every 5 minutes so price and stock changes show up
// without a redeploy.
export const revalidate = 300;

type ProductPageProps = {
  params: Promise<{ productID: string }>;
};

// generateMetadata and the page both need the product; fetch it once.
const getProduct = cache(getProductByID);

export async function generateStaticParams() {
  const dataItems: DataItem[] = await getAllProducts();

  return dataItems.map(({ product }) => ({
    productID: product.id.toString(),
  }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const [{ productID }, locale] = await Promise.all([params, getLocale()]);
  const data = await getProduct(productID);
  if (!data) return {};

  const name = productName(data.product, locale);
  const description = productDescription(data.product, locale);
  return {
    title: name,
    description,
    alternates: alternates(locale, `/products/${data.product.id}`),
    // Link previews (WhatsApp, Facebook) show the product photo.
    openGraph: {
      title: name,
      description,
      images: [{ url: data.product.imageUrl, alt: name }],
    },
  };
}

export default async function Page({ params }: ProductPageProps) {
  const { productID } = await params;

  const data = await getProduct(productID);

  if (!data) {
    notFound();
  }

  return <ProductClient data={data} />;
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
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
  const { productID } = await params;
  const data = await getProduct(productID);
  if (!data) return {};

  return {
    title: data.product.name,
    description: data.product.description,
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

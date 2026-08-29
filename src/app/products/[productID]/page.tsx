// export default Product;
import { notFound } from "next/navigation";
import { getProductByID, getAllProducts } from "@/services/Product";
import ProductClient from "./productClient";
import { DataItem } from "@/types/customTypes";

export async function generateStaticParams() {
  const dataItems: DataItem[] = await getAllProducts();

  return dataItems.map(({ product }) => ({
    productID: product.id.toString(),
  }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ productID: string }>;
}) {
  const { productID } = await params;

  const data = await getProductByID(Number(productID));

  if (!data) {
    notFound();
  }

  return <ProductClient data={data} />;
}

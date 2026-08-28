// export default Product;
import { notFound } from "next/navigation";
import { getProductByID, getAllProducts } from "@/services/Product";
import ProductClient from "./productClient";

export async function generateStaticParams() {
  const products = await getAllProducts();

  return products.map((product) => ({
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

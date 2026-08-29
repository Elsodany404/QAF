import {  getProducts } from "@/services/Product";
import EmptyList from "../EmptyList/EmptyList";
import ProductCard from "../ProductCard/ProductCard";
import type { DataItem } from "@/types/customTypes";

type ProductListProps = {
  search?: string;
  category?: string;
  isFeatured?: boolean;
};

async function ProductList({
  search = "",
  category = "all",
  isFeatured = false,
}: ProductListProps) {

  const dataItems: DataItem[] = await getProducts({
    search,
    category,
    isFeatured,
  });
  const query = search.trim().toLowerCase();

  const filteredProducts = dataItems.filter(({ product }) => {
    const matchesCategory = category === "all" || product.category === category;

    const matchesSearch =
      !query ||
      product.name?.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query);

    const featuredProduct = !isFeatured || product.featured;
    return matchesCategory && matchesSearch && featuredProduct;
  });

  if (filteredProducts.length === 0) {
    return <EmptyList />;
  }

  return (
    <div className="productGrid">
      {filteredProducts.map((item) => (
        <div key={item.product.id}>
          <ProductCard dataItem={item} />
        </div>
      ))}
    </div>
  );
}

export default ProductList;

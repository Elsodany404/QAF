import { getProducts } from "@/services/Product";
import EmptyList from "../EmptyList/EmptyList";
import ProductCard from "../ProductCard/ProductCard";

type ProductListProps = {
  search?: string;
  category?: string;
  isFeatured?: boolean;
};

// Roughly the first row on a wide screen; the rest load as they scroll in.
const EAGER_CARDS = 4;

async function ProductList({
  search = "",
  category = "all",
  isFeatured = false,
}: ProductListProps) {
  // getProducts already filters by search, category and "featured".
  const dataItems = await getProducts({ search, category, isFeatured });

  if (dataItems.length === 0) {
    // "No coffee found — reset filters" only makes sense on the menu.
    return isFeatured ? null : <EmptyList />;
  }

  return (
    // A short featured list is centred rather than left with empty columns.
    <div className={isFeatured ? "productGridCentered" : "productGrid"}>
      {dataItems.map((item, index) => (
        <div key={item.product.id}>
          <ProductCard dataItem={item} eager={index < EAGER_CARDS} />
        </div>
      ))}
    </div>
  );
}

export default ProductList;

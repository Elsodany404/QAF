import { useState } from "react";
import { ShoppingCart, Star } from "lucide-react";
// Assuming Next.js, change to 'react-router-dom' if using Vite
import type { Product, OptionValue } from "../../types/db";
import { useCart } from "../../context/CartContext";
import styles from "./ProductCard.module.css";
import { useQuery } from "@tanstack/react-query";
import { getOptions } from "../../services/Product";
import { getOptionValues } from "../../helper/helper";
import { NavLink } from "react-router-dom";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { data } = useQuery({
    queryKey: ["productOptions", product.id],
    queryFn: () => getOptions(product.id),
    enabled: !!product.id,
  });

  const sizes = getOptionValues("size", data);
  const roasting = getOptionValues("roasting", data);

  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  // States for card selection
  const [selectedWeightID, setSelectedWeightID] = useState<number>(3);
  const [selectedRoastID, setSelectedRoastID] = useState<number | null>(null);

  const selectedWeight = sizes?.find(
    (s: OptionValue) => s.id === selectedWeightID,
  );

  // Safe fallback to prevent NaN if priceModifier is missing
  const displayPrice = product.price + (selectedWeight?.priceModifier ?? 0);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevents navigating to the product page when clicking "Add"
    // addItem();
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  // Build dynamic URL with query parameters for user selections
  const productLink = {
    pathname: `/products/${product.id}`,
    query: {
      size: selectedWeightID,
      ...(selectedRoastID && { roast: selectedRoastID }),
    },
  };
  return (
    // Wrap the entire card container in a Link
    <NavLink to={productLink} className={styles.cardLink}>
      <div className={styles.card}>
        <div className={styles.imageWrap}>
          <img
            src={product.imageUrl!}
            alt={product.name!}
            className={styles.image}
          />
          <div className={styles.overlay} />

          {product.featured && (
            <div className={styles.featured}>
              <div className={styles.featuredBadge}>
                <Star />
                Featured
              </div>
            </div>
          )}

          {!product.inStock && (
            <div className={styles.outOfStockOverlay}>
              <div className={styles.outOfStockBox}>
                <p className={styles.outOfStockTitle}>Coming Soon</p>
                <p className={styles.outOfStockText}>Currently restocking</p>
              </div>
            </div>
          )}
        </div>

        <div className={styles.content}>
          <h3 className={styles.title}>{product.name}</h3>
          {product.description && (
            <p className={styles.description}>{product.description}</p>
          )}

          {sizes && (
            <div className={styles.weightRow}>
              {sizes.map((sizeOption: OptionValue) => (
                <button
                  key={sizeOption.id}
                  onClick={(e) => {
                    e.preventDefault(); // Stop Link navigation
                    setSelectedWeightID(sizeOption.id);
                  }}
                  className={`${styles.weightButton} ${selectedWeightID === sizeOption.id ? styles.weightButtonActive : ""}`}
                >
                  {sizeOption.label}
                </button>
              ))}
            </div>
          )}

          {roasting && (
            <div className={styles.weightRow}>
              {roasting.map((option: OptionValue) => (
                <button
                  key={option.id}
                  onClick={(e) => {
                    e.preventDefault(); // Stop Link navigation
                    setSelectedRoastID(option.id);
                  }}
                  className={`${styles.weightButton} ${selectedRoastID === option.id ? styles.weightButtonActive : ""}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}

          <div className={styles.footer}>
            <div className={styles.priceWrap}>
              <span className={styles.price}>${displayPrice.toFixed(2)}</span>
              <span className={styles.unitLabel}>Per unit</span>
            </div>
            <button
              onClick={handleAdd}
              disabled={!product.inStock}
              className={`${styles.addButton} ${added ? styles.addButtonAdded : ""} ${!product.inStock ? styles.addButtonDisabled : ""}`}
            >
              <ShoppingCart />
              <span>{added ? "Added!" : "Add"}</span>
            </button>
          </div>
        </div>
      </div>
    </NavLink>
  );
}

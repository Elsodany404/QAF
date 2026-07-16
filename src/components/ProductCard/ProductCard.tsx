import { useState } from "react";
import { ShoppingCart, Star } from "lucide-react";
import type { Product, WeightOption } from "../../lib/database.types";
import { useCart } from "../../context/CartContext";
import styles from "./ProductCard.module.css";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const [selectedWeight, setSelectedWeight] = useState<WeightOption | null>(
    product.weight_options.length > 0 ? product.weight_options[0] : null,
  );
  const [added, setAdded] = useState(false);

  const displayPrice = product.price + (selectedWeight?.price_modifier ?? 0);

  const handleAdd = () => {
    addItem(product, selectedWeight);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const categoryLabel: Record<string, string> = {
    turkish_coffee: "Turkish Coffee",
    espresso: "Espresso",
    flavored_coffee: "Flavored",
  };

  const subcategoryLabel: Record<string, string> = {
    qaf_blend: "Qaf Blend",
    colombian_blend: "Colombian Blend",
    golden_blend: "Golden Blend",
  };

  return (
    <div className={styles.card}>
      <div className={styles.imageWrap}>
        <img
          src={product.image_url}
          alt={product.name}
          className={styles.image}
        />
        <div className={styles.overlay} />

        <div className={styles.badges}>
          <span className={styles.badge}>
            {categoryLabel[product.category]}
          </span>
          {product.subcategory && (
            <span className={styles.badgeAlt}>
              {subcategoryLabel[product.subcategory]}
            </span>
          )}
        </div>

        {product.featured && (
          <div className={styles.featured}>
            <div className={styles.featuredBadge}>
              <Star className="w-3.5 h-3.5 fill-current" />
              Featured
            </div>
          </div>
        )}

        {!product.in_stock && (
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
        <p className={styles.description}>{product.description}</p>

        {product.weight_options.length > 0 && (
          <div className={styles.weightRow}>
            {product.weight_options.map((opt) => (
              <button
                key={opt.label}
                onClick={() => setSelectedWeight(opt)}
                className={`${styles.weightButton} ${selectedWeight?.label === opt.label ? styles.weightButtonActive : ""}`}
              >
                {opt.label}
                {opt.price_modifier > 0 && (
                  <span className={styles.weightModifier}>
                    +${opt.price_modifier}
                  </span>
                )}
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
            disabled={!product.in_stock}
            className={`${styles.addButton} ${added ? styles.addButtonAdded : ""} ${!product.in_stock ? styles.addButtonDisabled : ""}`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{added ? "Added!" : "Add"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// import { useState } from "react";
import { ShoppingCart, Star } from "lucide-react";
import type { OptionValue, Product } from "../../types/db";
import styles from "./ProductCard.module.css";
import { useQuery } from "@tanstack/react-query";
import { getProductByID } from "../../services/Product";

import { useCart } from "../../context/CartContext";
import Spinner from "../Spinner/Spinner";
import { useState } from "react";
import { calcPrice, formatCurrency, generateItemID } from "../../helper/helper";
import { NavLink } from "react-router-dom";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { data, isLoading } = useQuery({
    queryKey: ["product", product?.id],
    queryFn: () => getProductByID(product.id),
    enabled: Boolean(product?.id),
    select: (productData) => ({
      size: productData?.options?.find((op) => op.name === "Size"),
      roast: productData?.options?.find((op) => op.name === "Roast"),
      options: productData?.options,
    }),
  });

  const defaultSize = data?.size?.defaultValue;
  const defaultRoast = data?.roast?.defaultValue;

  const otherDefaultValues =
    data?.options
      ?.filter((op) => op.name !== "Size" && op.name !== "Roast")
      ?.map((op) => op.defaultValue) ?? [];

  const [selectedWeight, setSelectedWeight] = useState<OptionValue | null>(
    null,
  );
  const [selectedRoast, setSelectedRoast] = useState<OptionValue | null>(null);

  const activeWeight = selectedWeight ?? defaultSize;
  const activeRoast = selectedRoast ?? defaultRoast;

  const selectedValues = [
    activeRoast,
    activeWeight,
    ...otherDefaultValues,
  ].filter((v) => v !== undefined);

  const finalPrice = calcPrice(product, selectedValues);

  function handleAdd(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    e.preventDefault();
    const item = {
      itemID: generateItemID(product, selectedValues),
      product,
      options: selectedValues,
      quantity: 1,
      itemPrice: finalPrice,
    };
    addItem(item);
  }

  const link = `/products/${product.id}`;

  return (
    <NavLink to={link} className={styles.cardLink} state={selectedValues}>
      <div className={styles.card}>
        {isLoading && <Spinner pagination={false} />}

        <div className={styles.imageWrap}>
          <img
            src={product.imageUrl || undefined}
            alt={product.name!}
            className={styles.image}
          />
          <div className={styles.overlay} />
          {product.category === "turkish" ? (
            <div className={`${styles.badges} ${styles.badgeAlt}`}>
              {product.name?.split("|")[1].toUpperCase()}
            </div>
          ) : (
            <div className={`${styles.badges} ${styles.badge}`}>
              {product.category?.toUpperCase()}
            </div>
          )}
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

          {data?.size && (
            <div className={styles.weightRow}>
              {data?.size?.values.map((s: OptionValue) => (
                <button
                  key={s.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation(); 
                    setSelectedWeight(s);
                  }}
                  className={`${styles.weightButton} ${activeWeight?.id === s.id ? styles.weightButtonActive : ""}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {data?.roast && (
            <div className={styles.weightRow}>
              {data.roast.values.map((value: OptionValue) => {
                return (
                  <button
                    key={value.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation(); // Stop Link navigation
                      setSelectedRoast(value);
                    }}
                    className={`${styles.weightButton} ${activeRoast?.id === value.id ? styles.weightButtonActive : ""}`}
                  >
                    {value.label}
                  </button>
                );
              })}
            </div>
          )}

          <div className={styles.footer}>
            <div className={styles.priceWrap}>
              <span className={styles.price}>{formatCurrency(finalPrice)}</span>
              <span className={styles.unitLabel}>Per unit</span>
            </div>

            <button
              onClick={handleAdd}
              disabled={!product.inStock}
              className={`${styles.addButton} ${!product.inStock ? styles.addButtonDisabled : ""}`}
            >
              <ShoppingCart />

              <span>Add</span>
            </button>
          </div>
        </div>
      </div>
    </NavLink>
  );
}

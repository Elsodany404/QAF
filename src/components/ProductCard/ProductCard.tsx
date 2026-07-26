import { useState } from "react";
import { ShoppingCart, Star } from "lucide-react";
// Assuming Next.js, change to 'react-router-dom' if using Vite
import type { Product, OptionValue } from "../../types/db";
import styles from "./ProductCard.module.css";
import { useQuery } from "@tanstack/react-query";
import { getProductByID } from "../../services/Product";
import { NavLink } from "react-router-dom";
import {
  calcPrice,
  formatCurrency,
  generateItemID,
  getOptionByName,
  getOptionsDefaultValues,
} from "../../helper/helper";
import { useCart } from "../../context/CartContext";
import { Spinner } from "../Spinner/Spinner";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { data, isLoading } = useQuery({
    queryKey: ["productOptions", product.id],
    queryFn: () => getProductByID(product.id),
  });
  const options = data?.ProductOptions.map((po) => po.optionID);

  const [selectedWeight, setSelectedWeight] = useState<OptionValue | null>(
    null,
  );
  const [selectedRoast, setSelectedRoast] = useState<OptionValue | null>(null);

  // 3. Early return if data is still loading to prevent operations on missing values
  if (isLoading || !options) {
    return <Spinner size="md" variant="espresso" label="loading options"/>;
  }
  
  const sizeArr = getOptionByName("size", options) ?? [];
  const roastArr = getOptionByName("roasting", options) ?? [];

  // 1. Derive active options immediately (Fallback: state -> default -> first item -> null)
  const activeWeight = selectedWeight ?? sizeArr.find((s) => s.default);

  const activeRoast = selectedRoast ?? roastArr.find((r) => r.default);

  const selectedOptions: OptionValue[] = [];

  if (activeWeight) {
    selectedOptions.push(activeWeight);
  }
  if (activeRoast) {
    selectedOptions.push(activeRoast);
  }
  const optionsDefaultValues = getOptionsDefaultValues(options);

  if (optionsDefaultValues) {
    optionsDefaultValues.forEach((v) => {
      if (selectedOptions.find((s) => s.id === v.id)) return;
      selectedOptions.push(v);
    });
  }
  console.log(optionsDefaultValues);
  console.log(selectedOptions);
  // 2. Calculate price cleanly (safely ignores null values)
  const finalPrice = calcPrice(product, selectedOptions);

  // 3. Build URL safely without 'undefined' query params
  const searchParams = new URLSearchParams();
  if (activeWeight?.id) searchParams.set("size", String(activeWeight.id));
  if (activeRoast?.id) {
    searchParams.set("roast", String(activeRoast.id));
  }
  function handleAdd(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    e.preventDefault();
    const item = {
      itemID: generateItemID(product, selectedOptions),
      product,
      options: selectedOptions,
      quantity: 1,
      itemPrice: finalPrice,
    };
    addItem(item);
  }

  const link = `/products/${product.id}${
    searchParams.toString() ? `?${searchParams.toString()}` : ""
  }`;
  return (
    <NavLink to={link} className={styles.cardLink}>
      <div className={styles.card}>
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

          {sizeArr && (
            <div className={styles.weightRow}>
              {sizeArr.map((s: OptionValue) => (
                <button
                  key={s.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation(); // Stop Link navigation
                    setSelectedWeight(s);
                  }}
                  className={`${styles.weightButton} ${activeWeight?.id === s.id ? styles.weightButtonActive : ""}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {roastArr.length > 0 && (
            <div className={styles.weightRow}>
              {roastArr.map((value: OptionValue) => {
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

"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Star } from "lucide-react";

import { announceAddToCart, useCart } from "@/context/CartContext";
import type { DataItem } from "@/types/customTypes";
import type { OptionValue } from "@/types/db";
import {
  calcPrice,
  categoryLabel,
  formatCurrency,
  generateItemID,
} from "@/utils/helper";
import styles from "./ProductCard.module.css";

// Options a shopper can change on the card; the rest use their default.
const CARD_OPTIONS = ["Size", "Roast"];

type ProductCardProps = {
  dataItem: DataItem;
  /** Load the photo right away (first cards on the page). */
  eager?: boolean;
};

export default function ProductCard({ dataItem, eager = false }: ProductCardProps) {
  const { addItem } = useCart();
  const [imageLoading, setImageLoading] = useState(true);
  const [chosen, setChosen] = useState<Record<number, OptionValue>>({});
  const { product, options } = dataItem;

  const selectedValues = options
    .map((option) => chosen[option.id] ?? option.defaultValue)
    .filter((value): value is OptionValue => value !== undefined);
  const finalPrice = calcPrice(product, selectedValues);
  const isAvailable =
    product.inStock && selectedValues.every((value) => value.inStock);

  function handleAdd() {
    if (!isAvailable) return;
    const result = addItem({
      itemID: generateItemID(
        product.id,
        selectedValues.map((value) => value.id),
      ),
      product,
      options: selectedValues,
      quantity: 1,
      itemPrice: finalPrice,
    });
    announceAddToCart(result, product.name);
  }

  const link = `/products/${product.id}`;
  // Turkish blends are named "Turkish coffee | <Blend>"; badge the blend.
  const blendName = product.name?.split("|")[1]?.trim();

  return (
    <article className={styles.card}>
      <div className={styles.imageWrap}>
        {imageLoading && (
          <Image
            fill
            src={product["blurred-image"]}
            alt=""
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, 50vw"
            className={styles.image}
            loading={eager ? "eager" : "lazy"}
          />
        )}
        <Image
          fill
          src={product.imageUrl}
          alt={product.name}
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, 50vw"
          className={styles.image}
          loading={eager ? "eager" : "lazy"}
          onLoad={() => setImageLoading(false)}
        />
        <div className={styles.overlay} />
        {product.category === "turkish" && blendName ? (
          <div className={`${styles.badges} ${styles.badgeAlt}`}>
            {blendName.toUpperCase()}
          </div>
        ) : (
          <div className={`${styles.badges} ${styles.badge}`}>
            {categoryLabel(product.category).toUpperCase()}
          </div>
        )}
        {product.featured && (
          <div className={styles.featuredBadge}>
            <Star aria-hidden="true" />
            Featured
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
        <h3 className={styles.title}>
          <Link href={link} className={styles.titleLink}>
            {product.name}
          </Link>
        </h3>

        {options
          .filter((option) => CARD_OPTIONS.includes(option.name))
          .map((option) => {
            const active = chosen[option.id] ?? option.defaultValue;
            return (
              <div
                key={option.id}
                className={styles.weightRow}
                role="group"
                aria-label={option.name}
              >
                {option.values.map((value) => (
                  <button
                    key={value.id}
                    type="button"
                    onClick={() =>
                      setChosen((prev) => ({ ...prev, [option.id]: value }))
                    }
                    disabled={!value.inStock}
                    aria-pressed={active?.id === value.id}
                    title={value.inStock ? undefined : "Sold out"}
                    className={`${styles.weightButton} ${active?.id === value.id ? styles.weightButtonActive : ""}`}
                  >
                    {value.label}
                  </button>
                ))}
              </div>
            );
          })}

        <div className={styles.footer}>
          <div className={styles.priceWrap}>
            <span className={styles.price}>{formatCurrency(finalPrice)}</span>
            <span className={styles.unitLabel}>Per unit</span>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={!isAvailable}
            className={styles.addButton}
            aria-label={
              isAvailable ? `Add ${product.name} to cart` : `${product.name} is sold out`
            }
          >
            <ShoppingCart aria-hidden="true" />
            {isAvailable ? "Add" : "Sold out"}
          </button>
        </div>
      </div>
    </article>
  );
}

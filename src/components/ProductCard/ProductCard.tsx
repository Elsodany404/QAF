"use client";
import { ShoppingCart, Star } from "lucide-react";
import type { OptionValue, Product } from "../../types/db";
import styles from "./ProductCard.module.css";

import { useCart } from "../../context/CartContext";
import Spinner from "../Spinner/Spinner";
import { useState } from "react";
import { calcPrice, formatCurrency, generateItemID } from "../../helper/helper";
import Link from "next/link";
import Image from "next/image";
import { Button } from "../Button/Button";
import { DataItem } from "@/types/customTypes";

interface ProductCardProps {
  dataItem: DataItem;
}

export default function ProductCard({ dataItem }: ProductCardProps) {
  const { addItem } = useCart();
  const [imageLoading, setImageLoading] = useState(true);
  const { product, options } = dataItem;

  const sizeOption = options.find((op) => op.name === "Size");
  const roastOption = options.find((op) => op.name === "Roast");

  const defaultSize = sizeOption?.values.find((v) => v.default);
  const defaultRoast = roastOption?.values.find((v) => v.default);

  const otherDefaultValues =
    options
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
    <Link href={link} className={styles.cardLink}>
      <div className={styles.card}>
        <div className={styles.imageWrap}>
          {imageLoading && <Spinner variant="component" size="md" />}
          <Image
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            src={product.imageUrl}
            alt={product.name}
            className={styles.image}
            onLoad={() => setImageLoading(false)}
            quality={25}
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
                <Star style={{}} />
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

          {sizeOption && (
            <div className={styles.weightRow}>
              {sizeOption?.values
                .sort((a, b) => a.id - b.id)
                .map((s: OptionValue) => (
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

          {roastOption && (
            <div className={styles.weightRow}>
              {roastOption.values
                .sort((a, b) => a.id - b.id)
                .map((value: OptionValue) => {
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

            <Button handler={(e) => handleAdd(e)}>
              <Button.Icon>
                <ShoppingCart />
              </Button.Icon>
              <Button.Text>Add</Button.Text>
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}

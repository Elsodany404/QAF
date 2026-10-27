"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CreditCard, ShoppingCart } from "lucide-react";

import { announceAddToCart, useCart } from "@/context/CartContext";
import {
  categoryName,
  optionDescription,
  optionName,
  productDescription,
  productName,
  valueLabel,
} from "@/i18n/catalog";
import { format } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import type { DataItem } from "@/types/customTypes";
import type { OptionValue } from "@/types/db";
import { calcPrice, formatCurrency, generateItemID } from "@/utils/helper";
import styles from "./page.module.css";

interface ProductClientProps {
  data: DataItem;
}

export default function ProductClient({ data }: ProductClientProps) {
  const router = useRouter();
  const { locale, t, href } = useI18n();
  const { cart, addItem } = useCart();
  const [imageLoading, setImageLoading] = useState(true);
  const [chosen, setChosen] = useState<Record<number, OptionValue>>({});
  const { product, options } = data;
  const name = productName(product, locale);

  const selections = options
    .map((option) => chosen[option.id] ?? option.defaultValue)
    .filter((value): value is OptionValue => value !== undefined);
  const finalPrice = calcPrice(product, selections);
  const isAvailable =
    product.inStock && selections.every((selection) => selection.inStock);
  const itemID = generateItemID(
    product.id,
    selections.map((selection) => selection.id),
  );

  function addToCart() {
    return addItem({
      itemID,
      product,
      options: selections,
      quantity: 1,
      itemPrice: finalPrice,
    });
  }

  function handleAdd() {
    if (!isAvailable) return;
    announceAddToCart(addToCart(), name, t.cart);
  }

  // Buy now: put this choice in the cart (once — not one more each click)
  // and go to checkout.
  function handleBuyNow() {
    if (!isAvailable) return;
    if (!cart.some((item) => item.itemID === itemID)) {
      const result = addToCart();
      if (result !== "added") {
        announceAddToCart(result, name, t.cart);
        return;
      }
    }
    router.push(href("/checkout"));
  }

  const optionsWithNotes = options.filter((option) => option.description);

  return (
    <div className={styles.Product}>
      <div className={styles["sticky-box"]}>
        <div className={styles["image-box"]}>
          {imageLoading && (
            <Image
              sizes="(max-width: 768px) 100vw, 280px"
              fill
              loading="eager"
              src={product["blurred-image"]}
              alt=""
            />
          )}

          <Image
            sizes="(max-width: 768px) 100vw, 45vw"
            fill
            loading="eager"
            fetchPriority="high"
            src={product.imageUrl}
            onLoad={() => setImageLoading(false)}
            alt={name}
            quality={50}
          />
        </div>
      </div>

      <div className={styles["content-box"]}>
        <div>
          <p className={styles.subHeader}>
            {categoryName(t.categories, product.category)}
          </p>

          {/* A product without Arabic text shows its English text, which
              then keeps its own direction. */}
          <h1 className={styles.header}>
            <bdi>{name}</bdi>
          </h1>

          <div className={styles.description} dir="auto">
            {productDescription(product, locale)}
          </div>

          {optionsWithNotes.length > 0 && (
            <div className={styles.features}>
              {optionsWithNotes.map((option) => (
                <div key={option.id}>
                  <Image
                    src={option.icon}
                    width={40}
                    height={40}
                    alt=""
                    className={styles.iconImage}
                  />
                  <span dir="auto">{optionDescription(option, locale)}</span>
                </div>
              ))}
            </div>
          )}

          <form
            className={styles.options}
            onSubmit={(event) => event.preventDefault()}
          >
            {options.map((option) => {
              const active = chosen[option.id] ?? option.defaultValue;
              return (
                <fieldset key={option.id} className={styles.optionGroup}>
                  <legend>
                    {format(t.product.select, {
                      option: optionName(option, locale),
                    })}
                  </legend>

                  <div className={styles.choiceBar}>
                    {option.values.map((value) => (
                      <label key={value.id} className={styles.choice}>
                        <input
                          type="radio"
                          name={`option-${option.id}`}
                          value={value.id}
                          disabled={!value.inStock}
                          checked={active?.id === value.id}
                          onChange={() =>
                            setChosen((prev) => ({
                              ...prev,
                              [option.id]: value,
                            }))
                          }
                        />

                        <span>
                          {valueLabel(value, locale)}
                          {!value.inStock && t.product.soldOutSuffix}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              );
            })}
          </form>

          <div className={styles.callToAction}>
            <div className={styles.action}>
              <button
                type="button"
                className="premium-button premium-button-secondary"
                onClick={handleAdd}
                disabled={!isAvailable}
              >
                <ShoppingCart className="flipRtl" aria-hidden="true" />
                {t.product.addToCart}
              </button>

              <button
                type="button"
                className="premium-button premium-button-primary"
                disabled={!isAvailable}
                onClick={handleBuyNow}
              >
                <CreditCard aria-hidden="true" />
                {t.product.buyNow}
              </button>
            </div>
            <span className={styles.price}>
              {isAvailable ? (
                <>
                  <span className="srOnly">{t.product.price}</span>
                  {formatCurrency(finalPrice, locale)}
                </>
              ) : product.inStock ? (
                t.product.optionSoldOut
              ) : (
                t.product.outOfStock
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

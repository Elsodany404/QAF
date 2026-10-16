"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CreditCard, ShoppingCart } from "lucide-react";

import { announceAddToCart, useCart } from "@/context/CartContext";
import type { DataItem } from "@/types/customTypes";
import type { OptionValue } from "@/types/db";
import {
  calcPrice,
  categoryLabel,
  formatCurrency,
  generateItemID,
} from "@/utils/helper";
import styles from "./page.module.css";

interface ProductClientProps {
  data: DataItem;
}

export default function ProductClient({ data }: ProductClientProps) {
  const router = useRouter();
  const { cart, addItem } = useCart();
  const [imageLoading, setImageLoading] = useState(true);
  const [chosen, setChosen] = useState<Record<number, OptionValue>>({});
  const { product, options } = data;

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
    announceAddToCart(addToCart(), product.name);
  }

  // Buy now: put this choice in the cart (once — not one more each click)
  // and go to checkout.
  function handleBuyNow() {
    if (!isAvailable) return;
    if (!cart.some((item) => item.itemID === itemID)) {
      const result = addToCart();
      if (result !== "added") {
        announceAddToCart(result, product.name);
        return;
      }
    }
    router.push("/checkout");
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
            alt={product.name}
            quality={50}
          />
        </div>
      </div>

      <div className={styles["content-box"]}>
        <div>
          <p className={styles.subHeader}>{categoryLabel(product.category)}</p>

          <h1 className={styles.header}>{product.name}</h1>

          <div className={styles.description}>{product.description}</div>

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
                  <span>{option.description}</span>
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
                  <legend>Select {option.name}</legend>

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
                          {value.label}
                          {!value.inStock && " (sold out)"}
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
                <ShoppingCart aria-hidden="true" />
                Add to cart
              </button>

              <button
                type="button"
                className="premium-button premium-button-primary"
                disabled={!isAvailable}
                onClick={handleBuyNow}
              >
                <CreditCard aria-hidden="true" />
                Buy now
              </button>
            </div>
            <span className={styles.price}>
              {isAvailable ? (
                <>
                  <span className="srOnly">Price: </span>
                  {formatCurrency(finalPrice)}
                </>
              ) : product.inStock ? (
                "This option is sold out"
              ) : (
                "Out of stock"
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

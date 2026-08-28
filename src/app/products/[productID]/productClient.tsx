"use client";

import { CreditCard, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { OptionValue } from "@/types/db";
import { useCart } from "@/context/CartContext";
import Spinner from "@/components/Spinner/Spinner";
import { calcPrice, formatCurrency, generateItemID } from "@/helper/helper";

import styles from "./page.module.css";
import { constructedData } from "@/types/customTypes";

interface ProductClientProps {
  data: constructedData;
}

export default function ProductClient({ data }: ProductClientProps) {
  const router = useRouter();
  const { addItem } = useCart();

  const [imageLoading, setImageLoading] = useState(true);
  const [selections, setSelection] = useState<OptionValue[]>([]);

  const defaultSelections = data.options.map((option) => option.defaultValue);

  const effectiveSelections =
    selections.length > 0 ? selections : defaultSelections;

  const finalPrice = calcPrice(data.product, effectiveSelections);

  function handleSelectChange(chosenValue: OptionValue) {
    setSelection((prev) => {
      const current = prev.length > 0 ? prev : defaultSelections;

      return current.map((selection) =>
        selection.optionID === chosenValue.optionID ? chosenValue : selection,
      );
    });
  }

  function handleAdd() {
    const item = {
      itemID: generateItemID(data.product, effectiveSelections),
      product: data.product,
      options: effectiveSelections,
      quantity: 1,
      itemPrice: finalPrice,
    };

    addItem(item);
  }

  return (
    <div className={styles.Product}>
      <div className={styles["sticky-box"]}>
        <div className={styles["image-box"]}>
          {imageLoading && (
            <Spinner label="loading image" variant="component" size="lg" />
          )}

          <Image
            sizes="(max-width: 768px) 100vw, 1200px"
            quality={50}
            fill
            priority
            src={data.product.imageUrl}
            onLoad={() => setImageLoading(false)}
            alt={data.product.name}
          />
        </div>
      </div>

      <div className={styles["content-box"]}>
        <div>
          <h3 className={styles.subHeader}>{data.product.category}</h3>

          <h1 className={styles.header}>{data.product.name}</h1>

          <div className={styles.description}>{data.product.description}</div>

          <div className={styles.features}>
            {data.options.map((option) => (
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

          <form className={styles.options}>
            {data.options.map((option) => (
              <fieldset key={option.id} className={styles.optionGroup}>
                <legend>Select {option.name}</legend>

                <div className={styles.choiceBar}>
                  {option.values
                    .sort((a, b) => a.id - b.id)
                    .map((value) => (
                      <label key={value.id} className={styles.choice}>
                        <input
                          type="radio"
                          required
                          name={`option-${option.id}`}
                          value={value.id}
                          checked={effectiveSelections.some(
                            (selected) => selected.id === value.id,
                          )}
                          onChange={() => handleSelectChange(value)}
                        />

                        <span>{value.label}</span>
                      </label>
                    ))}
                </div>
              </fieldset>
            ))}
          </form>

          <div className={styles.callToAction}>
            <span className={styles.price}>{formatCurrency(finalPrice)}</span>

            <div className={styles.action}>
              <button
                type="button"
                className="premium-button premium-button-secondary"
                onClick={handleAdd}
              >
                <ShoppingCart />
                Add to cart
              </button>

              <button
                type="button"
                className="premium-button premium-button-primary"
                onClick={() => {
                  handleAdd();
                  router.push("/checkout");
                }}
              >
                <CreditCard />
                Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

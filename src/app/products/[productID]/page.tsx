"use client";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import type { OptionValue, Product } from "@/types/db";
import styles from "./page.module.css";
import { useEffect, useState } from "react";
import { CreditCard, ShoppingCart } from "lucide-react";
import Spinner from "@/components/Spinner/Spinner";
import { calcPrice, formatCurrency, generateItemID } from "@/helper/helper";
import { getProductByID } from "@/services/Product";
import ErrorFallback from "@/app/error";
import { useCart } from "@/context/CartContext";
import Image from "next/image";

function Product() {
  // get url information
  const router = useRouter();
  const [imageLoading, setImageLoading] = useState(true);
  const { addItem } = useCart();
  const { productID } = useParams<{ productID: string }>();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["product", productID],
    queryFn: () => getProductByID(Number(productID)),
    enabled: Boolean(productID),
  });

  const [selections, setSelection] = useState<OptionValue[]>([]);

  const defaultSelections =
    data?.options.map((option) => option.defaultValue) ?? [];

  const effectiveSelections =
    selections.length > 0 ? selections : defaultSelections;

  if (isError) {
    return (
      <ErrorFallback
        error={error as Error}
        reset={refetch} // Clicking 'Try Again' calls refetch()
      />
    );
  }
  if (isLoading || !data) {
    return <Spinner variant="page" size="lg" />;
  }

  const { product } = data;
  const handleSelectChange = (chosenValue: OptionValue) => {
    setSelection((prev) => {
      const current = prev.length > 0 ? prev : defaultSelections;

      return current.map((selection) =>
        selection.optionID === chosenValue.optionID ? chosenValue : selection,
      );
    });
  };
  function handleAdd(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    e.preventDefault();
    const item = {
      itemID: generateItemID(product, effectiveSelections),
      product: product,
      options: selections,
      quantity: 1,
      itemPrice: finalPrice,
    };
    addItem(item);
  }
  const finalPrice = calcPrice(data.product, effectiveSelections);

  return (
    <div className={styles.Product}>
      <div className={styles["sticky-box"]}>
        <div className={styles["image-box"]}>
          {imageLoading && (
            <Spinner label="loading image" variant="component" size="lg" />
          )}
          <Image
            sizes="(max-width: 768px) 100vw, 1400px"
            quality={100}
            fill
            priority={true}
            src={`${data.product.imageUrl}`}
            onLoad={() => setImageLoading(false)}
            alt="product image"
          />
        </div>
      </div>
      <div className={styles["content-box"]}>
        <div>
          <h3 className={styles.subHeader}>{data.product.category}</h3>
          <h1 className={styles.header}>{data.product.name}</h1>
          <div className={styles.description}>{data.product.description}</div>
          <div className={styles.features}>
            {data.options.map((op) => (
              <div key={op.id}>
                <Image
                  src={`${op.icon}`}
                  width={40}
                  height={40}
                  alt=""
                  className={styles.iconImage}
                />
                <span>{op.description}</span>
              </div>
            ))}
          </div>
          <form className={styles.options}>
            {data.options.map((option) => (
              <fieldset key={option.id} className={styles.optionGroup}>
                <legend>{`Select ${option.name}`}</legend>

                <div className={styles.choiceBar}>
                  {option.values.map((value) => {
                    return (
                      <label key={value.id} className={styles.choice}>
                        <input
                          type="radio"
                          required
                          name={`option-${option.id}`}
                          value={value.id}
                          checked={effectiveSelections.some(
                            (v) => v.id === value.id,
                          )}
                          onChange={() => handleSelectChange(value)}
                        />

                        <span>{value.label}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </form>
          <div className={styles.callToAction}>
            <span className={styles.price}>{formatCurrency(finalPrice)}</span>
            <div className={styles.action}>
              <button
                className="premium-button premium-button-secondary"
                onClick={handleAdd}
              >
                <ShoppingCart />
                add to cart
              </button>
              <button
                className="premium-button premium-button-primary"
                onClick={() => router.push("/checkout")}
              >
                <CreditCard />
                checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Product;

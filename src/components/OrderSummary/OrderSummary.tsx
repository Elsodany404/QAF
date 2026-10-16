"use client";

import Image from "next/image";

import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/utils/helper";
import styles from "./OrderSummary.module.css";

function OrderSummary() {
  const {
    cart,
    cartPrice,
    cityName,
    shippingFees,
    shippingFeesLoading,
    shippingFeesError,
    cartLoaded,
  } = useCart();

  if (!cartLoaded) {
    return null;
  }

  let shipping: React.ReactNode;
  if (shippingFeesError) {
    shipping = (
      <span className={styles.summaryValueError}>Unavailable</span>
    );
  } else if (shippingFeesLoading) {
    shipping = <span className={styles.summaryValueMuted}>Calculating…</span>;
  } else if (shippingFees === null || !cityName) {
    shipping = (
      <span className={styles.summaryValueMuted}>Choose your city</span>
    );
  } else if (shippingFees === 0) {
    shipping = (
      <span className={`${styles.summaryValue} ${styles.summaryValueFree}`}>
        Free
      </span>
    );
  } else {
    shipping = (
      <span className={styles.summaryValue}>
        {formatCurrency(shippingFees)}
      </span>
    );
  }

  return (
    <div>
      <div className={styles.summaryCard}>
        <h2 className={styles.summaryTitle}>Order Summary</h2>
        <div className={styles.summaryList}>
          {cart.map((item) => (
            <div key={item.itemID} className={styles.summaryItem}>
              <div className={styles.summaryImageWrapper}>
                <Image
                  src={item.product.imageUrl}
                  alt={item.product.name}
                  fill
                  sizes="56px"
                  className={styles.summaryImage}
                />
              </div>
              <div className={styles.summaryDetails}>
                <p className={styles.summaryName}>{item.product.name}</p>
                {item.options.length > 0 && (
                  <p className={styles.summaryOptions}>
                    {item.options.map((option) => option.label).join(" · ")}
                  </p>
                )}
                <p className={styles.summaryQty}>Qty: {item.quantity}</p>
              </div>
              <p className={styles.summaryPrice}>
                {formatCurrency(item.itemPrice * item.quantity)}
              </p>
            </div>
          ))}
        </div>

        <div className={styles.summaryRows}>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Subtotal</span>
            <span className={styles.summaryValue}>
              {formatCurrency(cartPrice)}
            </span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Shipping</span>
            {shipping}
          </div>
          <div className={styles.summaryTotal}>
            <span>Total</span>
            {shippingFees === null || shippingFeesLoading ? (
              <span className={styles.summaryNote}>
                {formatCurrency(cartPrice)} + shipping
              </span>
            ) : (
              <span>{formatCurrency(cartPrice + shippingFees)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderSummary;

"use client";

import Image from "next/image";

import { useCart } from "@/context/CartContext";
import { productName, valueLabel } from "@/i18n/catalog";
import { format } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import { formatCurrency } from "@/utils/helper";
import styles from "./OrderSummary.module.css";

function OrderSummary() {
  const { locale, t } = useI18n();
  const text = t.checkout.summary;
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
      <span className={styles.summaryValueError}>{text.unavailable}</span>
    );
  } else if (shippingFeesLoading) {
    shipping = (
      <span className={styles.summaryValueMuted}>{text.calculating}</span>
    );
  } else if (shippingFees === null || !cityName) {
    shipping = (
      <span className={styles.summaryValueMuted}>{text.chooseCity}</span>
    );
  } else if (shippingFees === 0) {
    shipping = (
      <span className={`${styles.summaryValue} ${styles.summaryValueFree}`}>
        {text.free}
      </span>
    );
  } else {
    shipping = (
      <span className={styles.summaryValue}>
        {formatCurrency(shippingFees, locale)}
      </span>
    );
  }

  return (
    <div>
      <div className={styles.summaryCard}>
        <h2 className={styles.summaryTitle}>{text.title}</h2>
        <div className={styles.summaryList}>
          {cart.map((item) => (
            <div key={item.itemID} className={styles.summaryItem}>
              <div className={styles.summaryImageWrapper}>
                <Image
                  src={item.product.imageUrl}
                  alt={productName(item.product, locale)}
                  fill
                  sizes="56px"
                  className={styles.summaryImage}
                />
              </div>
              <div className={styles.summaryDetails}>
                <p className={styles.summaryName}>
                  {productName(item.product, locale)}
                </p>
                {item.options.length > 0 && (
                  <p className={styles.summaryOptions}>
                    {item.options
                      .map((option) => valueLabel(option, locale))
                      .join(" · ")}
                  </p>
                )}
                <p className={styles.summaryQty}>
                  {format(text.quantity, { count: item.quantity })}
                </p>
              </div>
              <p className={styles.summaryPrice}>
                {formatCurrency(item.itemPrice * item.quantity, locale)}
              </p>
            </div>
          ))}
        </div>

        <div className={styles.summaryRows}>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>{text.subtotal}</span>
            <span className={styles.summaryValue}>
              {formatCurrency(cartPrice, locale)}
            </span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>{text.shipping}</span>
            {shipping}
          </div>
          <div className={styles.summaryTotal}>
            <span>{text.total}</span>
            {shippingFees === null || shippingFeesLoading ? (
              <span className={styles.summaryNote}>
                {format(text.plusShipping, {
                  amount: formatCurrency(cartPrice, locale),
                })}
              </span>
            ) : (
              <span>{formatCurrency(cartPrice + shippingFees, locale)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderSummary;

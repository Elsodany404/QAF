"use client";
import { useCart } from "../../context/CartContext";
import styles from "./OrderSummery.module.css";
import Image from "next/image";
import { formatCurrency } from "@/helper/helper";

function OrderSummery() {
  const {
    cart,
    cartPrice,
    shippingFees,
    shippingFeesLoading,
    taxOnCod,
    cartLoaded,
  } = useCart();
  if (!cartLoaded) {
    return null;
  }
  return (
    <div>
      <div className={styles.summaryCard}>
        <h2 className={styles.summaryTitle}>Order Summary</h2>
        <div className={styles.summaryList}>
          {cart.map((item) => {
            const key = item.product.id;
            return (
              <div key={key} className={styles.summaryItem}>
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

                  <p className={styles.summaryQty}>Qty: {item.quantity}</p>
                </div>
                <p className={styles.summaryPrice}>
                  {formatCurrency(item.itemPrice)}
                </p>
              </div>
            );
          })}
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
            <span
              className={`${styles.summaryValue} ${shippingFees === 0 ? styles.summaryValueFree : ""}`}
            >
              {formatCurrency(shippingFees)}
            </span>
          </div>
          {/* {shippingFees > 0 && (
            <p className="text-xs text-espresso-600 font-medium">
              Free shipping on orders over 1000 EGP
            </p>
          )} */}
          <div className={styles.summaryTotal}>
            <span>
              {shippingFeesLoading
                ? "loading ..."
                : `Total : ${formatCurrency(shippingFees + cartPrice * taxOnCod + cartPrice)}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderSummery;

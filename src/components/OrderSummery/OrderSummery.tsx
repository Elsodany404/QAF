import { CheckCircle2 } from "lucide-react";
import { useCart } from "../../context/CartContext";
import styles from "./OrderSummery.module.css";
import Image from "next/image";
function OrderSummery() {
  const { cart } = useCart();
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
                <p className={styles.summaryPrice}>${item.itemPrice}</p>
              </div>
            );
          })}
        </div>

        <div className={styles.summaryRows}>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Subtotal</span>
            {/* <span className={styles.summaryValue}>
                    ${totalPrice.toFixed(2)}
                  </span> */}
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Shipping</span>
            {/* <span
              className={`${styles.summaryValue} ${shipping === 0 ? styles.summaryValueFree : ""}`}
            >
              {shipping === 0 ? "Free" : `$${formatCurrency(shipping)}`}
            </span> */}
          </div>
          {/* {shipping > 0 && (
            <p className="text-xs text-espresso-600 font-medium">
              Free shipping on orders over $50
            </p>
          )} */}
          <div className={styles.summaryTotal}>
            <span>Total</span>
          </div>
        </div>

        <div className={styles.securityBanner}>
          <CheckCircle2 className="w-4 h-4" />
          Your order is protected
        </div>
      </div>
    </div>
  );
}

export default OrderSummery;

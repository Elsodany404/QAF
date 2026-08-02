import {
  ShoppingBag,
  ArrowLeft,
  Lock,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import styles from "./Checkout.module.css";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../../helper/helper";
import { useForm } from "react-hook-form";

export default function Checkout() {
  const navigate = useNavigate();

  const { cart, cartPrice } = useCart();
  if (cart.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className={styles.emptyTitle}>Cart is empty</h2>
        <p className={styles.emptyText}>
          Add some premium coffee before checking out.
        </p>
        <button
          className={styles.emptyButton}
          onClick={() => navigate("/menu")}
        >
          Browse Products
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <button className={styles.backButton}>
          <ArrowLeft className="w-5 h-5" />
          Back to Shopping
        </button>

        <h1 className={styles.title}>Checkout</h1>

        <div className={styles.grid}>
          <form className={styles.formSection}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Contact Information</h2>
              <div className={styles.fieldGrid}>
                <form>
                  <Field
                    id="name"
                    label="Full Name"
                    placeholder="John smith"
                    type="text"
                  />
                  <Field
                    id="email"
                    label="Email Address"
                    placeholder="johnsmith@example.com"
                    type="text"
                  />
                  <Field
                    id="phone"
                    label="Phone Number"
                    placeholder="01xxxxxx"
                    type="tel"
                  />
                </form>
              </div>
            </div>

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Shipping Address</h2>
              <div className={styles.fieldGrid}>
                <form>
                  <Field
                    id="address"
                    label="Street Address"
                    type="text"
                    placeholder="123 Main Street"
                  />
                  <Field
                    id="city"
                    label="City"
                    type="text"
                    placeholder="Cairo"
                  />
                </form>
              </div>
            </div>

            <div className={styles.paymentCard}>
              <div className={styles.paymentHeader}>
                <div className={styles.paymentIcon}>
                  <CreditCard />
                </div>
                <div>
                  <h3 className={styles.paymentTitle}>
                    Secure Payment with us
                  </h3>
                  <p className={styles.paymentBody}>
                    You will be redirected to our third party secure gateway to
                    complete payment.
                  </p>
                  <div className={styles.paymentSecurity}>
                    <Lock className="w-4 h-4" />
                    256-bit SSL Encrypted
                  </div>
                </div>
              </div>
            </div>

            {/* {<div className={styles.payError}></div>} */}

            <button
              type="submit"
              // disabled={loading}
              className={`${styles.submitButton} `}
            >
              {`Complete Purchase — $${formatCurrency(cartPrice)}`}
            </button>
          </form>

          <div>
            <div className={styles.summaryCard}>
              <h2 className={styles.summaryTitle}>Order Summary</h2>
              <div className={styles.summaryList}>
                {cart.map((item) => {
                  const key = item.product.id;
                  return (
                    <div key={key} className={styles.summaryItem}>
                      <img
                        src={item.product.imageUrl || ""}
                        alt={item.product.name || ""}
                        className={styles.summaryImage}
                      />
                      <div className={styles.summaryDetails}>
                        <p className={styles.summaryName}>
                          {item.product.name}
                        </p>

                        <p className={styles.summaryQty}>
                          Qty: {item.quantity}
                        </p>
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
                    {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
                  </span> */}
                </div>
                {/* {shipping > 0 && (
                  <p className="text-xs text-espresso-600 font-medium">
                    Free shipping on orders over $50
                  </p>
                )} */}
                <div className={styles.summaryTotal}>
                  <span>Total</span>
                  <span>Total</span>
                </div>
              </div>

              <div className={styles.securityBanner}>
                <CheckCircle2 className="w-4 h-4" />
                Your order is protected
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  type,
  placeholder,
  id,
}: {
  label: string;
  type: string;
  placeholder: string;
  id: string;
}) {
  const { register } = useForm();
  return (
    <>
      <label htmlFor={`${id}`}>{label}</label>
      <input
        type={`${type}`}
        id={`${id}`}
        placeholder={`${placeholder}`}
        {...register(id)}
      />
    </>
  );
}

import { useState, FormEvent } from "react";
import {
  ShoppingBag,
  ArrowLeft,
  Lock,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { supabase } from "../../lib/supabase";
import styles from "./Checkout.module.css";

interface FormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
}

export default function Checkout() {
  const { cart, cartPrice, clearCart } = useCart();
  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "Egypt",
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [loading, setLoading] = useState(false);
  const [payError, setPayError] = useState("");

  const grandTotal = cartPrice;

  const validate = () => {
    const e: Partial<FormData> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email))
      e.email = "Valid email required";
    if (!form.phone.trim()) e.phone = "Phone is required";
    if (!form.address.trim()) e.address = "Address is required";
    if (!form.city.trim()) e.city = "City is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setPayError("");

    try {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_name: form.name,
          customer_email: form.email,
          customer_phone: form.phone,
          shipping_address: `${form.address}, ${form.city}, ${form.country}`,
          total_amount: grandTotal,
          status: "pending",
        })
        .select()
        .maybeSingle();

      if (orderError || !order) throw new Error("Failed to create order");

      const orderItems = cart.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price:
          item.product.price + (item.selectedWeight?.price_modifier ?? 0),
        weight_option: item.selectedWeight?.label ?? null,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);
      if (itemsError) throw new Error("Failed to save order items");

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

      const paymobRes = await fetch(
        `${supabaseUrl}/functions/v1/paymob-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            orderId: order.id,
            amount: Math.round(grandTotal * 100),
            currency: "EGP",
            customerName: form.name,
            customerEmail: form.email,
            customerPhone: form.phone,
          }),
        },
      );

      const paymobData = await paymobRes.json();

      //   if (paymobData.payment_key) {
      //     const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${paymobData.iframe_id}?payment_token=${paymobData.payment_key}`;
      //     clearCart();
      //     window.open(iframeUrl, "_blank");
      //     onSuccess(order.id);
      //   } else if (paymobData.error) {
      //     clearCart();
      //     onSuccess(order.id);
      //   } else {
      //     clearCart();
      //     onSuccess(order.id);
      //   }
      // } catch (err) {
      setPayError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const field = (
    key: keyof FormData,
    label: string,
    type = "text",
    placeholder = "",
  ) => (
    <div>
      <label className="block text-sm font-semibold text-charcoal-900 mb-2">
        {label}
      </label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) =>
          setForm((prev) => ({ ...prev, [key]: e.target.value }))
        }
        placeholder={placeholder}
        className={`premium-input ${errors[key] ? "border-red-500 focus:ring-red-500/20" : ""}`}
      />
      {errors[key] && (
        <p className="text-red-600 text-xs mt-1 font-medium">{errors[key]}</p>
      )}
    </div>
  );

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
        <button className={styles.emptyButton}>Browse Products</button>
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

        <h1 className={styles.title}>Secure Checkout</h1>

        <div className={styles.grid}>
          <form onSubmit={handleSubmit} className={styles.formSection}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Contact Information</h2>
              <div className={styles.fieldGrid}>
                {field("name", "Full Name", "text", "John Doe")}
                {field("email", "Email Address", "email", "john@example.com")}
                {field("phone", "Phone Number", "tel", "+20 100 000 0000")}
              </div>
            </div>

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Shipping Address</h2>
              <div className={styles.fieldGrid}>
                {field("address", "Street Address", "text", "123 Main Street")}
                {field("city", "City", "text", "Cairo")}
                <div>
                  <label className={styles.label}>Country</label>
                  <select
                    value={form.country}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, country: e.target.value }))
                    }
                    className={styles.input}
                  >
                    <option value="Egypt">Egypt</option>
                    <option value="Saudi Arabia">Saudi Arabia</option>
                    <option value="UAE">UAE</option>
                    <option value="Jordan">Jordan</option>
                    <option value="Kuwait">Kuwait</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className={styles.paymentCard}>
              <div className={styles.paymentHeader}>
                <div className={styles.paymentIcon}>
                  <CreditCard />
                </div>
                <div>
                  <h3 className={styles.paymentTitle}>
                    Secure Payment via Paymob
                  </h3>
                  <p className={styles.paymentBody}>
                    You will be redirected to Paymob's secure gateway to
                    complete payment.
                  </p>
                  <div className={styles.paymentSecurity}>
                    <Lock className="w-4 h-4" />
                    256-bit SSL Encrypted
                  </div>
                </div>
              </div>
            </div>

            {payError && <div className={styles.payError}>{payError}</div>}

            <button
              type="submit"
              disabled={loading}
              className={`${styles.submitButton} ${loading ? styles.submitButtonDisabled : ""}`}
            >
              {loading
                ? "Processing..."
                : `Complete Purchase — $${grandTotal.toFixed(2)}`}
            </button>
          </form>

          <div>
            <div className={styles.summaryCard}>
              <h2 className={styles.summaryTitle}>Order Summary</h2>
              <div className={styles.summaryList}>
                {cart.map((item) => {
                  const key = `${item.product.id}::${item.selectedWeight?.label ?? "default"}`;
                  return (
                    <div key={key} className={styles.summaryItem}>
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className={styles.summaryImage}
                      />
                      <div className={styles.summaryDetails}>
                        <p className={styles.summaryName}>
                          {item.product.name}
                        </p>
                        {item.selectedWeight && (
                          <p className={styles.summaryWeight}>
                            {item.selectedWeight.label}
                          </p>
                        )}
                        <p className={styles.summaryQty}>
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <p className={styles.summaryPrice}>
                        ${item.linePrice.toFixed(2)}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className={styles.summaryRows}>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Subtotal</span>
                  <span className={styles.summaryValue}>
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Shipping</span>
                  <span
                    className={`${styles.summaryValue} ${shipping === 0 ? styles.summaryValueFree : ""}`}
                  >
                    {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-espresso-600 font-medium">
                    Free shipping on orders over $50
                  </p>
                )}
                <div className={styles.summaryTotal}>
                  <span>Total</span>
                  <span>${grandTotal.toFixed(2)}</span>
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

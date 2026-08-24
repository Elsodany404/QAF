"use client"
import { useCart } from "../../context/CartContext";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";
import { SubmitHandler } from "react-hook-form";
import { postOrder } from "../../services/Order";
import OrderSummery from "../../components/OrderSummery/OrderSummery";
import Form from "../../components/Form/Form";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { createPayment } from "../../services/payment";
import { FormValues } from "../../types/customTypes";

export default function Checkout() {
  const router = useRouter();

  const { cart, cartPrice, paymentMethod, clearCart } = useCart();
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
          onClick={() => router.push("/menu")}
        >
          Browse Products
        </button>
      </div>
    );
  }

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
      const orderPayload = {
        customerName: data.name,
        customerEmail: data.email,
        customerPhone: data.phone,
        apartment: data.apartment,
        street: data.streetAddress,
        city: data.city,
        governorate: data.governorate,
        addressDetails: data.details,
        paymentMethod: paymentMethod,
        totalPrice: cartPrice,
        cart,
      };

      // 1. Create order + order items
      const orderId = await postOrder(orderPayload);

      // 2. COD doesn't need Paymob
      if (orderPayload.paymentMethod === "cash_on_delivery") {
        // Clear cart
        clearCart();
        // Navigate to success page
        router.replace(`/order-success/${orderId}`);

        return;
      }
      console.log("Calling create payment...");
      // 3. Card / wallet → Paymob
      const payment = await createPayment(orderId);
      // 4. Redirect to Paymob
      const publicKey = "egy_pk_test_j7nfV5opvO3bvJQKjbaUeLmhpvwN0Nli";

      router.replace(
        `https://accept.paymob.com/unifiedcheckout/?publicKey=${publicKey}&clientSecret=${payment.client_secret}`,
      );
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <button className={styles.backButton}>
          <ArrowLeft className="w-5 h-5" />
          Back to Shopping
        </button>

        <h1 className={styles.title}>Checkout</h1>

        <div className={styles.grid}>
          <Form onSubmit={onSubmit} />

          <OrderSummery />
        </div>
      </div>
    </div>
  );
}

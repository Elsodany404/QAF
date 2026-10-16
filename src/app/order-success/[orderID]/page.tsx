import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowRight,
  CheckCircle,
  Clock3,
  Mail,
  Package,
  Truck,
  XCircle,
} from "lucide-react";

import { getCurrentSession } from "@/lib/adminAccess";
import {
  formatOrderNumber,
  isOnlinePayment,
  normalizePaymentStatus,
} from "@/lib/orderStatus";
import { signInPath } from "@/lib/redirect";
import { firstParam } from "@/lib/searchParams";
import { getOrderWithItems } from "@/services/Order";
import ClearCart from "./ClearCart";
import RefreshWhilePending from "./RefreshWhilePending";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Your Order",
};

type OrderSuccessProps = {
  params: Promise<{
    orderID: string;
  }>;
  searchParams: Promise<{
    success?: string | string[];
  }>;
};

export default async function OrderSuccess({
  params,
  searchParams,
}: OrderSuccessProps) {
  const [{ orderID: rawOrderID }, query, session] = await Promise.all([
    params,
    searchParams,
    getCurrentSession(),
  ]);

  if (!session) {
    redirect(signInPath(`/order-success/${rawOrderID}`));
  }

  const orderID = Number(rawOrderID);
  const order = Number.isSafeInteger(orderID)
    ? await getOrderWithItems(orderID)
    : null;

  if (!order || order.customer_ID !== session.user.id) {
    notFound();
  }

  // Paymob appends ?success=true|false on redirect. The webhook is the source
  // of truth but may arrive a moment later, so fall back to the query string.
  const paymentStatus = normalizePaymentStatus(order.paymentStatus);
  const redirectSuccess = firstParam(query.success);
  const isOnline = isOnlinePayment(order.paymentMethod);
  const state: "confirmed" | "processing" | "failed" =
    !isOnline || paymentStatus === "paid"
      ? "confirmed"
      : paymentStatus === "failed" || redirectSuccess === "false"
        ? "failed"
        : "processing";

  const copy = {
    confirmed: {
      Icon: CheckCircle,
      title: "Order Confirmed!",
      message: "Thank you for your purchase. We are roasting your coffee now.",
    },
    processing: {
      Icon: Clock3,
      title: "Payment Processing",
      message:
        "We're confirming your payment with Paymob. This usually takes a few seconds — this page will update on its own.",
    },
    failed: {
      Icon: XCircle,
      title: "Payment Failed",
      message:
        "Your payment didn't go through and you have not been charged. You can retry the payment from your account page.",
    },
  }[state];

  return (
    <>
      {state !== "failed" && <ClearCart />}
      {state === "processing" && <RefreshWhilePending />}
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div
              className={`${styles.iconWrap} ${
                state === "failed"
                  ? styles.iconWrapError
                  : state === "processing"
                    ? styles.iconWrapPending
                    : ""
              }`}
            >
              <copy.Icon aria-hidden="true" />
            </div>

            <h1 className={styles.title}>{copy.title}</h1>
            <p className={styles.message}>{copy.message}</p>
            <p className={styles.orderId}>
              Order:{" "}
              <span className={styles.orderIdValue}>
                {formatOrderNumber(order.id)}
              </span>
            </p>
          </div>

          {state === "failed" && (
            <Link href="/user" className={styles.continueButton}>
              Go to my orders
              <ArrowRight size={20} aria-hidden="true" />
            </Link>
          )}

          {state !== "failed" && (
            <>
              <div className={styles.steps}>
                {[
                  {
                    Icon: Mail,
                    title: "Confirmation Email",
                    desc:
                      state === "confirmed"
                        ? `Your receipt is on its way to ${order.customerEmail}`
                        : `We'll email ${order.customerEmail} as soon as the payment is confirmed`,
                  },
                  {
                    Icon: Package,
                    title: "Roasting & Packaging",
                    desc: "Freshly roasted and dispatched within 24 hours on business days",
                  },
                  {
                    Icon: Truck,
                    title: "Fast Delivery",
                    // Matches the delivery policy (/policies).
                    desc: "Delivered 24–48 hours after dispatch",
                  },
                ].map(({ Icon, title, desc }) => (
                  <div key={title} className={styles.stepCard}>
                    <div className={styles.stepIcon}>
                      <Icon aria-hidden="true" />
                    </div>
                    <div>
                      <p className={styles.stepTitle}>{title}</p>
                      <p className={styles.stepDesc}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.tipCard}>
                <p className={styles.tipTitle}>
                  Brewing tip from our roasters:
                </p>
                <p className={styles.tipText}>
                  Let your coffee rest for 7 days after roasting to reach peak
                  flavor. Quality takes time!
                </p>
              </div>

              <div className={styles.buttonRow}>
                <Link href="/user" className={styles.secondaryButton}>
                  Track my order
                </Link>
                <Link href={"/menu"} className={styles.continueButton}>
                  Continue Shopping
                  <ArrowRight size={20} aria-hidden="true" />
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

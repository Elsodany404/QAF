import { signInPath } from "@/lib/redirect";
import {
  CheckCircle,
  ArrowRight,
  Clock3,
  Package,
  Truck,
  Mail,
  XCircle,
} from "lucide-react";
import styles from "./page.module.css";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import ClearCart from "./ClearCart";
import { getCurrentSession } from "@/lib/adminAccess";
import {
  formatOrderNumber,
  isOnlinePayment,
  normalizePaymentStatus,
} from "@/lib/orderStatus";
import { getOrderWithItems } from "@/services/Order";
type OrderSuccessProps = {
  params: Promise<{
    orderID: string;
  }>;
  searchParams: Promise<{
    success?: string | string[];
    paymentMethod?: string | string[];
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
  const redirectSuccess = Array.isArray(query.success)
    ? query.success[0]
    : query.success;
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
        "We're confirming your payment with Paymob. This usually takes a few seconds — your account page will update automatically.",
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
              <copy.Icon className="w-12 h-12" />
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
              <ArrowRight className="w-5 h-5" />
            </Link>
          )}

          {state !== "failed" && (
            <>
              <div className={styles.steps}>
                {[
                  {
                    Icon: Mail,
                    title: "Confirmation Email",
                    desc: `Your receipt is on its way to ${order.customerEmail}`,
                  },
                  {
                    Icon: Package,
                    title: "Roasting & Packaging",
                    desc: "Freshly roasted within 24 hours",
                  },
                  {
                    Icon: Truck,
                    title: "Fast Delivery",
                    desc: "Ships within 2-5 business days",
                  },
                ].map(({ Icon, title, desc }) => (
                  <div key={title} className={styles.stepCard}>
                    <div className={styles.stepIcon}>
                      <Icon className="w-6 h-6" />
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
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

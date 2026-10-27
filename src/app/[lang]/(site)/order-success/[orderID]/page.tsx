import type { Metadata } from "next";
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

import { format } from "@/i18n/format";
import Link from "@/i18n/Link";
import { getI18n } from "@/i18n/server";
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

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.orderSuccess.metaTitle };
}

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
  const [{ orderID: rawOrderID }, query, session, { locale, t }] =
    await Promise.all([params, searchParams, getCurrentSession(), getI18n()]);
  const text = t.orderSuccess;

  if (!session) {
    redirect(signInPath(`/order-success/${rawOrderID}`, locale));
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
      title: text.confirmedTitle,
      message: text.confirmedText,
    },
    processing: {
      Icon: Clock3,
      title: text.processingTitle,
      message: text.processingText,
    },
    failed: {
      Icon: XCircle,
      title: text.failedTitle,
      message: text.failedText,
    },
  }[state];

  return (
    <>
      {state !== "failed" && <ClearCart orderID={order.id} />}
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
              {text.order}{" "}
              <span className={styles.orderIdValue}>
                {formatOrderNumber(order.id)}
              </span>
            </p>
          </div>

          {/* The links replace this page in the history, so Back never
              lands on a confirmation again. */}
          {state === "failed" && (
            <Link href="/user" replace className={styles.continueButton}>
              {text.goToOrders}
              <ArrowRight size={20} className="flipRtl" aria-hidden="true" />
            </Link>
          )}

          {state !== "failed" && (
            <>
              <div className={styles.steps}>
                {[
                  {
                    Icon: Mail,
                    title: text.emailTitle,
                    desc: format(
                      state === "confirmed"
                        ? text.emailSent
                        : text.emailPending,
                      { email: order.customerEmail },
                    ),
                  },
                  {
                    Icon: Package,
                    title: text.roastingTitle,
                    desc: text.roastingText,
                  },
                  {
                    Icon: Truck,
                    title: text.deliveryTitle,
                    // Matches the delivery policy (/policies).
                    desc: text.deliveryText,
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
                <p className={styles.tipTitle}>{text.tipTitle}</p>
                <p className={styles.tipText}>{text.tipText}</p>
              </div>

              <div className={styles.buttonRow}>
                <Link href="/user" replace className={styles.secondaryButton}>
                  {text.track}
                </Link>
                <Link href="/menu" replace className={styles.continueButton}>
                  {text.continueShopping}
                  <ArrowRight size={20} className="flipRtl" aria-hidden="true" />
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

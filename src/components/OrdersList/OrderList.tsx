import {
  AlertTriangle,
  ArrowRight,
  Check,
  Clock3,
  PackageCheck,
  RotateCcw,
  ShoppingBag,
  Truck,
} from "lucide-react";
import styles from "./OrderList.module.css";
import Link from "next/link";
import type { OrderQuery } from "@/types/customTypes";
import {
  canCancelOrder,
  canPayOrder,
  canRefundOrder,
  DISPLAY_STATUS_META,
  formatOrderNumber,
  getDisplayStatus,
  getTrackingStepIndex,
  orderTrackingUrl,
  type OrderDisplayStatus,
  TRACKING_STEPS,
} from "@/lib/orderStatus";
import { formatCurrency } from "@/utils/helper";
import { CancelOrderButton, PayOrderButton } from "./OrderActions";

// Statuses where the tracking bar no longer makes sense.
const CLOSED_STATUSES: OrderDisplayStatus[] = [
  "cancelled",
  "refund_due",
  "returned",
];

const CUSTOMER_STATUS_NOTE: Partial<Record<OrderDisplayStatus, string>> = {
  awaiting_payment:
    "We haven't received your payment yet. Complete it to start preparing your order.",
  payment_failed:
    "Your last payment attempt didn't go through. You can try again below.",
  exception:
    "There's an issue with your delivery. Our team is on it and will contact you shortly.",
  refund_due:
    "Your order was cancelled. Your refund is being processed by our team.",
};

function estimateDelivery(createdAt: string) {
  const placedAt = new Date(createdAt);
  const start = new Date(placedAt);
  const end = new Date(placedAt);
  start.setDate(start.getDate() + 3);
  end.setDate(end.getDate() + 5);

  const formatter = new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
  });
  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

function returnRequestLink(orderId: number) {
  const requestText = `Hello Qaf Coffee, I would like to request a return and refund for order ${formatOrderNumber(orderId)}.`;
  return `https://wa.me/201031200143?text=${encodeURIComponent(requestText)}`;
}

function badgeClass(status: OrderDisplayStatus) {
  const tone = DISPLAY_STATUS_META[status].tone;
  if (tone === "success") return styles.delivered;
  if (tone === "danger") return styles.cancelled;
  if (tone === "info") return styles.inProgress;
  return "";
}

function OrdersList({ orders }: { orders: OrderQuery[] }) {
  if (!orders || orders.length === 0) {
    return (
      <div className={styles.emptyOrders}>
        <div className={styles.emptyIcon}>
          <ShoppingBag className="w-8 h-8" />
        </div>
        <p className={styles.emptyTitle}>No orders yet</p>
        <p className={styles.emptyText}>
          When you place an order it will appear here.
        </p>
        <Link href="/menu" className={styles.shopButton}>
          Browse Our Blends
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.orders}>
      {orders.map((order) => {
        const status = getDisplayStatus(order);
        const trackingUrl = orderTrackingUrl(order);
        const isClosed = CLOSED_STATUSES.includes(status);
        const activeStep = getTrackingStepIndex(order);
        const note = CUSTOMER_STATUS_NOTE[status];
        const showCancel = canCancelOrder(order);
        const showPay = canPayOrder(order);
        const showReturn = status === "delivered";
        // Percentage of the connecting line that is filled.
        const progress = (activeStep / (TRACKING_STEPS.length - 1)) * 100;

        const placedDate = new Intl.DateTimeFormat("en", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }).format(new Date(order.created_at));

        return (
          <article className={styles.orderCard} key={order.id}>
            <header className={styles.orderHeader}>
              <div>
                <p className={styles.orderNumber}>
                  Order {formatOrderNumber(order.id)}
                </p>
                <p className={styles.orderDate}>Placed {placedDate}</p>
              </div>
              <span className={`${styles.statusBadge} ${badgeClass(status)}`}>
                {DISPLAY_STATUS_META[status].label}
              </span>
            </header>

            {note && (
              <p
                className={`${styles.statusNote} ${
                  status === "exception" || status === "payment_failed"
                    ? styles.statusNoteWarning
                    : ""
                }`}
              >
                <AlertTriangle aria-hidden="true" />
                {note}
              </p>
            )}

            {!isClosed && (
              <section className={styles.tracking} aria-label="Order progress">
                <div className={styles.trackingTopline}>
                  <span className={styles.trackingTitle}>
                    <Truck aria-hidden="true" />
                    Delivery progress
                  </span>
                  <span className={styles.estimate}>
                    {status === "delivered" ? (
                      <>
                        <PackageCheck aria-hidden="true" /> Delivered
                      </>
                    ) : (
                      <>
                        <Clock3 aria-hidden="true" /> Est.{" "}
                        {estimateDelivery(order.created_at)}
                      </>
                    )}
                  </span>
                </div>

                <div className={styles.progressWrap}>
                  <div className={styles.progressTrack} aria-hidden="true">
                    <div
                      className={styles.progressFill}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <ol className={styles.progress}>
                    {TRACKING_STEPS.map((step, index) => {
                      const isDone =
                        index < activeStep || status === "delivered";
                      const isCurrent = index === activeStep && !isDone;
                      return (
                        <li
                          className={`${styles.progressStep} ${
                            index <= activeStep ? styles.progressActive : ""
                          } ${isCurrent ? styles.progressCurrent : ""}`}
                          key={step.key}
                          aria-current={isCurrent ? "step" : undefined}
                        >
                          <span className={styles.progressMarker}>
                            {isDone ? <Check aria-hidden="true" /> : index + 1}
                          </span>
                          <span className={styles.progressLabel}>
                            {step.label}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </section>
            )}

            <div className={styles.orderDetails}>
              <div className={styles.items}>
                {order.orderItems?.map((item, index) => (
                  <div className={styles.item} key={`${item.id}-${index}`}>
                    <span className={styles.itemName}>
                      {item.product?.name ?? item.productName}
                    </span>
                    <span className={styles.itemQuantity}>
                      × {item.quantity}
                    </span>
                  </div>
                ))}
              </div>
              <div className={styles.total}>
                <span>Total</span>
                <strong>{formatCurrency(order.totalPrice)}</strong>
              </div>
            </div>

            {trackingUrl && !isClosed && (
              <a
                className={styles.trackingLink}
                href={trackingUrl}
                target="_blank"
                rel="noreferrer"
              >
                Track shipment
                {order.bostaTrackingNumber
                  ? ` (${order.bostaTrackingNumber})`
                  : ""}{" "}
                <ArrowRight aria-hidden="true" />
              </a>
            )}

            {(showPay || showCancel || showReturn) && (
              <footer className={styles.actions}>
                {showPay && <PayOrderButton orderID={order.id} />}
                {showCancel && (
                  <CancelOrderButton
                    orderID={order.id}
                    willRefund={canRefundOrder(order)}
                  />
                )}
                {showReturn && (
                  <a
                    className={styles.returnButton}
                    href={returnRequestLink(order.id)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <RotateCcw aria-hidden="true" /> Request a return
                  </a>
                )}
              </footer>
            )}
          </article>
        );
      })}
    </div>
  );
}

export default OrdersList;

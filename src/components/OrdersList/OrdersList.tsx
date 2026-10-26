import {
  AlertTriangle,
  ArrowRight,
  Check,
  Clock3,
  MessageCircle,
  PackageCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import styles from "./OrdersList.module.css";
import Link from "next/link";
import type { OrderQuery } from "@/types/customTypes";
import {
  canCustomerCancelOrder,
  canPayOrder,
  customerWhatsAppTopic,
  DISPLAY_STATUS_META,
  formatOrderNumber,
  getDisplayStatus,
  getTrackingStepIndex,
  hasOnlinePayment,
  normalizePaymentStatus,
  orderTrackingUrl,
  type OrderDisplayStatus,
  TRACKING_STEPS,
  type WhatsAppTopic,
} from "@/lib/orderStatus";
import { optionLabels } from "@/lib/orderItems";
import { shopWhatsAppUrl } from "@/lib/whatsapp";
import { formatCurrency } from "@/utils/helper";
import { CancelOrderButton, PayOrderButton } from "./OrderActions";

// Statuses where the tracking bar no longer makes sense.
const CLOSED_STATUSES: OrderDisplayStatus[] = ["cancelled", "returned"];

// Shown in the warning colour.
const WARNING_STATUSES: OrderDisplayStatus[] = ["exception", "payment_failed"];

/*
 * Returns, refunds and cancelling a paid order are all handled on WhatsApp:
 * the button opens a chat with the order number already typed.
 */
const WHATSAPP_ACTIONS: Record<
  WhatsAppTopic,
  { label: string; message: (orderNumber: string) => string }
> = {
  cancel: {
    label: "Cancel on WhatsApp",
    message: (n) => `Hello Qaf Coffee, I'd like to cancel order ${n}.`,
  },
  return: {
    label: "Request a return on WhatsApp",
    message: (n) => `Hello Qaf Coffee, I'd like to return order ${n}.`,
  },
  refund: {
    label: "Ask about my refund",
    message: (n) => `Hello Qaf Coffee, I'm writing about the refund for order ${n}.`,
  },
  help: {
    label: "Message us on WhatsApp",
    message: (n) => `Hello Qaf Coffee, I'm writing about order ${n}.`,
  },
};

/** What the customer should know about where their order stands. */
function statusNote(order: OrderQuery, status: OrderDisplayStatus) {
  const refunded = normalizePaymentStatus(order.paymentStatus) === "refunded";
  switch (status) {
    case "awaiting_payment":
      return "We haven't received your payment yet. Complete it to start preparing your order.";
    case "payment_failed":
      return "Your last payment attempt didn't go through. You can try again below.";
    case "exception":
      return "There's an issue with your delivery. Our team is on it and will contact you shortly.";
    case "cancelled":
      if (refunded) return "Your order was cancelled and your payment refunded.";
      return hasOnlinePayment(order)
        ? "Your order was cancelled. You paid online: message us on WhatsApp and we'll arrange your refund."
        : null;
    case "returned":
      if (refunded) return "This order came back to us and has been refunded.";
      return hasOnlinePayment(order)
        ? "This order came back to us. Message us on WhatsApp and we'll arrange your refund."
        : "This order came back to us. Message us on WhatsApp if you have any questions.";
    default:
      return null;
  }
}

// Rendered on the server (UTC): show dates as the customer in Egypt sees them.
const TIME_ZONE = "Africa/Cairo";
const DAY = 24 * 60 * 60 * 1000;

const shortDate = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  timeZone: TIME_ZONE,
});

const fullDate = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: TIME_ZONE,
});

/**
 * Delivery window from the delivery policy: dispatched within 24 hours,
 * delivered 24–48 hours later.
 */
function estimateDelivery(createdAt: string) {
  const placedAt = new Date(createdAt).getTime();
  return `${shortDate.format(placedAt + DAY)} – ${shortDate.format(placedAt + 3 * DAY)}`;
}

// Orders on their way, where a delivery estimate means something.
const ESTIMATE_STATUSES: OrderDisplayStatus[] = [
  "processing",
  "ready_for_pickup",
  "shipped",
  "out_for_delivery",
];

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
          <ShoppingBag size={32} aria-hidden="true" />
        </div>
        <p className={styles.emptyTitle}>No orders yet</p>
        <p className={styles.emptyText}>
          When you place an order it will appear here.
        </p>
        <Link href="/menu" className={styles.shopButton}>
          Browse Our Blends
          <ArrowRight size={16} aria-hidden="true" />
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
        const note = statusNote(order, status);
        const showCancel = canCustomerCancelOrder(order);
        const showPay = canPayOrder(order);
        const topic = customerWhatsAppTopic(order);
        const whatsApp = topic && WHATSAPP_ACTIONS[topic];
        // Percentage of the connecting line that is filled.
        const progress = (activeStep / (TRACKING_STEPS.length - 1)) * 100;

        const placedDate = fullDate.format(new Date(order.created_at));

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
                  WARNING_STATUSES.includes(status)
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
                  {status === "delivered" ? (
                    <span className={styles.estimate}>
                      <PackageCheck aria-hidden="true" /> Delivered
                    </span>
                  ) : ESTIMATE_STATUSES.includes(status) ? (
                    <span className={styles.estimate}>
                      <Clock3 aria-hidden="true" /> Est.{" "}
                      {estimateDelivery(order.created_at)}
                    </span>
                  ) : null}
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
                    {optionLabels(item.options).length > 0 && (
                      <small className={styles.itemOptions}>
                        {optionLabels(item.options).join(" · ")}
                      </small>
                    )}
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

            {(showPay || showCancel || whatsApp) && (
              <footer className={styles.actions}>
                {showPay && <PayOrderButton orderID={order.id} />}
                {showCancel && <CancelOrderButton orderID={order.id} />}
                {whatsApp && (
                  <a
                    className={styles.whatsappButton}
                    href={shopWhatsAppUrl(
                      whatsApp.message(formatOrderNumber(order.id)),
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle aria-hidden="true" />
                    {whatsApp.label}
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

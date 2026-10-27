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
import { productName } from "@/i18n/catalog";
import { INTL_LOCALE, type Locale } from "@/i18n/config";
import { format } from "@/i18n/format";
import Link from "@/i18n/Link";
import type { Messages } from "@/i18n/messages";
import { getI18n } from "@/i18n/server";
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
 * the button opens a chat with the order number already typed. The label and
 * message of each topic are in the dictionary (orders.whatsapp).
 */

type OrderNotes = Messages["orders"]["notes"];

/** What the customer should know about where their order stands. */
function statusNote(
  order: OrderQuery,
  status: OrderDisplayStatus,
  notes: OrderNotes,
) {
  const refunded = normalizePaymentStatus(order.paymentStatus) === "refunded";
  switch (status) {
    case "awaiting_payment":
      return notes.awaitingPayment;
    case "payment_failed":
      return notes.paymentFailed;
    case "exception":
      return notes.exception;
    case "cancelled":
      if (refunded) return notes.cancelledRefunded;
      return hasOnlinePayment(order) ? notes.cancelledPaid : null;
    case "returned":
      if (refunded) return notes.returnedRefunded;
      return hasOnlinePayment(order)
        ? notes.returnedPaid
        : notes.returnedUnpaid;
    default:
      return null;
  }
}

// Rendered on the server (UTC): show dates as the customer in Egypt sees them.
const TIME_ZONE = "Africa/Cairo";
const DAY = 24 * 60 * 60 * 1000;

function dateFormats(locale: Locale) {
  return {
    short: new Intl.DateTimeFormat(INTL_LOCALE[locale], {
      day: "numeric",
      month: "short",
      timeZone: TIME_ZONE,
    }),
    full: new Intl.DateTimeFormat(INTL_LOCALE[locale], {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: TIME_ZONE,
    }),
  };
}

/**
 * Delivery window from the delivery policy: dispatched within 24 hours,
 * delivered 24–48 hours later.
 */
function estimateDelivery(createdAt: string, shortDate: Intl.DateTimeFormat) {
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

async function OrdersList({ orders }: { orders: OrderQuery[] }) {
  const { locale, t } = await getI18n();
  const text = t.orders;

  if (!orders || orders.length === 0) {
    return (
      <div className={styles.emptyOrders}>
        <div className={styles.emptyIcon}>
          <ShoppingBag size={32} aria-hidden="true" />
        </div>
        <p className={styles.emptyTitle}>{text.emptyTitle}</p>
        <p className={styles.emptyText}>{text.emptyText}</p>
        <Link href="/menu" className={styles.shopButton}>
          {text.browse}
          <ArrowRight size={16} className="flipRtl" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  const dates = dateFormats(locale);

  return (
    <div className={styles.orders}>
      {orders.map((order) => {
        const status = getDisplayStatus(order);
        const trackingUrl = orderTrackingUrl(order);
        const isClosed = CLOSED_STATUSES.includes(status);
        const activeStep = getTrackingStepIndex(order);
        const note = statusNote(order, status, text.notes);
        const showCancel = canCustomerCancelOrder(order);
        const showPay = canPayOrder(order);
        const topic: WhatsAppTopic | null = customerWhatsAppTopic(order);
        const whatsApp = topic && text.whatsapp[topic];
        // Percentage of the connecting line that is filled.
        const progress = (activeStep / (TRACKING_STEPS.length - 1)) * 100;

        const placedDate = dates.full.format(new Date(order.created_at));

        return (
          <article className={styles.orderCard} key={order.id}>
            <header className={styles.orderHeader}>
              <div>
                <p className={styles.orderNumber}>
                  {format(text.order, { number: formatOrderNumber(order.id) })}
                </p>
                <p className={styles.orderDate}>
                  {format(text.placed, { date: placedDate })}
                </p>
              </div>
              <span className={`${styles.statusBadge} ${badgeClass(status)}`}>
                {text.statuses[status]}
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
              <section className={styles.tracking} aria-label={text.progress}>
                <div className={styles.trackingTopline}>
                  <span className={styles.trackingTitle}>
                    <Truck className="flipRtl" aria-hidden="true" />
                    {text.deliveryProgress}
                  </span>
                  {status === "delivered" ? (
                    <span className={styles.estimate}>
                      <PackageCheck aria-hidden="true" /> {text.delivered}
                    </span>
                  ) : ESTIMATE_STATUSES.includes(status) ? (
                    <span className={styles.estimate}>
                      <Clock3 aria-hidden="true" />{" "}
                      {format(text.estimate, {
                        dates: estimateDelivery(order.created_at, dates.short),
                      })}
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
                            {text.steps[step.key]}
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
                      {item.product
                        ? productName(item.product, locale)
                        : item.productName}
                    </span>
                    <span className={styles.itemQuantity}>
                      × {item.quantity}
                    </span>
                    {optionLabels(item.options, locale).length > 0 && (
                      <small className={styles.itemOptions}>
                        {optionLabels(item.options, locale).join(" · ")}
                      </small>
                    )}
                  </div>
                ))}
              </div>
              <div className={styles.total}>
                <span>{text.total}</span>
                <strong>{formatCurrency(order.totalPrice, locale)}</strong>
              </div>
            </div>

            {trackingUrl && !isClosed && (
              <a
                className={styles.trackingLink}
                href={trackingUrl}
                target="_blank"
                rel="noreferrer"
              >
                {text.track}
                {order.bostaTrackingNumber
                  ? ` (${order.bostaTrackingNumber})`
                  : ""}{" "}
                <ArrowRight className="flipRtl" aria-hidden="true" />
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
                      format(whatsApp.message, {
                        number: formatOrderNumber(order.id),
                      }),
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

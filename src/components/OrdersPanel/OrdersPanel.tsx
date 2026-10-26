"use client";

import { useState } from "react";
import styles from "./OrdersPanel.module.css";
import type { ActionReturnType, OrderQuery } from "@/types/customTypes";
import { formatCurrency } from "@/utils/helper";
import {
  AlertCircle,
  Ban,
  Banknote,
  ChevronDown,
  CircleCheck,
  CreditCard,
  ExternalLink,
  MessageCircle,
  Smartphone,
  Truck,
  XCircle,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateOrderStatus,
  type OrderStatusUpdate,
} from "@/actions/dashboard/updateOrderStatus";
import { cancelOrder } from "@/actions/order/cancelOrder";
import { createDelivery } from "@/actions/shipping/createDelivery";
import { cancelDelivery } from "@/actions/shipping/cancelDelivery";
import { optionLabels } from "@/lib/orderItems";
import {
  canCancelOrder,
  CANCELLABLE_SHIPPING_STATUSES,
  DISPLAY_STATUS_META,
  formatOrderNumber,
  getDisplayStatus,
  hasOnlinePayment,
  isOnlinePayment,
  MANUAL_PAYMENT_STATUSES,
  normalizePaymentStatus,
  normalizeShippingStatus,
  orderTrackingUrl,
  PAYMENT_STATUS_LABELS,
  SHIPPING_STATUS_LABELS,
  SHIPPING_STATUSES,
  type PaymentStatus,
  type ShippingStatus,
  type StatusTone,
} from "@/lib/orderStatus";
import { customerWhatsAppUrl } from "@/lib/whatsapp";

const toneClass: Record<StatusTone, string> = {
  success: styles.badgeSuccess,
  info: styles.badgeInfo,
  danger: styles.badgeDanger,
  pending: styles.badgePending,
};

function paymentTone(status: PaymentStatus): StatusTone {
  if (status === "paid") return "success";
  if (status === "failed") return "danger";
  if (status === "refunded") return "info";
  return "pending";
}

function shippingTone(status: ShippingStatus): StatusTone {
  if (status === "delivered") return "success";
  if (status === "cancelled" || status === "returned" || status === "exception")
    return "danger";
  if (status === "processing") return "pending";
  return "info";
}

function paymentLabel(method?: string | null) {
  if (method === "mobile_wallet") return "Mobile wallet";
  if (method === "cash_on_delivery") return "Cash on delivery";
  return "Paymob card";
}

function PaymentIcon({ method }: { method?: string | null }) {
  if (method === "mobile_wallet") return <Smartphone />;
  if (method === "cash_on_delivery") return <Banknote />;
  return <CreditCard />;
}

const optionsLabel = (options: unknown) => optionLabels(options).join(", ");

type Feedback = { type: "success" | "error"; message: string };

type OrderAction = {
  orderID: number;
  run: () => Promise<ActionReturnType>;
  successMessage: string;
};

function OrdersPanel({ orders }: { orders: OrderQuery[] }) {
  const queryClient = useQueryClient();
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Record<number, Feedback | null>>({});

  const setOrderFeedback = (id: number, fb: Feedback | null) =>
    setFeedback((prev) => ({ ...prev, [id]: fb }));

  // Every admin action goes through one mutation so only one runs at a time
  // and the list is refreshed afterwards.
  const actionMutation = useMutation({
    mutationFn: ({ run }: OrderAction) => run(),
    onMutate: ({ orderID }) => setOrderFeedback(orderID, null),
    onSuccess: (result, { orderID, successMessage }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      setOrderFeedback(
        orderID,
        result.success
          ? {
              type: "success",
              message:
                typeof result.data === "string" ? result.data : successMessage,
            }
          : { type: "error", message: result.error },
      );
    },
    onError: (err, { orderID }) =>
      setOrderFeedback(orderID, {
        type: "error",
        message: err instanceof Error ? err.message : "Action failed",
      }),
  });

  const pendingOrderID = actionMutation.isPending
    ? actionMutation.variables?.orderID
    : null;

  function runAction(action: OrderAction, confirmMessage?: string) {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    actionMutation.mutate(action);
  }

  // A manual override only edits the record: no courier or email. Setting
  // the payment to Refunded records a refund made outside the site.
  function updateStatus(orderID: number, update: OrderStatusUpdate) {
    const change = update.shippingStatus
      ? `shipping status to "${SHIPPING_STATUS_LABELS[update.shippingStatus]}"`
      : `payment status to "${PAYMENT_STATUS_LABELS[update.paymentStatus!]}"`;
    runAction(
      {
        orderID,
        run: () => updateOrderStatus(orderID, update),
        successMessage: "Status updated",
      },
      `Set ${formatOrderNumber(orderID)} ${change}?\n\nThis only updates the record. It doesn't cancel or create a Bosta shipment or email the customer — use the buttons below for those.`,
    );
  }

  return (
    <div className={styles.orderList}>
      {orders.map((order) => {
        const isExpanded = expandedOrderId === order.id;
        const isBusy = pendingOrderID === order.id;
        const orderNumber = formatOrderNumber(order.id);
        const displayStatus = DISPLAY_STATUS_META[getDisplayStatus(order)];
        const shippingStatus = normalizeShippingStatus(order.shippingStatus);
        const paymentStatus = normalizePaymentStatus(order.paymentStatus);
        const orderFeedback = feedback[order.id] ?? null;
        const trackingUrl = orderTrackingUrl(order);

        const canCreateDelivery =
          !order.bostaOrderID &&
          shippingStatus === "processing" &&
          (!isOnlinePayment(order.paymentMethod) || paymentStatus === "paid");
        const canCancelDelivery =
          Boolean(order.bostaTrackingNumber) &&
          CANCELLABLE_SHIPPING_STATUSES.includes(shippingStatus);
        const canCancel = canCancelOrder(order);
        const chatUrl = customerWhatsAppUrl(order.customerPhone);
        // Paid online, but it won't reach the customer.
        const owesRefund =
          (shippingStatus === "cancelled" || shippingStatus === "returned") &&
          hasOnlinePayment(order);

        return (
          <article key={order.id} className={styles.orderCard}>
            {/* ── Order summary row (click to expand) ── */}
            <button
              type="button"
              className={styles.orderSummary}
              onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
              aria-expanded={isExpanded}
            >
              <div className={styles.orderMain}>
                <span className={styles.orderNumber}>{orderNumber}</span>
                <span className={styles.customerName}>
                  {order.customerName}
                </span>
                <span className={styles.customerPhone}>
                  {order.customerPhone}
                </span>
              </div>

              <div className={styles.orderMeta}>
                <span
                  className={`${styles.badge} ${toneClass[displayStatus.tone]}`}
                >
                  {displayStatus.label}
                </span>
                <span className={styles.total}>
                  {formatCurrency(order.totalPrice)}
                </span>
                <ChevronDown
                  className={isExpanded ? styles.chevronOpen : ""}
                  aria-hidden="true"
                />
              </div>
            </button>

            {/* ── Expanded detail panel ── */}
            {isExpanded && (
              <div className={styles.orderDetails}>
                {orderFeedback && (
                  <div
                    role="status"
                    className={
                      orderFeedback.type === "success"
                        ? styles.feedbackSuccess
                        : styles.feedbackError
                    }
                  >
                    {orderFeedback.type === "success" ? (
                      <CircleCheck className={styles.feedbackIcon} />
                    ) : (
                      <AlertCircle className={styles.feedbackIcon} />
                    )}
                    {orderFeedback.message}
                  </div>
                )}

                <div className={styles.detailGrid}>
                  {/* Customer */}
                  <div className={styles.detailBlock}>
                    <p className={styles.detailLabel}>Customer</p>
                    <p className={styles.detailValue}>{order.customerEmail}</p>
                    <p className={styles.detailMuted}>
                      {order.city}, {order.district}
                    </p>
                    <p className={styles.detailMuted}>
                      {[order.street, order.apartment]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    <p className={styles.detailMuted}>
                      Placed{" "}
                      {new Date(order.created_at).toLocaleString("en-GB", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                    {chatUrl && (
                      <a
                        href={chatUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.externalLink}
                      >
                        <MessageCircle />
                        WhatsApp {order.customerPhone}
                      </a>
                    )}
                  </div>

                  {/* Payment */}
                  <div className={styles.detailBlock}>
                    <p className={styles.detailLabel}>Payment</p>
                    <div className={styles.inlineStatus}>
                      <PaymentIcon method={order.paymentMethod} />
                      <span>{paymentLabel(order.paymentMethod)}</span>
                    </div>
                    <span
                      className={`${styles.badge} ${toneClass[paymentTone(paymentStatus)]}`}
                    >
                      {PAYMENT_STATUS_LABELS[paymentStatus]}
                    </span>
                    <p className={styles.detailMuted}>
                      Subtotal {formatCurrency(order.subTotal)} · Shipping{" "}
                      {formatCurrency(order.shippingFees)}
                    </p>
                    {order.paymobTransactionID && (
                      <p className={styles.detailMuted}>
                        TX: {order.paymobTransactionID}
                      </p>
                    )}
                    {owesRefund && (
                      <p className={styles.detailWarning}>
                        Paid but not delivered: agree the refund with the
                        customer on WhatsApp, refund it in Paymob, then set
                        Payment to Refunded.
                      </p>
                    )}
                  </div>

                  {/* Shipping */}
                  <div className={styles.detailBlock}>
                    <p className={styles.detailLabel}>Shipping (Bosta)</p>
                    <span
                      className={`${styles.badge} ${toneClass[shippingTone(shippingStatus)]}`}
                    >
                      {SHIPPING_STATUS_LABELS[shippingStatus]}
                    </span>
                    {shippingStatus === "exception" &&
                      order.bostaExceptionReason && (
                        <p className={styles.detailWarning}>
                          Bosta: {order.bostaExceptionReason}
                        </p>
                      )}
                    <p className={styles.detailMuted}>
                      {order.bostaTrackingNumber
                        ? `Tracking ${order.bostaTrackingNumber}`
                        : "No shipment yet"}
                    </p>
                    {trackingUrl && (
                      <a
                        href={trackingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.externalLink}
                      >
                        Track with Bosta
                        <ExternalLink />
                      </a>
                    )}
                  </div>

                  {/* Manual overrides */}
                  <div className={styles.detailBlock}>
                    <p className={styles.detailLabel}>Override status</p>
                    <label className={styles.selectLabel}>
                      Shipping
                      <select
                        value={shippingStatus}
                        onChange={(e) =>
                          updateStatus(order.id, {
                            shippingStatus: e.target.value as ShippingStatus,
                          })
                        }
                        className={styles.statusSelect}
                        disabled={isBusy}
                      >
                        {SHIPPING_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {SHIPPING_STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className={styles.selectLabel}>
                      Payment
                      <select
                        value={paymentStatus}
                        onChange={(e) =>
                          updateStatus(order.id, {
                            paymentStatus: e.target.value as PaymentStatus,
                          })
                        }
                        className={styles.statusSelect}
                        disabled={isBusy}
                      >
                        {MANUAL_PAYMENT_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {PAYMENT_STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                {/* Items table */}
                <div className={styles.itemsTable}>
                  <div className={styles.itemsHead}>
                    <span>Item</span>
                    <span>Qty</span>
                    <span>Unit</span>
                    <span>Total</span>
                  </div>
                  {(order.orderItems ?? []).map((item) => (
                    <div key={item.id} className={styles.itemRow}>
                      <span>
                        <strong>{item.productName}</strong>
                        {optionsLabel(item.options) && (
                          <small>{optionsLabel(item.options)}</small>
                        )}
                      </span>
                      <span>{item.quantity}</span>
                      <span>
                        {formatCurrency(item.totalPrice / item.quantity)}
                      </span>
                      <span>{formatCurrency(item.totalPrice)}</span>
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                <div className={styles.actionRow}>
                  {canCreateDelivery && (
                    <button
                      type="button"
                      className={styles.actionBtnPrimary}
                      disabled={isBusy}
                      onClick={() =>
                        runAction({
                          orderID: order.id,
                          run: () => createDelivery(order.id),
                          successMessage: "Bosta delivery created",
                        })
                      }
                    >
                      <Truck />
                      Create Bosta delivery
                    </button>
                  )}

                  {canCancelDelivery && (
                    <button
                      type="button"
                      className={styles.actionBtnSecondary}
                      disabled={isBusy}
                      onClick={() =>
                        runAction(
                          {
                            orderID: order.id,
                            run: () => cancelDelivery(order.id),
                            successMessage: "Bosta delivery cancelled",
                          },
                          `Cancel the Bosta shipment for ${orderNumber}? The order stays open so you can create a new shipment.`,
                        )
                      }
                    >
                      <XCircle />
                      Cancel delivery only
                    </button>
                  )}

                  {canCancel && (
                    <button
                      type="button"
                      className={styles.actionBtnDanger}
                      disabled={isBusy}
                      onClick={() =>
                        runAction(
                          {
                            orderID: order.id,
                            run: () => cancelOrder(order.id),
                            successMessage: "Order cancelled",
                          },
                          `Cancel order ${orderNumber}? Any Bosta shipment will be terminated.${
                            hasOnlinePayment(order)
                              ? "\n\nIt was paid online: the site doesn't refund it. Refund the customer in your Paymob dashboard, then set Payment to Refunded."
                              : ""
                          }`,
                        )
                      }
                    >
                      <Ban />
                      Cancel order
                    </button>
                  )}

                  {isBusy && <span className={styles.busyText}>Working…</span>}
                </div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

export default OrdersPanel;

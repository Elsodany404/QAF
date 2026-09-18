"use client";

import { useState, useTransition } from "react";
import styles from "./OrderList.module.css";
import { OrderQuery } from "@/types/customTypes";
import { formatCurrency } from "@/utils/helper";
import {
  Banknote,
  ChevronDown,
  CreditCard,
  ExternalLink,
  Smartphone,
  Trash2,
  Truck,
  CircleCheck,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateOrder } from "@/services/Order";
import { deleteOrder } from "@/actions/deleteOrder";
import { createDelivery } from "@/actions/createDelivery";
import { OrderStatus } from "@/types/db";

const editableStatuses: OrderStatus[] = [
  "pending",
  "paid",
  "shipped",
  "completed",
  "cancelled",
];

function statusClass(status?: string | null) {
  if (status === "paid" || status === "completed" || status === "created") {
    return styles.badgeSuccess;
  }
  if (status === "shipped" || status === "delivered") return styles.badgeInfo;
  if (status === "cancelled" || status === "failed") return styles.badgeDanger;
  return styles.badgePending;
}

function paymentLabel(method?: string | null) {
  if (method === "vodafone_cash") return "Vodafone Cash";
  if (method === "cash_on_delivery") return "Cash on delivery";
  return "Paymob card";
}

function PaymentIcon({ method }: { method?: string | null }) {
  if (method === "vodafone_cash") return <Smartphone />;
  if (method === "cash_on_delivery") return <Banknote />;
  return <CreditCard />;
}

function optionsLabel(options: unknown): string {
  if (!Array.isArray(options) || options.length === 0) return "";
  return options
    .map((o: unknown) =>
      typeof o === "object" && o !== null && "label" in o
        ? (o as { label: string }).label
        : "",
    )
    .filter(Boolean)
    .join(", ");
}

function OrderList({ orders }: { orders: OrderQuery[] }) {
  const queryClient = useQueryClient();
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  // Action states per-order to show inline feedback
  const [actionFeedback, setActionFeedback] = useState<
    Record<number, { type: "success" | "error"; message: string } | null>
  >({});

  const setFeedback = (
    id: number,
    fb: { type: "success" | "error"; message: string } | null,
  ) => setActionFeedback((prev) => ({ ...prev, [id]: fb }));

  // ── Status update mutation ──
  const statusMutation = useMutation({
    mutationFn: ({
      orderID,
      status,
    }: {
      orderID: number;
      status: OrderStatus;
    }) => updateOrder(orderID, { status }),
    onSuccess: (_, { orderID }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      setFeedback(orderID, { type: "success", message: "Status updated" });
    },
    onError: (err, { orderID }) =>
      setFeedback(orderID, {
        type: "error",
        message: err instanceof Error ? err.message : "Failed to update status",
      }),
  });

  // ── Delete order mutation ──
  const deleteMutation = useMutation({
    mutationFn: (orderID: number) => deleteOrder(orderID),
    onSuccess: (result, orderID) => {
      if (result.status === "success") {
        queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
        setExpandedOrderId(null);
      } else {
        setFeedback(orderID, { type: "error", message: result.message });
      }
    },
    onError: (err, orderID) =>
      setFeedback(orderID, {
        type: "error",
        message: err instanceof Error ? err.message : "Failed to delete order",
      }),
  });

  // ── Create delivery (per-order useTransition) ──
  const [deliveryPending, setDeliveryPending] = useState<
    Record<number, boolean>
  >({});
  const [, startDeliveryTransition] = useTransition();

  function handleCreateDelivery(orderID: number) {
    setDeliveryPending((p) => ({ ...p, [orderID]: true }));
    setFeedback(orderID, null);
    startDeliveryTransition(async () => {
      const res = await createDelivery(String(orderID));
      setDeliveryPending((p) => ({ ...p, [orderID]: false }));
      if (res.status === "success") {
        setFeedback(orderID, {
          type: "success",
          message: "Delivery created with Bosta!",
        });
        queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      } else {
        setFeedback(orderID, { type: "error", message: res.message });
      }
    });
  }

  return (
    <div className={styles.orderList}>
      {orders.map((order) => {
        const isExpanded = expandedOrderId === order.id;
        const feedback = actionFeedback[order.id] ?? null;
        const canCreateDelivery =
          order.paymentStatus === "paid" && !order.bostaOrderID;

        return (
          <article key={order.id} className={styles.orderCard}>
            {/* ── Order summary row (click to expand) ── */}
            <button
              type="button"
              className={styles.orderSummary}
              onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
            >
              <div className={styles.orderMain}>
                <span className={styles.orderNumber}>
                  #{String(order.id).padStart(5, "0")}
                </span>
                <span className={styles.customerName}>
                  {order.customerName}
                </span>
                <span className={styles.customerPhone}>
                  {order.customerPhone}
                </span>
              </div>

              <div className={styles.orderMeta}>
                <span
                  className={`${styles.badge} ${statusClass(order.status)}`}
                >
                  {order.status}
                </span>
                <span className={styles.total}>
                  {formatCurrency(order.totalPrice)}
                </span>
                <ChevronDown className={isExpanded ? styles.chevronOpen : ""} />
              </div>
            </button>

            {/* ── Expanded detail panel ── */}
            {isExpanded && (
              <div className={styles.orderDetails}>
                {/* Inline action feedback */}
                {feedback && (
                  <div
                    className={
                      feedback.type === "success"
                        ? styles.feedbackSuccess
                        : styles.feedbackError
                    }
                  >
                    {feedback.type === "success" ? (
                      <CircleCheck className={styles.feedbackIcon} />
                    ) : null}
                    {feedback.message}
                  </div>
                )}

                {/* Info grid */}
                <div className={styles.detailGrid}>
                  {/* Customer */}
                  <div className={styles.detailBlock}>
                    <p className={styles.detailLabel}>Customer</p>
                    <p className={styles.detailValue}>{order.customerEmail}</p>
                    <p className={styles.detailMuted}>
                      {order.city}, {order.district}
                    </p>
                    <p className={styles.detailMuted}>
                      {order.street}
                      {order.apartment ? `, Apt ${order.apartment}` : ""}
                    </p>
                  </div>

                  {/* Payment */}
                  <div className={styles.detailBlock}>
                    <p className={styles.detailLabel}>Payment</p>
                    <div className={styles.inlineStatus}>
                      <PaymentIcon method={order.paymentMethod} />
                      <span>{paymentLabel(order.paymentMethod)}</span>
                    </div>
                    <span
                      className={`${styles.badge} ${statusClass(
                        order.paymentStatus ?? order.status,
                      )}`}
                    >
                      {order.paymentStatus ?? order.status}
                    </span>
                    {order.paymobTransactionID && (
                      <p className={styles.detailMuted}>
                        TX: {order.paymobTransactionID}
                      </p>
                    )}
                  </div>

                  {/* Bosta */}
                  <div className={styles.detailBlock}>
                    <p className={styles.detailLabel}>Bosta</p>
                    <span
                      className={`${styles.badge} ${statusClass(
                        order.shippingStatus,
                      )}`}
                    >
                      {order.shippingStatus ?? "pending"}
                    </span>
                    <p className={styles.detailValue}>
                      {order.bostaTrackingNumber ?? "No tracking yet"}
                    </p>
                    {order.bostaTrackingUrl && (
                      <a
                        href={order.bostaTrackingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.externalLink}
                      >
                        Track with Bosta
                        <ExternalLink />
                      </a>
                    )}
                  </div>

                  {/* Update status */}
                  <div className={styles.detailBlock}>
                    <p className={styles.detailLabel}>Update status</p>
                    <select
                      value={order.status}
                      onChange={(e) =>
                        statusMutation.mutate({
                          orderID: order.id,
                          status: e.target.value as OrderStatus,
                        })
                      }
                      className={styles.statusSelect}
                      disabled={statusMutation.isPending}
                    >
                      {editableStatuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
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
                  {/* Create Bosta delivery */}
                  {canCreateDelivery && (
                    <button
                      type="button"
                      className={styles.actionBtnPrimary}
                      onClick={() => handleCreateDelivery(order.id)}
                      disabled={deliveryPending[order.id]}
                    >
                      <Truck />
                      {deliveryPending[order.id]
                        ? "Creating…"
                        : "Create Bosta Delivery"}
                    </button>
                  )}

                  {/* Delete order */}
                  <button
                    type="button"
                    className={styles.actionBtnDanger}
                    onClick={() => {
                      if (
                        confirm(
                          `Delete order #${String(order.id).padStart(5, "0")}? This cannot be undone.`,
                        )
                      ) {
                        deleteMutation.mutate(order.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 />
                    Delete Order
                  </button>
                </div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

export default OrderList;

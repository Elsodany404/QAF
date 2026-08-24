import { useState } from "react";
import styles from "./OrderList.module.css";
import { Order } from "@/types/db";
import { formatCurrency } from "@/helper/helper";
import {
  Banknote,
  ChevronDown,
  CreditCard,
  ExternalLink,
  Smartphone,
} from "lucide-react";

function statusClass(status?: string | null) {
  if (status === "paid" || status === "completed" || status === "created") {
    return styles.badgeSuccess;
  }
  if (status === "shipped") return styles.badgeInfo;
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

function OrderList({ orders }: { orders: Order[] }) {
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  return (
    <div className={styles.orderList}>
      {orders.map((order) => {
        const isExpanded = expandedOrderId === order.id;
        return (
          <article key={order.id} className={styles.orderCard}>
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

            {isExpanded && (
              <div className={styles.orderDetails}>
                <div className={styles.detailGrid}>
                  <div className={styles.detailBlock}>
                    <p className={styles.detailLabel}>Customer</p>
                    <p className={styles.detailValue}>{order.customerEmail}</p>
                    <p className={styles.detailMuted}>{order.addressDetails}</p>
                  </div>

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

                  {/* <div className={styles.detailBlock}>
                    <p className={styles.detailLabel}>Update Status</p>
                    <select
                      value={order.status}
                      onChange={(event) =>
                        statusMutation.mutate({
                          orderId: order.id,
                          status: event.target.value as OrderStatus,
                        })
                      }
                      className={styles.statusSelect}
                    >
                      {editableStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div> */}
                </div>

                <div className={styles.itemsTable}>
                  <div className={styles.itemsHead}>
                    <span>Item</span>
                    <span>Qty</span>
                    <span>Unit</span>
                    <span>Total</span>
                  </div>
                  {/* {(order.OrderItem ?? []).map((item) => (
                    <div key={item.id} className={styles.itemRow}>
                      <span>
                        <strong>{item.productName}</strong>
                        {optionsLabel(item.options) && (
                          <small>{optionsLabel(item.options)}</small>
                        )}
                      </span>
                      <span>{item.quantity}</span>
                      <span>{formatCurrency(item.totalPrice)}</span>
                      <span>
                        {formatCurrency(item.totalPrice * item.quantity)}
                      </span>
                    </div>
                  ))} */}
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

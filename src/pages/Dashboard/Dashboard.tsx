import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Banknote,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CreditCard,
  ExternalLink,
  Filter,
  Package,
  RefreshCw,
  Search,
  Smartphone,
  Truck,
  XCircle,
} from "lucide-react";
import { formatCurrency } from "../../helper/helper";
import type { OrderStatus } from "../../types/db";
import styles from "./Dashboard.module.css";
import { PaymentMethod, StatusFilter } from "../../types/customTypes";
import { getOrders, updateOrderStatus } from "../../services/Order";
import { toast } from "react-hot-toast";

const statusOptions: StatusFilter[] = [
  "all",
  "pending",
  "paid",
  "shipped",
  "completed",
  "cancelled",
];

const editableStatuses: OrderStatus[] = [
  "pending",
  "paid",
  "shipped",
  "completed",
  "cancelled",
];

function paymentLabel(method?: PaymentMethod | null) {
  if (method === "vodafone_cash") return "Vodafone Cash";
  if (method === "cash_on_delivery") return "Cash on delivery";
  return "Paymob card";
}

function PaymentIcon({ method }: { method?: PaymentMethod | null }) {
  if (method === "vodafone_cash") return <Smartphone />;
  if (method === "cash_on_delivery") return <Banknote />;
  return <CreditCard />;
}

function statusClass(status?: string | null) {
  if (status === "paid" || status === "completed" || status === "created") {
    return styles.badgeSuccess;
  }
  if (status === "shipped") return styles.badgeInfo;
  if (status === "cancelled" || status === "failed") return styles.badgeDanger;
  return styles.badgePending;
}


export default function Dashboard() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  const {
    data: orders = [],
    isPending,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: getOrders,
  });

  const statusMutation = useMutation({
    mutationFn: updateOrderStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (err) => toast.error(err.message),
  });

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;
      const matchesSearch =
        !q ||
        String(order.id).includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.customerEmail.toLowerCase().includes(q) ||
        order.customerPhone.toLowerCase().includes(q) ||
        (order.bostaTrackingNumber ?? "").toLowerCase().includes(q) ||
        (order.paymobTransactionID ?? "").toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [orders, search, statusFilter]);

  const metrics = useMemo(() => {
    const revenue = orders
      .filter((order) => order.status !== "cancelled")
      .reduce((sum, order) => sum + order.totalAmount, 0);
    const pending = orders.filter((order) => order.status === "pending").length;
    const shipped = orders.filter((order) => order.status === "shipped").length;
    const paid = orders.filter((order) => order.status === "paid").length;

    return { revenue, pending, shipped, paid };
  }, [orders]);

  return (
    <div className={styles.page}>
      <main className={styles.shell}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Admin</p>
            <h1 className={styles.title}>Orders Dashboard</h1>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className={styles.refreshButton}
          >
            <RefreshCw className={isFetching ? styles.spin : ""} />
            Refresh
          </button>
        </div>

        <section className={styles.metrics}>
          <div className={styles.metric}>
            <span className={styles.metricIcon}>
              <CreditCard />
            </span>
            <div>
              <p className={styles.metricLabel}>Revenue</p>
              <p className={styles.metricValue}>
                {formatCurrency(metrics.revenue)}
              </p>
            </div>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricIcon}>
              <Clock3 />
            </span>
            <div>
              <p className={styles.metricLabel}>Pending</p>
              <p className={styles.metricValue}>{metrics.pending}</p>
            </div>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricIcon}>
              <CheckCircle2 />
            </span>
            <div>
              <p className={styles.metricLabel}>Paid</p>
              <p className={styles.metricValue}>{metrics.paid}</p>
            </div>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricIcon}>
              <Truck />
            </span>
            <div>
              <p className={styles.metricLabel}>Shipped</p>
              <p className={styles.metricValue}>{metrics.shipped}</p>
            </div>
          </div>
        </section>

        <section className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search order, customer, phone, tracking..."
            />
          </div>

          <div className={styles.filterWrap}>
            <Filter />
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === "all" ? "All statuses" : status}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className={styles.ordersPanel}>
          <div className={styles.panelHeader}>
            <p>{filteredOrders.length} orders</p>
            {statusMutation.isError && (
              <span className={styles.errorText}>Could not update status</span>
            )}
          </div>

          {isPending ? (
            <div className={styles.stateBox}>
              <RefreshCw className={styles.spin} />
              Loading orders...
            </div>
          ) : isError ? (
            <div className={styles.stateBox}>
              <XCircle />
              Could not load orders.
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className={styles.stateBox}>
              <Package />
              No orders match your filters.
            </div>
          ) : (
            <div className={styles.orderList}>
              {filteredOrders.map((order) => {
                const isExpanded = expandedOrderId === order.id;
                return (
                  <article key={order.id} className={styles.orderCard}>
                    <button
                      type="button"
                      className={styles.orderSummary}
                      onClick={() =>
                        setExpandedOrderId(isExpanded ? null : order.id)
                      }
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
                          {formatCurrency(order.totalAmount)}
                        </span>
                        <ChevronDown
                          className={isExpanded ? styles.chevronOpen : ""}
                        />
                      </div>
                    </button>

                    {isExpanded && (
                      <div className={styles.orderDetails}>
                        <div className={styles.detailGrid}>
                          <div className={styles.detailBlock}>
                            <p className={styles.detailLabel}>Customer</p>
                            <p className={styles.detailValue}>
                              {order.customerEmail}
                            </p>
                            <p className={styles.detailMuted}>
                              {order.shppingAddress}
                            </p>
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

                          <div className={styles.detailBlock}>
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
                          </div>
                        </div>

                        <div className={styles.itemsTable}>
                          <div className={styles.itemsHead}>
                            <span>Item</span>
                            <span>Qty</span>
                            <span>Unit</span>
                            <span>Total</span>
                          </div>
                          {(order.OrderItem ?? []).map((item) => (
                            <div key={item.id} className={styles.itemRow}>
                              {/* <span>
                                <strong>{item.productName}</strong>
                                {optionsLabel(item.options) && (
                                  <small>{optionsLabel(item.options)}</small>
                                )}
                              </span> */}
                              <span>{item.quantity}</span>
                              <span>{formatCurrency(item.unitPrice)}</span>
                              <span>
                                {formatCurrency(item.unitPrice * item.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

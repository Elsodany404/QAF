"use client";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock3,
  CreditCard,
  Filter,
  Package,
  RefreshCw,
  Search,
  Truck,
  XCircle,
} from "lucide-react";
import { formatCurrency } from "../../helper/helper";
import styles from "./page.module.css";
import { StatusFilter } from "../../types/customTypes";
import { getOrders, updateOrderStatus } from "../../services/Order";
import { toast } from "react-hot-toast";
import OrderList from "@/components/OrderList/OrderList";

const statusOptions: StatusFilter[] = [
  "all",
  "pending",
  "paid",
  "shipped",
  "completed",
  "cancelled",
];

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

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
      .reduce((sum, order) => sum + order.totalPrice, 0);
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
            <OrderList orders={filteredOrders} />
          )}
        </section>
      </main>
    </div>
  );
}

"use client";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CreditCard,
  Filter,
  Package,
  PlusCircle,
  RefreshCw,
  Search,
  ShoppingCart,
  Truck,
  XCircle,
} from "lucide-react";
import { formatCurrency } from "@/utils/helper";
import styles from "./page.module.css";
import { getAdminOrders } from "@/actions/dashboard/getAdminOrders";
import OrderList from "@/components/OrderList/OrdersPanel";
import SchedulePickupModal from "@/components/SchedulePickupModal/SchedulePickupModal";
import CreateOrderModal from "@/components/CreateOrderModal/CreateOrderModal";
import AddProductModal from "@/components/AddProductModal/AddProductModal";
import {
  DISPLAY_STATUS_META,
  getDisplayStatus,
  isOnlinePayment,
  normalizePaymentStatus,
  type OrderDisplayStatus,
} from "@/lib/orderStatus";
import type { OrderQuery } from "@/types/customTypes";

type StatusFilter = OrderDisplayStatus | "all" | "needs_action";

const statusOptions = Object.keys(DISPLAY_STATUS_META) as OrderDisplayStatus[];

/** Orders the admin has to do something about. */
function needsAction(order: OrderQuery) {
  const status = getDisplayStatus(order);
  if (status === "refund_due" || status === "exception") return true;
  // Ready to ship but no Bosta shipment yet (e.g. the courier API failed).
  return (
    status === "processing" &&
    !order.bostaOrderID &&
    (!isOnlinePayment(order.paymentMethod) ||
      normalizePaymentStatus(order.paymentStatus) === "paid")
  );
}

export default function Dashboard() {
  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Modal visibility state
  const [showPickup, setShowPickup] = useState(false);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);

  const {
    data: orders = [],
    isPending,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: getAdminOrders,
    // Webhooks update orders in the background; keep the list fresh.
    refetchInterval: 60_000,
  });

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "needs_action"
          ? needsAction(order)
          : getDisplayStatus(order) === statusFilter);
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
      .filter((order) => normalizePaymentStatus(order.paymentStatus) === "paid")
      .reduce((sum, order) => sum + order.totalPrice, 0);
    const statuses = orders.map(getDisplayStatus);
    const inTransit = statuses.filter(
      (s) =>
        s === "ready_for_pickup" || s === "shipped" || s === "out_for_delivery",
    ).length;
    const delivered = statuses.filter((s) => s === "delivered").length;
    const attention = orders.filter(needsAction).length;

    return { revenue, inTransit, delivered, attention };
  }, [orders]);

  return (
    <div className={styles.page}>
      <main className={styles.shell}>
        {/* ── Header ── */}
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Admin</p>
            <h1 className={styles.title}>Orders Dashboard</h1>
          </div>

          <div className={styles.headerButtons}>
            {/* Refresh */}
            <button
              type="button"
              onClick={() => refetch()}
              className={styles.refreshButton}
              disabled={isFetching}
            >
              <RefreshCw className={isFetching ? styles.spin : ""} />
              Refresh
            </button>

            {/* Schedule Pickup */}
            <button
              type="button"
              className={styles.pickupButton}
              onClick={() => setShowPickup(true)}
            >
              <Truck />
              Schedule Pickup
            </button>

            {/* Create Order */}
            <button
              type="button"
              className={styles.createOrderButton}
              onClick={() => setShowCreateOrder(true)}
            >
              <ShoppingCart />
              New Order
            </button>
            <button
              type="button"
              className={styles.addProductButton}
              onClick={() => setShowAddProduct(true)}
            >
              <PlusCircle />
              Add Product
            </button>
          </div>
        </div>

        {/* ── Metrics ── */}
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
          <button
            type="button"
            className={styles.metric}
            onClick={() => setStatusFilter("needs_action")}
          >
            <span className={styles.metricIcon}>
              <AlertTriangle />
            </span>
            <div>
              <p className={styles.metricLabel}>Needs action</p>
              <p className={styles.metricValue}>{metrics.attention}</p>
            </div>
          </button>
          <div className={styles.metric}>
            <span className={styles.metricIcon}>
              <Truck />
            </span>
            <div>
              <p className={styles.metricLabel}>In transit</p>
              <p className={styles.metricValue}>{metrics.inTransit}</p>
            </div>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricIcon}>
              <Package />
            </span>
            <div>
              <p className={styles.metricLabel}>Delivered</p>
              <p className={styles.metricValue}>{metrics.delivered}</p>
            </div>
          </div>
        </section>

        {/* ── Toolbar ── */}
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
              <option value="all">All statuses</option>
              <option value="needs_action">Needs action</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {DISPLAY_STATUS_META[status].label}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* ── Orders panel ── */}
        <section className={styles.ordersPanel}>
          <div className={styles.panelHeader}>
            <p>{filteredOrders.length} orders</p>
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

      {/* ── Modals (portaled above everything) ── */}
      {showPickup && (
        <SchedulePickupModal onClose={() => setShowPickup(false)} />
      )}
      {showCreateOrder && (
        <CreateOrderModal onClose={() => setShowCreateOrder(false)} />
      )}
      {showAddProduct && (
        <AddProductModal onClose={() => setShowAddProduct(false)} />
      )}
    </div>
  );
}

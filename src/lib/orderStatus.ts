import type { Order } from "@/types/db";

/*
 * Single source of truth for the order lifecycle. Pure functions only, so it
 * is safe to import from both server code and client components.
 */

export const SHIPPING_STATUSES = [
  "processing",
  "ready_for_pickup",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
  "exception",
] as const;
export type ShippingStatus = (typeof SHIPPING_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "pending",
  "paid",
  "failed",
  "refunded",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/**
 * Payment statuses an admin may set by hand. The site never refunds: the
 * shop agrees a refund with the customer on WhatsApp, makes it, and records
 * it here as "Refunded".
 */
export const MANUAL_PAYMENT_STATUSES: PaymentStatus[] = [...PAYMENT_STATUSES];

export const SHIPPING_STATUS_LABELS: Record<ShippingStatus, string> = {
  processing: "Processing",
  ready_for_pickup: "Ready for courier",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
  exception: "Delivery issue",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

/** Before the courier picks the parcel up, an order can still be cancelled. */
export const CANCELLABLE_SHIPPING_STATUSES: ShippingStatus[] = [
  "processing",
  "ready_for_pickup",
];

// Older rows (and the previous webhook) stored other spellings.
const LEGACY_SHIPPING_STATUS: Record<string, ShippingStatus> = {
  brewing: "processing",
  pending: "processing",
  created: "processing",
  pickup_requested: "ready_for_pickup",
  waiting_for_route: "ready_for_pickup",
  route_assigned: "ready_for_pickup",
  picked_up_from_business: "shipped",
  received_at_warehouse: "shipped",
  in_transit_between_hubs: "shipped",
  picked_up: "out_for_delivery",
  canceled: "cancelled",
  terminated: "cancelled",
  returned_to_business: "returned",
  returned_to_stock: "returned",
  lost: "exception",
  damaged: "exception",
  investigation: "exception",
  on_hold: "exception",
  awaiting_your_action: "exception",
};

export function isShippingStatus(value: unknown): value is ShippingStatus {
  return (
    typeof value === "string" &&
    (SHIPPING_STATUSES as readonly string[]).includes(value)
  );
}

export function isPaymentStatus(value: unknown): value is PaymentStatus {
  return (
    typeof value === "string" &&
    (PAYMENT_STATUSES as readonly string[]).includes(value)
  );
}

export function normalizeShippingStatus(
  raw: string | null | undefined,
): ShippingStatus {
  if (isShippingStatus(raw)) return raw;
  return (raw && LEGACY_SHIPPING_STATUS[raw]) || "processing";
}

export function normalizePaymentStatus(
  raw: string | null | undefined,
): PaymentStatus {
  return isPaymentStatus(raw) ? raw : "pending";
}

export function isOnlinePayment(method: string | null | undefined) {
  return method !== "cash_on_delivery";
}

/*
 * =========================================================
 * BOSTA
 * =========================================================
 * https://docs.bosta.co — delivery state codes. Codes that only apply to
 * customer-return / cash-collection flows, or that carry no meaning for the
 * customer (archived), map to null and are ignored.
 */
const BOSTA_STATE_MAP: Record<number, ShippingStatus> = {
  10: "ready_for_pickup", // Pickup requested
  11: "ready_for_pickup", // Waiting for route
  20: "ready_for_pickup", // Route assigned
  21: "shipped", // Picked up from business
  24: "shipped", // Received at warehouse
  30: "shipped", // In transit between hubs
  41: "out_for_delivery", // Picked up — heading to customer
  45: "delivered",
  46: "returned", // Returned to business
  60: "returned", // Returned to stock
  47: "exception",
  100: "exception", // Lost
  101: "exception", // Damaged
  102: "exception", // Investigation
  103: "exception", // Awaiting your action
  105: "exception", // On hold
  48: "cancelled", // Terminated
  49: "cancelled", // Canceled
};

export function bostaStateToShippingStatus(
  state: unknown,
): ShippingStatus | null {
  const code = typeof state === "string" ? Number(state) : state;
  if (typeof code !== "number" || !Number.isInteger(code)) return null;
  return BOSTA_STATE_MAP[code] ?? null;
}

/**
 * A delivery the customer didn't take (refused, unreachable, cancelled at
 * the door) comes back to the shop as an RTO, "return to origin". Its states
 * mean "on the way back" (41 is "heading to you", not to the customer), so
 * it stays a delivery issue until it is back at the shop.
 */
export function bostaRtoStateToShippingStatus(
  state: unknown,
): ShippingStatus | null {
  const code = typeof state === "string" ? Number(state) : state;
  if (typeof code !== "number" || !Number.isInteger(code)) return null;
  const status = BOSTA_STATE_MAP[code];
  if (!status || status === "delivered") return null;
  return status === "returned" ? "returned" : "exception";
}

const PROGRESS_RANK: Partial<Record<ShippingStatus, number>> = {
  processing: 0,
  ready_for_pickup: 1,
  shipped: 2,
  out_for_delivery: 3,
  delivered: 4,
};

/**
 * Webhooks can arrive out of order or be retried. Never move an order
 * backwards along the happy path, and never reopen a finished order.
 */
export function shouldApplyShippingUpdate(
  current: ShippingStatus,
  next: ShippingStatus,
): boolean {
  if (current === next) return false;
  if (current === "returned") return false;
  if (current === "delivered" || current === "cancelled") {
    return next === "returned";
  }

  const currentRank = PROGRESS_RANK[current];
  const nextRank = PROGRESS_RANK[next];
  if (currentRank !== undefined && nextRank !== undefined) {
    return nextRank > currentRank;
  }
  return true;
}

/*
 * =========================================================
 * DERIVED STATE (UI + permission checks)
 * =========================================================
 */

type OrderStatusFields = Pick<
  Order,
  "paymentMethod" | "paymentStatus" | "shippingStatus"
>;

export type OrderDisplayStatus =
  | "awaiting_payment"
  | "payment_failed"
  | "processing"
  | "ready_for_pickup"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "exception"
  | "cancelled"
  | "returned";

export type StatusTone = "pending" | "info" | "success" | "danger";

export const DISPLAY_STATUS_META: Record<
  OrderDisplayStatus,
  { label: string; tone: StatusTone }
> = {
  awaiting_payment: { label: "Awaiting payment", tone: "pending" },
  payment_failed: { label: "Payment failed", tone: "danger" },
  processing: { label: "Processing", tone: "pending" },
  ready_for_pickup: { label: "Ready for courier", tone: "info" },
  shipped: { label: "Shipped", tone: "info" },
  out_for_delivery: { label: "Out for delivery", tone: "info" },
  delivered: { label: "Delivered", tone: "success" },
  exception: { label: "Delivery issue", tone: "danger" },
  cancelled: { label: "Cancelled", tone: "danger" },
  returned: { label: "Returned", tone: "danger" },
};

export function getDisplayStatus(order: OrderStatusFields): OrderDisplayStatus {
  const shipping = normalizeShippingStatus(order.shippingStatus);
  const payment = normalizePaymentStatus(order.paymentStatus);

  if (shipping !== "processing") return shipping;

  if (isOnlinePayment(order.paymentMethod)) {
    if (payment === "failed") return "payment_failed";
    if (payment === "pending") return "awaiting_payment";
  }
  return "processing";
}

export const TRACKING_STEPS = [
  { key: "placed", label: "Placed" },
  { key: "preparing", label: "Preparing" },
  { key: "shipped", label: "Shipped" },
  { key: "out_for_delivery", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
] as const;

/** Index into TRACKING_STEPS of the last completed/active step. */
export function getTrackingStepIndex(order: OrderStatusFields): number {
  switch (getDisplayStatus(order)) {
    case "awaiting_payment":
    case "payment_failed":
      return 0;
    case "processing":
    case "ready_for_pickup":
      return 1;
    case "shipped":
    case "exception":
      return 2;
    case "out_for_delivery":
      return 3;
    case "delivered":
      return 4;
    default:
      return 0;
  }
}

/** Before the courier has the parcel, the shop can cancel any order. */
export function canCancelOrder(order: OrderStatusFields): boolean {
  return CANCELLABLE_SHIPPING_STATUSES.includes(
    normalizeShippingStatus(order.shippingStatus),
  );
}

/** Money taken online (Paymob) for this order and not refunded. */
export function hasOnlinePayment(order: OrderStatusFields): boolean {
  return (
    isOnlinePayment(order.paymentMethod) &&
    normalizePaymentStatus(order.paymentStatus) === "paid"
  );
}

/**
 * Customers cancel from their account only while no money has been taken:
 * cash on delivery, or an online order not paid yet. A paid order is
 * cancelled by the shop on WhatsApp, where the refund is agreed too.
 */
export function canCustomerCancelOrder(order: OrderStatusFields): boolean {
  return canCancelOrder(order) && !hasOnlinePayment(order);
}

export function canPayOrder(order: OrderStatusFields): boolean {
  const payment = normalizePaymentStatus(order.paymentStatus);
  return (
    isOnlinePayment(order.paymentMethod) &&
    (payment === "pending" || payment === "failed") &&
    normalizeShippingStatus(order.shippingStatus) === "processing"
  );
}

/*
 * What a customer has to message the shop on WhatsApp about:
 *   cancel – a paid order the courier doesn't have yet
 *   return – a delivered order
 *   refund – a paid order that won't reach them (cancelled or brought back)
 *   help   – a delivery issue, or an unpaid order that came back
 */
export type WhatsAppTopic = "cancel" | "return" | "refund" | "help";

export function customerWhatsAppTopic(
  order: OrderStatusFields,
): WhatsAppTopic | null {
  const shipping = normalizeShippingStatus(order.shippingStatus);
  const paid = hasOnlinePayment(order);

  if (canCancelOrder(order)) return paid ? "cancel" : null;
  if (shipping === "delivered") return "return";
  if (shipping === "cancelled" || shipping === "returned") {
    return paid ? "refund" : shipping === "returned" ? "help" : null;
  }
  return shipping === "exception" ? "help" : null;
}

/** Orders the admin has to do something about. */
export function needsAdminAction(
  order: OrderStatusFields & Pick<Order, "bostaOrderID">,
): boolean {
  const status = getDisplayStatus(order);
  if (status === "exception") return true;
  // Paid online but it won't reach the customer: agree the refund with them
  // on WhatsApp, make it, then set the payment to Refunded.
  if (
    (status === "cancelled" || status === "returned") &&
    hasOnlinePayment(order)
  ) {
    return true;
  }
  // Ready to ship but no Bosta shipment yet (e.g. the courier API failed).
  return (
    status === "processing" &&
    !order.bostaOrderID &&
    (!isOnlinePayment(order.paymentMethod) ||
      normalizePaymentStatus(order.paymentStatus) === "paid")
  );
}

export function formatOrderNumber(orderID: number) {
  return `#${String(orderID).padStart(5, "0")}`;
}

/** Bosta's public tracking page. Redirects to the visitor's language. */
export function bostaTrackingUrl(trackingNumber: string) {
  return `https://bosta.co/tracking-shipments?shipment-number=${encodeURIComponent(trackingNumber)}`;
}

/**
 * Link for an order's shipment. Built from the tracking number, so rows saved
 * with an older, broken URL format still get a working link.
 */
export function orderTrackingUrl(
  order: Pick<Order, "bostaTrackingNumber" | "bostaTrackingUrl">,
): string | null {
  if (order.bostaTrackingNumber) {
    return bostaTrackingUrl(order.bostaTrackingNumber);
  }
  return order.bostaTrackingUrl;
}

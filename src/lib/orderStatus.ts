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
  "refunding",
  "refunded",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** Payment statuses an admin may set by hand (refunds go through Paymob). */
export const MANUAL_PAYMENT_STATUSES: PaymentStatus[] = [
  "pending",
  "paid",
  "failed",
  "refunded",
];

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
  refunding: "Refunding",
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
 * RETURNS
 * =========================================================
 * The customer asks for a return from their account; the admin approves it
 * and Bosta books a "customer return pickup": the courier collects the
 * items and pays the customer the refund in cash. Paymob refunds are only
 * for orders cancelled before they shipped.
 */
export const RETURN_STATUSES = [
  "requested", // waiting for the admin
  "rejected", // the admin declined it
  "pickup_scheduled", // Bosta return pickup booked
  "picked_up", // the courier collected the items and paid the refund
  "returned", // the items are back at the shop
  "pickup_failed", // Bosta cancelled or terminated the pickup
] as const;
export type ReturnStatus = (typeof RETURN_STATUSES)[number];

export const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  requested: "Requested",
  rejected: "Declined",
  pickup_scheduled: "Pickup booked",
  picked_up: "Picked up · refunded",
  returned: "Back at the shop",
  pickup_failed: "Pickup failed",
};

/** Length of the reason a customer gives for a return. */
export const RETURN_REASON_MIN_LENGTH = 5;
export const RETURN_REASON_MAX_LENGTH = 500;

/** null: the customer hasn't asked for a return. */
export function normalizeReturnStatus(
  raw: string | null | undefined,
): ReturnStatus | null {
  return typeof raw === "string" &&
    (RETURN_STATUSES as readonly string[]).includes(raw)
    ? (raw as ReturnStatus)
    : null;
}

// States of a customer return pickup (Bosta docs, "Get shipment status via
// webhook"). The rest (exceptions, investigation...) don't change it.
const BOSTA_RETURN_STATE_MAP: Record<number, ReturnStatus> = {
  10: "pickup_scheduled", // Pickup requested
  20: "pickup_scheduled", // Route assigned
  22: "pickup_scheduled", // Picking up from the customer
  23: "picked_up", // Picked up from the customer, who got the refund
  24: "picked_up", // Received at warehouse
  30: "picked_up", // In transit between hubs
  41: "picked_up", // Heading back to the shop
  46: "returned", // Returned to business
  48: "pickup_failed", // Terminated
  49: "pickup_failed", // Canceled
};

export function bostaStateToReturnStatus(state: unknown): ReturnStatus | null {
  const code = typeof state === "string" ? Number(state) : state;
  if (typeof code !== "number" || !Number.isInteger(code)) return null;
  return BOSTA_RETURN_STATE_MAP[code] ?? null;
}

const RETURN_PROGRESS: Partial<Record<ReturnStatus, number>> = {
  pickup_scheduled: 0,
  picked_up: 1,
  returned: 2,
};

/**
 * Like shouldApplyShippingUpdate, for a booked return pickup: only forward,
 * and a pickup can only fail before the courier has the items.
 */
export function shouldApplyReturnUpdate(
  current: ReturnStatus | null,
  next: ReturnStatus,
): boolean {
  const from = current === null ? undefined : RETURN_PROGRESS[current];
  if (from === undefined) return false; // no pickup in progress
  if (next === "pickup_failed") return current === "pickup_scheduled";

  const to = RETURN_PROGRESS[next];
  return to !== undefined && to > from;
}

/*
 * =========================================================
 * DERIVED STATE (UI + permission checks)
 * =========================================================
 */

type OrderStatusFields = Pick<
  Order,
  | "paymentMethod"
  | "paymentStatus"
  | "shippingStatus"
  | "paymobTransactionID"
  | "returnStatus"
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
  | "refund_due"
  | "returned"
  | "return_requested"
  | "return_scheduled"
  | "return_refunded"
  | "return_issue";

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
  refund_due: { label: "Cancelled · refund due", tone: "danger" },
  returned: { label: "Returned", tone: "danger" },
  return_requested: { label: "Return requested", tone: "pending" },
  return_scheduled: { label: "Return pickup booked", tone: "info" },
  return_refunded: { label: "Returned · refunded", tone: "info" },
  return_issue: { label: "Return pickup failed", tone: "danger" },
};

export function getDisplayStatus(order: OrderStatusFields): OrderDisplayStatus {
  const shipping = normalizeShippingStatus(order.shippingStatus);
  const payment = normalizePaymentStatus(order.paymentStatus);

  // A return outranks the delivery it follows. A declined one doesn't show.
  switch (normalizeReturnStatus(order.returnStatus)) {
    case "requested":
      return "return_requested";
    case "pickup_scheduled":
      return "return_scheduled";
    case "picked_up":
    case "returned":
      return "return_refunded";
    case "pickup_failed":
      return "return_issue";
  }

  if (shipping === "cancelled") {
    return payment === "paid" && isOnlinePayment(order.paymentMethod)
      ? "refund_due"
      : "cancelled";
  }
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
    case "return_requested":
    case "return_scheduled":
    case "return_refunded":
    case "return_issue":
      return 4;
    default:
      return 0;
  }
}

export function canCancelOrder(order: OrderStatusFields): boolean {
  return (
    CANCELLABLE_SHIPPING_STATUSES.includes(
      normalizeShippingStatus(order.shippingStatus),
    ) && normalizePaymentStatus(order.paymentStatus) !== "refunding"
  );
}

export function canPayOrder(order: OrderStatusFields): boolean {
  const payment = normalizePaymentStatus(order.paymentStatus);
  return (
    isOnlinePayment(order.paymentMethod) &&
    (payment === "pending" || payment === "failed") &&
    normalizeShippingStatus(order.shippingStatus) === "processing"
  );
}

/** A Paymob payment that can go back to the card or wallet it came from. */
export function hasRefundablePayment(order: OrderStatusFields): boolean {
  return (
    isOnlinePayment(order.paymentMethod) &&
    normalizePaymentStatus(order.paymentStatus) === "paid" &&
    Boolean(order.paymobTransactionID)
  );
}

/**
 * Paymob refunds are for cancelled orders only: nothing was delivered.
 * Returns of delivered orders are refunded in cash by Bosta.
 */
export function canRefundOrder(order: OrderStatusFields): boolean {
  return (
    hasRefundablePayment(order) &&
    normalizeShippingStatus(order.shippingStatus) === "cancelled"
  );
}

/** A delivered order the customer hasn't asked to return yet. */
export function canRequestReturn(order: OrderStatusFields): boolean {
  return (
    normalizeShippingStatus(order.shippingStatus) === "delivered" &&
    normalizeReturnStatus(order.returnStatus) === null
  );
}

/**
 * A return the admin can still approve (book the Bosta pickup) or decline,
 * including a pickup Bosta cancelled, so it can be booked again.
 */
export function canReviewReturn(order: OrderStatusFields): boolean {
  const status = normalizeReturnStatus(order.returnStatus);
  return status === "requested" || status === "pickup_failed";
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

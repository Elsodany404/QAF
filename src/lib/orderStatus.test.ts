import { describe, expect, it } from "vitest";

import { makeOrder } from "@/test/fixtures";
import {
  bostaStateToShippingStatus,
  bostaTrackingUrl,
  canCancelOrder,
  canPayOrder,
  canRefundOrder,
  formatOrderNumber,
  getDisplayStatus,
  getTrackingStepIndex,
  normalizePaymentStatus,
  normalizeShippingStatus,
  orderTrackingUrl,
  shouldApplyShippingUpdate,
} from "./orderStatus";

describe("normalizeShippingStatus", () => {
  it("keeps canonical values", () => {
    expect(normalizeShippingStatus("out_for_delivery")).toBe(
      "out_for_delivery",
    );
  });

  it("maps legacy values written by older code", () => {
    expect(normalizeShippingStatus("brewing")).toBe("processing");
    expect(normalizeShippingStatus("pickup_requested")).toBe(
      "ready_for_pickup",
    );
    expect(normalizeShippingStatus("picked_up")).toBe("out_for_delivery");
    expect(normalizeShippingStatus("terminated")).toBe("cancelled");
    expect(normalizeShippingStatus("lost")).toBe("exception");
  });

  it("treats unknown or missing values as processing", () => {
    expect(normalizeShippingStatus("something-new")).toBe("processing");
    expect(normalizeShippingStatus(null)).toBe("processing");
  });
});

describe("normalizePaymentStatus", () => {
  it("defaults unknown values to pending", () => {
    expect(normalizePaymentStatus("paid")).toBe("paid");
    expect(normalizePaymentStatus("weird")).toBe("pending");
  });
});

describe("bostaStateToShippingStatus", () => {
  it.each([
    [10, "ready_for_pickup"],
    [21, "shipped"],
    [41, "out_for_delivery"],
    [45, "delivered"],
    [46, "returned"],
    [47, "exception"],
    [49, "cancelled"],
  ])("maps state %i to %s", (state, expected) => {
    expect(bostaStateToShippingStatus(state)).toBe(expected);
  });

  it("accepts numeric strings", () => {
    expect(bostaStateToShippingStatus("45")).toBe("delivered");
  });

  it("ignores codes that don't apply to send deliveries", () => {
    expect(bostaStateToShippingStatus(104)).toBeNull();
    expect(bostaStateToShippingStatus(22)).toBeNull();
    expect(bostaStateToShippingStatus("abc")).toBeNull();
    expect(bostaStateToShippingStatus(undefined)).toBeNull();
  });
});

describe("shouldApplyShippingUpdate", () => {
  it("moves forward along the happy path", () => {
    expect(shouldApplyShippingUpdate("ready_for_pickup", "shipped")).toBe(true);
    expect(shouldApplyShippingUpdate("shipped", "delivered")).toBe(true);
  });

  it("ignores out-of-order webhooks that would move backwards", () => {
    expect(shouldApplyShippingUpdate("out_for_delivery", "shipped")).toBe(
      false,
    );
    expect(shouldApplyShippingUpdate("shipped", "ready_for_pickup")).toBe(
      false,
    );
  });

  it("ignores repeats", () => {
    expect(shouldApplyShippingUpdate("shipped", "shipped")).toBe(false);
  });

  it("never reopens delivered or cancelled orders, except for a return", () => {
    expect(shouldApplyShippingUpdate("delivered", "exception")).toBe(false);
    expect(shouldApplyShippingUpdate("cancelled", "shipped")).toBe(false);
    expect(shouldApplyShippingUpdate("delivered", "returned")).toBe(true);
    expect(shouldApplyShippingUpdate("cancelled", "returned")).toBe(true);
    expect(shouldApplyShippingUpdate("returned", "delivered")).toBe(false);
  });

  it("lets a delivery issue recover", () => {
    expect(shouldApplyShippingUpdate("shipped", "exception")).toBe(true);
    expect(shouldApplyShippingUpdate("exception", "out_for_delivery")).toBe(
      true,
    );
  });
});

describe("getDisplayStatus", () => {
  it("shows unpaid online orders as awaiting payment", () => {
    expect(getDisplayStatus(makeOrder())).toBe("awaiting_payment");
    expect(getDisplayStatus(makeOrder({ paymentStatus: "failed" }))).toBe(
      "payment_failed",
    );
  });

  it("does not ask cash-on-delivery customers to pay up front", () => {
    expect(
      getDisplayStatus(makeOrder({ paymentMethod: "cash_on_delivery" })),
    ).toBe("processing");
  });

  it("flags cancelled-but-paid online orders as refund due", () => {
    expect(
      getDisplayStatus(
        makeOrder({ shippingStatus: "cancelled", paymentStatus: "paid" }),
      ),
    ).toBe("refund_due");
    expect(
      getDisplayStatus(
        makeOrder({ shippingStatus: "cancelled", paymentStatus: "refunded" }),
      ),
    ).toBe("cancelled");
  });

  it("uses the shipping status once the order is moving", () => {
    expect(
      getDisplayStatus(
        makeOrder({ paymentStatus: "paid", shippingStatus: "shipped" }),
      ),
    ).toBe("shipped");
  });
});

describe("getTrackingStepIndex", () => {
  it.each([
    [{ paymentStatus: "pending" }, 0],
    [{ paymentStatus: "paid", shippingStatus: "processing" }, 1],
    [{ paymentStatus: "paid", shippingStatus: "ready_for_pickup" }, 1],
    [{ paymentStatus: "paid", shippingStatus: "shipped" }, 2],
    [{ paymentStatus: "paid", shippingStatus: "exception" }, 2],
    [{ paymentStatus: "paid", shippingStatus: "out_for_delivery" }, 3],
    [{ paymentStatus: "paid", shippingStatus: "delivered" }, 4],
  ])("%o → step %i", (fields, step) => {
    expect(getTrackingStepIndex(makeOrder(fields))).toBe(step);
  });
});

describe("permission helpers", () => {
  it("allows cancelling only before the courier picks the parcel up", () => {
    expect(canCancelOrder(makeOrder())).toBe(true);
    expect(
      canCancelOrder(makeOrder({ shippingStatus: "ready_for_pickup" })),
    ).toBe(true);
    expect(canCancelOrder(makeOrder({ shippingStatus: "shipped" }))).toBe(
      false,
    );
    expect(canCancelOrder(makeOrder({ shippingStatus: "cancelled" }))).toBe(
      false,
    );
    expect(canCancelOrder(makeOrder({ paymentStatus: "refunding" }))).toBe(
      false,
    );
  });

  it("offers online payment only for unpaid online orders", () => {
    expect(canPayOrder(makeOrder())).toBe(true);
    expect(canPayOrder(makeOrder({ paymentStatus: "failed" }))).toBe(true);
    expect(canPayOrder(makeOrder({ paymentStatus: "paid" }))).toBe(false);
    expect(canPayOrder(makeOrder({ paymentMethod: "cash_on_delivery" }))).toBe(
      false,
    );
    expect(canPayOrder(makeOrder({ shippingStatus: "cancelled" }))).toBe(false);
  });

  it("refunds only paid Paymob orders with a transaction", () => {
    expect(
      canRefundOrder(
        makeOrder({ paymentStatus: "paid", paymobTransactionID: "tx" }),
      ),
    ).toBe(true);
    expect(canRefundOrder(makeOrder({ paymentStatus: "paid" }))).toBe(false);
    expect(
      canRefundOrder(
        makeOrder({
          paymentMethod: "cash_on_delivery",
          paymentStatus: "paid",
          paymobTransactionID: "tx",
        }),
      ),
    ).toBe(false);
  });
});

it("formats order numbers", () => {
  expect(formatOrderNumber(42)).toBe("#00042");
});

describe("tracking links", () => {
  it("points to Bosta's public tracking page", () => {
    expect(bostaTrackingUrl("5150249474")).toBe(
      "https://bosta.co/tracking-shipments?shipment-number=5150249474",
    );
  });

  it("rebuilds the link from the tracking number, ignoring broken stored URLs", () => {
    expect(
      orderTrackingUrl(
        makeOrder({
          bostaTrackingNumber: "5150249474",
          bostaTrackingUrl: "https://app.bosta.co/tracking-shipment/5150249474",
        }),
      ),
    ).toBe("https://bosta.co/tracking-shipments?shipment-number=5150249474");
    expect(orderTrackingUrl(makeOrder())).toBeNull();
  });
});

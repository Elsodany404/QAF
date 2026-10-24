import { describe, expect, it } from "vitest";

import { makeOrder } from "@/test/fixtures";
import {
  bostaStateToShippingStatus,
  bostaTrackingUrl,
  canCancelOrder,
  canPayOrder,
  bostaStateToReturnStatus,
  canRefundOrder,
  canRequestReturn,
  canReviewReturn,
  DISPLAY_STATUS_META,
  hasRefundablePayment,
  normalizeReturnStatus,
  RETURN_STATUSES,
  shouldApplyReturnUpdate,
  formatOrderNumber,
  getDisplayStatus,
  getTrackingStepIndex,
  normalizePaymentStatus,
  normalizeShippingStatus,
  orderTrackingUrl,
  PAYMENT_STATUSES,
  SHIPPING_STATUSES,
  shouldApplyShippingUpdate,
  type ShippingStatus,
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
    const paid = { paymentStatus: "paid", paymobTransactionID: "tx" };
    expect(hasRefundablePayment(makeOrder(paid))).toBe(true);
    expect(hasRefundablePayment(makeOrder({ paymentStatus: "paid" }))).toBe(
      false,
    );
    expect(
      hasRefundablePayment(
        makeOrder({ ...paid, paymentMethod: "cash_on_delivery" }),
      ),
    ).toBe(false);
  });

  it("refunds through Paymob only once the order is cancelled", () => {
    const paid = { paymentStatus: "paid", paymobTransactionID: "tx" };
    expect(
      canRefundOrder(makeOrder({ ...paid, shippingStatus: "cancelled" })),
    ).toBe(true);
    // Delivered orders are refunded in cash by Bosta when they come back.
    for (const shippingStatus of ["processing", "delivered", "returned"]) {
      expect(canRefundOrder(makeOrder({ ...paid, shippingStatus }))).toBe(
        false,
      );
    }
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

describe("order lifecycle invariants (every status combination)", () => {
  const happyPath: ShippingStatus[] = [
    "processing",
    "ready_for_pickup",
    "shipped",
    "out_for_delivery",
    "delivered",
  ];
  const pairs = SHIPPING_STATUSES.flatMap((current) =>
    SHIPPING_STATUSES.map((next) => [current, next] as const),
  );

  it("never moves an order backwards along the happy path", () => {
    for (const [current, next] of pairs) {
      const from = happyPath.indexOf(current);
      const to = happyPath.indexOf(next);
      if (from !== -1 && to !== -1 && to <= from) {
        expect(shouldApplyShippingUpdate(current, next)).toBe(false);
      }
    }
  });

  it("only lets a return follow a finished order, and nothing follow a return", () => {
    for (const [current, next] of pairs) {
      const applied = shouldApplyShippingUpdate(current, next);
      if (current === "returned") expect(applied).toBe(false);
      if (current === "delivered" || current === "cancelled") {
        expect(applied).toBe(next === "returned");
      }
    }
  });

  it("ignores repeated webhooks", () => {
    for (const status of SHIPPING_STATUSES) {
      expect(shouldApplyShippingUpdate(status, status)).toBe(false);
    }
  });

  it("lets a delivery issue move on, and any open order hit one", () => {
    for (const status of happyPath.slice(0, -1)) {
      expect(shouldApplyShippingUpdate(status, "exception")).toBe(true);
      expect(shouldApplyShippingUpdate("exception", status)).toBe(true);
    }
    expect(shouldApplyShippingUpdate("exception", "delivered")).toBe(true);
  });

  it("maps every Bosta state to a status the app knows", () => {
    for (let state = 0; state <= 200; state++) {
      const status = bostaStateToShippingStatus(state);
      if (status !== null) expect(SHIPPING_STATUSES).toContain(status);
    }
  });

  const methods = ["paymob_card", "mobile_wallet", "cash_on_delivery"];
  const everyOrder = methods.flatMap((paymentMethod) =>
    PAYMENT_STATUSES.flatMap((paymentStatus) =>
      SHIPPING_STATUSES.map((shippingStatus) =>
        makeOrder({
          paymentMethod,
          paymentStatus,
          shippingStatus,
          paymobTransactionID: paymentStatus === "pending" ? null : "tx",
        }),
      ),
    ),
  );

  it("gives every order a status with a label", () => {
    for (const order of everyOrder) {
      const status = getDisplayStatus(order);
      expect(DISPLAY_STATUS_META[status].label).toBeTruthy();
      expect(getTrackingStepIndex(order)).toBeGreaterThanOrEqual(0);
      expect(getTrackingStepIndex(order)).toBeLessThan(5);
    }
  });

  it("never asks for a payment that could be taken twice", () => {
    for (const order of everyOrder) {
      if (canPayOrder(order)) {
        expect(order.paymentMethod).not.toBe("cash_on_delivery");
        expect(["pending", "failed"]).toContain(order.paymentStatus);
        expect(order.shippingStatus).toBe("processing");
      }
    }
  });

  it("only refunds money Paymob took, for orders that were cancelled", () => {
    for (const order of everyOrder) {
      if (canRefundOrder(order)) {
        expect(order.paymentStatus).toBe("paid");
        expect(order.paymentMethod).not.toBe("cash_on_delivery");
        expect(order.paymobTransactionID).toBeTruthy();
        expect(order.shippingStatus).toBe("cancelled");
      }
    }
  });

  it("never cancels an order the courier has, or one being refunded", () => {
    for (const order of everyOrder) {
      if (canCancelOrder(order)) {
        expect(["processing", "ready_for_pickup"]).toContain(
          order.shippingStatus,
        );
        expect(order.paymentStatus).not.toBe("refunding");
      }
    }
  });

  it("flags every cancelled-but-paid online order for a refund", () => {
    for (const order of everyOrder) {
      const refundDue =
        order.shippingStatus === "cancelled" &&
        order.paymentStatus === "paid" &&
        order.paymentMethod !== "cash_on_delivery";
      expect(getDisplayStatus(order) === "refund_due").toBe(refundDue);
    }
  });
});

describe("returns", () => {
  const delivered = (overrides = {}) =>
    makeOrder({
      paymentStatus: "paid",
      shippingStatus: "delivered",
      ...overrides,
    });

  it("reads unknown or missing return statuses as no return", () => {
    expect(normalizeReturnStatus(null)).toBeNull();
    expect(normalizeReturnStatus(undefined)).toBeNull();
    expect(normalizeReturnStatus("maybe")).toBeNull();
    for (const status of RETURN_STATUSES) {
      expect(normalizeReturnStatus(status)).toBe(status);
    }
  });

  it("lets the customer ask once, and only for a delivered order", () => {
    expect(canRequestReturn(delivered())).toBe(true);
    expect(canRequestReturn(delivered({ returnStatus: "requested" }))).toBe(
      false,
    );
    expect(canRequestReturn(delivered({ returnStatus: "rejected" }))).toBe(
      false,
    );
    for (const shippingStatus of SHIPPING_STATUSES) {
      if (shippingStatus === "delivered") continue;
      expect(canRequestReturn(makeOrder({ shippingStatus }))).toBe(false);
    }
  });

  it("lets the admin review a request, or re-book a pickup Bosta cancelled", () => {
    const review = RETURN_STATUSES.filter((returnStatus) =>
      canReviewReturn(delivered({ returnStatus })),
    );
    expect(review).toEqual(["requested", "pickup_failed"]);
    expect(canReviewReturn(delivered())).toBe(false);
  });

  it.each([
    [10, "pickup_scheduled"],
    [20, "pickup_scheduled"],
    [22, "pickup_scheduled"],
    [23, "picked_up"],
    [24, "picked_up"],
    [30, "picked_up"],
    [41, "picked_up"],
    [46, "returned"],
    ["46", "returned"],
    [48, "pickup_failed"],
    [49, "pickup_failed"],
  ])("reads return pickup state %j as %s", (state, status) => {
    expect(bostaStateToReturnStatus(state)).toBe(status);
  });

  it.each([47, 45, 100, 103, 105, "x", null])(
    "ignores state %j on a return pickup",
    (state) => {
      expect(bostaStateToReturnStatus(state)).toBeNull();
    },
  );

  it("moves a booked pickup forward only", () => {
    expect(shouldApplyReturnUpdate("pickup_scheduled", "picked_up")).toBe(true);
    expect(shouldApplyReturnUpdate("pickup_scheduled", "returned")).toBe(true);
    expect(shouldApplyReturnUpdate("picked_up", "returned")).toBe(true);
    expect(shouldApplyReturnUpdate("picked_up", "pickup_scheduled")).toBe(
      false,
    );
    expect(shouldApplyReturnUpdate("returned", "picked_up")).toBe(false);
    expect(
      shouldApplyReturnUpdate("pickup_scheduled", "pickup_scheduled"),
    ).toBe(false);
  });

  it("only fails a pickup before the courier has the items", () => {
    expect(shouldApplyReturnUpdate("pickup_scheduled", "pickup_failed")).toBe(
      true,
    );
    // The customer already got the cash: a late cancel can't undo that.
    expect(shouldApplyReturnUpdate("picked_up", "pickup_failed")).toBe(false);
    expect(shouldApplyReturnUpdate("returned", "pickup_failed")).toBe(false);
  });

  it("ignores Bosta updates for returns without a booked pickup", () => {
    for (const current of [
      null,
      "requested",
      "rejected",
      "pickup_failed",
    ] as const) {
      for (const next of RETURN_STATUSES) {
        expect(shouldApplyReturnUpdate(current, next)).toBe(false);
      }
    }
  });

  it.each([
    [{ returnStatus: "requested" }, "return_requested"],
    [{ returnStatus: "pickup_scheduled" }, "return_scheduled"],
    [{ returnStatus: "picked_up" }, "return_refunded"],
    [
      {
        returnStatus: "returned",
        shippingStatus: "returned",
        paymentStatus: "refunded",
      },
      "return_refunded",
    ],
    [{ returnStatus: "pickup_failed" }, "return_issue"],
    [{ returnStatus: "rejected" }, "delivered"],
  ])("shows %o as %s", (fields, status) => {
    expect(getDisplayStatus(delivered(fields))).toBe(status);
  });

  it("keeps the delivery progress complete during a return", () => {
    for (const returnStatus of RETURN_STATUSES) {
      expect(getTrackingStepIndex(delivered({ returnStatus }))).toBe(4);
    }
  });
});

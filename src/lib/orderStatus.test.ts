import { describe, expect, it } from "vitest";

import { makeOrder } from "@/test/fixtures";
import {
  bostaRtoStateToShippingStatus,
  bostaStateToShippingStatus,
  bostaTrackingUrl,
  canCancelOrder,
  canCustomerCancelOrder,
  canPayOrder,
  customerWhatsAppTopic,
  DISPLAY_STATUS_META,
  formatOrderNumber,
  getDisplayStatus,
  getTrackingStepIndex,
  hasOnlinePayment,
  needsAdminAction,
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

describe("bostaRtoStateToShippingStatus", () => {
  it("marks the order returned once the parcel is back at the shop", () => {
    expect(bostaRtoStateToShippingStatus(46)).toBe("returned");
    expect(bostaRtoStateToShippingStatus("46")).toBe("returned");
  });

  it.each([20, 24, 30, 41, 47, 48, 49, 100, 101, 103, 105])(
    "keeps state %i of a returning parcel a delivery issue, never out for delivery",
    (state) => {
      expect(bostaRtoStateToShippingStatus(state)).toBe("exception");
    },
  );

  it("ignores codes that carry no news for a return", () => {
    expect(bostaRtoStateToShippingStatus(45)).toBeNull();
    expect(bostaRtoStateToShippingStatus(104)).toBeNull();
    expect(bostaRtoStateToShippingStatus("abc")).toBeNull();
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

  it("shows a cancelled or returned order as it is, paid or not", () => {
    // Refunds are agreed on WhatsApp: there's no "refund due" status.
    for (const shippingStatus of ["cancelled", "returned"]) {
      for (const paymentStatus of ["pending", "paid", "refunded"]) {
        expect(
          getDisplayStatus(makeOrder({ shippingStatus, paymentStatus })),
        ).toBe(shippingStatus);
      }
    }
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
  });

  it("lets customers cancel only orders they haven't paid for online", () => {
    expect(canCustomerCancelOrder(makeOrder())).toBe(true);
    expect(
      canCustomerCancelOrder(makeOrder({ paymentMethod: "cash_on_delivery" })),
    ).toBe(true);
    // Paid online: cancelling means a refund, which goes through WhatsApp.
    expect(canCustomerCancelOrder(makeOrder({ paymentStatus: "paid" }))).toBe(
      false,
    );
    // The shop can still cancel it.
    expect(canCancelOrder(makeOrder({ paymentStatus: "paid" }))).toBe(true);
    expect(
      canCustomerCancelOrder(makeOrder({ shippingStatus: "shipped" })),
    ).toBe(false);
  });

  it("counts only online payments that weren't refunded as money taken", () => {
    expect(hasOnlinePayment(makeOrder({ paymentStatus: "paid" }))).toBe(true);
    expect(hasOnlinePayment(makeOrder({ paymentStatus: "pending" }))).toBe(
      false,
    );
    expect(hasOnlinePayment(makeOrder({ paymentStatus: "refunded" }))).toBe(
      false,
    );
    // Cash is collected on delivery, by the courier.
    expect(
      hasOnlinePayment(
        makeOrder({ paymentMethod: "cash_on_delivery", paymentStatus: "paid" }),
      ),
    ).toBe(false);
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
});

describe("customerWhatsAppTopic", () => {
  it.each([
    [
      "a paid order the courier doesn't have yet",
      { paymentStatus: "paid" },
      "cancel",
    ],
    [
      "a paid order waiting for the courier",
      { paymentStatus: "paid", shippingStatus: "ready_for_pickup" },
      "cancel",
    ],
    [
      "a delivered order",
      { paymentStatus: "paid", shippingStatus: "delivered" },
      "return",
    ],
    [
      "a delivered cash order",
      {
        paymentMethod: "cash_on_delivery",
        paymentStatus: "paid",
        shippingStatus: "delivered",
      },
      "return",
    ],
    [
      "a paid order cancelled by the shop",
      { paymentStatus: "paid", shippingStatus: "cancelled" },
      "refund",
    ],
    [
      "a paid order brought back",
      { paymentStatus: "paid", shippingStatus: "returned" },
      "refund",
    ],
    [
      "an unpaid order brought back",
      { paymentMethod: "cash_on_delivery", shippingStatus: "returned" },
      "help",
    ],
    [
      "a delivery issue",
      { paymentStatus: "paid", shippingStatus: "exception" },
      "help",
    ],
  ])("asks about %s: %s", (_, fields, topic) => {
    expect(customerWhatsAppTopic(makeOrder(fields))).toBe(topic);
  });

  it.each([
    ["an unpaid order they can cancel themselves", {}],
    [
      "a cash order waiting for the courier",
      { paymentMethod: "cash_on_delivery" },
    ],
    [
      "an order on its way",
      { paymentStatus: "paid", shippingStatus: "out_for_delivery" },
    ],
    ["an unpaid order they cancelled", { shippingStatus: "cancelled" }],
    [
      "an order already refunded",
      { paymentStatus: "refunded", shippingStatus: "cancelled" },
    ],
  ])("has nothing to ask about %s", (_, fields) => {
    expect(customerWhatsAppTopic(makeOrder(fields))).toBeNull();
  });
});

describe("needsAdminAction", () => {
  it("flags a delivery issue", () => {
    expect(needsAdminAction(makeOrder({ shippingStatus: "exception" }))).toBe(
      true,
    );
  });

  it("flags money taken for an order that won't be delivered, until it's refunded", () => {
    for (const shippingStatus of ["cancelled", "returned"]) {
      expect(
        needsAdminAction(makeOrder({ shippingStatus, paymentStatus: "paid" })),
      ).toBe(true);
      expect(
        needsAdminAction(
          makeOrder({ shippingStatus, paymentStatus: "refunded" }),
        ),
      ).toBe(false);
      expect(
        needsAdminAction(
          makeOrder({
            shippingStatus,
            paymentMethod: "cash_on_delivery",
            paymentStatus: "pending",
          }),
        ),
      ).toBe(false);
    }
  });

  it("flags an order ready to ship without a Bosta shipment", () => {
    expect(needsAdminAction(makeOrder({ paymentStatus: "paid" }))).toBe(true);
    expect(
      needsAdminAction(makeOrder({ paymentMethod: "cash_on_delivery" })),
    ).toBe(true);
    expect(
      needsAdminAction(
        makeOrder({ paymentStatus: "paid", bostaOrderID: "b1" }),
      ),
    ).toBe(false);
    // Waiting for the customer to pay.
    expect(needsAdminAction(makeOrder())).toBe(false);
  });

  it("leaves orders on their way or delivered alone", () => {
    for (const shippingStatus of ["shipped", "out_for_delivery", "delivered"]) {
      expect(
        needsAdminAction(makeOrder({ shippingStatus, paymentStatus: "paid" })),
      ).toBe(false);
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

  it("never cancels an order the courier has", () => {
    for (const order of everyOrder) {
      if (canCancelOrder(order)) {
        expect(["processing", "ready_for_pickup"]).toContain(
          order.shippingStatus,
        );
      }
    }
  });

  it("never lets a customer cancel an order they paid for online", () => {
    for (const order of everyOrder) {
      if (canCustomerCancelOrder(order)) {
        expect(
          order.paymentMethod !== "cash_on_delivery" &&
            order.paymentStatus === "paid",
        ).toBe(false);
      }
    }
  });

  it("sends every paid online order the customer can't cancel or receive to WhatsApp", () => {
    for (const order of everyOrder) {
      const paidOnline =
        order.paymentMethod !== "cash_on_delivery" &&
        order.paymentStatus === "paid";
      const topic = customerWhatsAppTopic(order);
      if (paidOnline && canCancelOrder(order)) expect(topic).toBe("cancel");
      if (
        paidOnline &&
        (order.shippingStatus === "cancelled" ||
          order.shippingStatus === "returned")
      ) {
        expect(topic).toBe("refund");
        expect(needsAdminAction(order)).toBe(true);
      }
      if (order.shippingStatus === "delivered") expect(topic).toBe("return");
    }
  });

  it("maps every RTO state to a status the app knows, never a forward one", () => {
    for (let state = 0; state <= 200; state++) {
      const status = bostaRtoStateToShippingStatus(state);
      if (status !== null) expect(["exception", "returned"]).toContain(status);
    }
  });
});

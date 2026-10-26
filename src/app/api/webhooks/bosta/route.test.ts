import { beforeEach, describe, expect, it, vi } from "vitest";

import { createFakeSupabase } from "@/test/fakeSupabase";

const db = vi.hoisted(() => ({
  fake: null as ReturnType<typeof createFakeSupabase> | null,
}));
vi.mock("@/supabase/admin", async () => {
  const { createFakeSupabase } = await import("@/test/fakeSupabase");
  db.fake = createFakeSupabase();
  return { default: db.fake.client };
});

const { POST } = await import("./route");
const fake = () => db.fake!;

function request(body: unknown, authorization = "bosta-webhook-secret") {
  return new Request("https://shop.test/api/webhooks/bosta", {
    method: "POST",
    headers: { Authorization: authorization },
    body: JSON.stringify(body),
  });
}

const order = (overrides = {}) => ({
  id: 42,
  paymentMethod: "cash_on_delivery",
  shippingStatus: "ready_for_pickup",
  bostaTrackingNumber: "TRK1",
  ...overrides,
});

// What the conditional update returns when it changed the row.
const updated = { data: { id: 42 } };
// ...and when another update changed the status first.
const lostRace = { data: null };

beforeEach(() => {
  fake().reset();
  vi.restoreAllMocks();
});

describe("Bosta webhook", () => {
  it("rejects requests without the shared secret", async () => {
    expect(
      (await POST(request({ _id: "b1", state: 45 }, "wrong"))).status,
    ).toBe(401);
    expect((await POST(request({ _id: "b1", state: 45 }, ""))).status).toBe(
      401,
    );
    expect(fake().queries).toHaveLength(0);
  });

  it("looks the order up by Bosta delivery id and advances it", async () => {
    fake().queue("Order", { data: order() }, updated);

    const response = await POST(request({ _id: "b1", state: 21 }));

    expect(response.status).toBe(200);
    expect(fake().queries[0].filters).toContainEqual([
      "eq",
      "bostaOrderID",
      "b1",
    ]);
    const [update] = fake().updates("Order");
    expect(update.payload).toEqual({ shippingStatus: "shipped" });
    // Optimistic lock against concurrent updates.
    expect(update.filters).toContainEqual([
      "eq",
      "shippingStatus",
      "ready_for_pickup",
    ]);
  });

  it("marks cash-on-delivery orders paid when delivered", async () => {
    fake().queue(
      "Order",
      { data: order({ shippingStatus: "out_for_delivery" }) },
      updated,
    );

    const response = await POST(request({ _id: "b1", state: 45 }));

    expect(response.status).toBe(200);
    expect(fake().updates("Order")[0].payload).toEqual({
      shippingStatus: "delivered",
      paymentStatus: "paid",
    });
  });

  it("does not touch payment for prepaid orders", async () => {
    fake().queue(
      "Order",
      {
        data: order({
          paymentMethod: "paymob_card",
          shippingStatus: "out_for_delivery",
        }),
      },
      updated,
    );

    await POST(request({ _id: "b1", state: 45 }));

    expect(fake().updates("Order")[0].payload).toEqual({
      shippingStatus: "delivered",
    });
  });

  it("ignores out-of-order updates that would move the order backwards", async () => {
    fake().queue("Order", { data: order({ shippingStatus: "delivered" }) });

    const response = await POST(request({ _id: "b1", state: 21 }));

    expect(response.status).toBe(200);
    expect(fake().updates("Order")).toHaveLength(0);
  });

  it("acknowledges deliveries it doesn't know (e.g. returns)", async () => {
    fake().queue("Order", { data: null });
    expect((await POST(request({ _id: "unknown", state: 45 }))).status).toBe(
      200,
    );
    expect(fake().updates("Order")).toHaveLength(0);
  });

  it("backfills tracking info when it was missing", async () => {
    fake().queue(
      "Order",
      { data: order({ bostaTrackingNumber: null }) },
      updated,
    );

    await POST(request({ _id: "b1", state: 21, trackingNumber: 555 }));

    expect(fake().updates("Order")[0].payload).toMatchObject({
      bostaTrackingNumber: "555",
      bostaTrackingUrl: expect.stringContaining("555"),
    });
  });

  it("rejects payloads without a delivery id", async () => {
    expect((await POST(request({ state: 45 }))).status).toBe(400);
  });

  it("ignores states that don't apply to a delivery, without a query", async () => {
    for (const state of [22, 104, "abc", null]) {
      const response = await POST(request({ _id: "b1", state }));
      expect(response.status).toBe(200);
    }
    expect(fake().queries).toHaveLength(0);
  });

  describe("two webhooks for one delivery at the same time", () => {
    it("re-reads the order and still applies the update that lost the race", async () => {
      // "Out for delivery" and "delivered" both read "shipped"; "out for
      // delivery" wins, so "delivered" must try again from there.
      fake().queue(
        "Order",
        { data: order({ shippingStatus: "shipped" }) },
        lostRace,
        { data: order({ shippingStatus: "out_for_delivery" }) },
        updated,
      );

      const response = await POST(request({ _id: "b1", state: 45 }));

      expect(response.status).toBe(200);
      const [first, retry] = fake().updates("Order");
      expect(first.filters).toContainEqual(["eq", "shippingStatus", "shipped"]);
      expect(retry.filters).toContainEqual([
        "eq",
        "shippingStatus",
        "out_for_delivery",
      ]);
      // The cash was collected: a lost update would leave this unpaid.
      expect(retry.payload).toEqual({
        shippingStatus: "delivered",
        paymentStatus: "paid",
      });
    });

    it("drops the update when the winner already moved the order further", async () => {
      fake().queue(
        "Order",
        { data: order({ shippingStatus: "shipped" }) },
        lostRace,
        { data: order({ shippingStatus: "delivered" }) },
      );

      const response = await POST(request({ _id: "b1", state: 41 }));

      expect(response.status).toBe(200);
      expect(fake().updates("Order")).toHaveLength(1);
    });

    it("asks Bosta to retry when the order keeps changing", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const shipped = { data: order({ shippingStatus: "shipped" }) };
      fake().queue(
        "Order",
        shipped,
        lostRace,
        shipped,
        lostRace,
        shipped,
        lostRace,
      );

      const response = await POST(request({ _id: "b1", state: 45 }));

      expect(response.status).toBe(500);
      expect(fake().updates("Order")).toHaveLength(3);
    });
  });

  it("returns 500 so Bosta retries when the database fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fake().queue("Order", { error: { message: "timeout" } });

    expect((await POST(request({ _id: "b1", state: 45 }))).status).toBe(500);
  });
});

describe("Bosta webhook for a delivery issue", () => {
  it("records why Bosta flagged the delivery", async () => {
    fake().queue(
      "Order",
      { data: order({ shippingStatus: "out_for_delivery" }) },
      updated,
    );

    await POST(
      request({
        _id: "b1",
        state: 47,
        exceptionReason: "  Customer is not answering.  ",
        exceptionCode: 7,
      }),
    );

    expect(fake().updates("Order")[0].payload).toEqual({
      shippingStatus: "exception",
      bostaExceptionReason: "Customer is not answering.",
    });
  });

  it("drops an earlier issue's reason when a new one comes without any", async () => {
    fake().queue(
      "Order",
      {
        data: order({
          shippingStatus: "out_for_delivery",
          bostaExceptionReason: "Bad Weather.",
        }),
      },
      updated,
    );

    await POST(request({ _id: "b1", state: 47 }));

    expect(fake().updates("Order")[0].payload).toEqual({
      shippingStatus: "exception",
      bostaExceptionReason: null,
    });
  });

  it("keeps the latest reason when another attempt fails", async () => {
    fake().queue(
      "Order",
      {
        data: order({
          shippingStatus: "exception",
          bostaExceptionReason: "Customer is not answering.",
        }),
      },
      updated,
    );

    await POST(
      request({
        _id: "b1",
        state: 47,
        exceptionReason: "Waiting for data modification - wrong phone number.",
      }),
    );

    const [update] = fake().updates("Order");
    expect(update.payload).toEqual({
      bostaExceptionReason:
        "Waiting for data modification - wrong phone number.",
    });
    expect(update.filters).toContainEqual(["eq", "shippingStatus", "exception"]);
  });

  it("ignores the same reason sent again", async () => {
    fake().queue("Order", {
      data: order({
        shippingStatus: "exception",
        bostaExceptionReason: "Bad Weather.",
      }),
    });

    await POST(
      request({ _id: "b1", state: 47, exceptionReason: "Bad Weather." }),
    );

    expect(fake().updates("Order")).toHaveLength(0);
  });
});

describe("Bosta webhook for a delivery coming back (RTO)", () => {
  const rto = (state: number, extra = {}) => ({
    _id: "b1",
    type: "RTO",
    trackingNumber: "TRK1",
    state,
    ...extra,
  });

  it("reads 41 as heading back to the shop, never as out for delivery", async () => {
    fake().queue(
      "Order",
      { data: order({ shippingStatus: "out_for_delivery" }) },
      updated,
    );

    await POST(request(rto(41)));

    expect(fake().updates("Order")[0].payload).toEqual({
      shippingStatus: "exception",
      bostaExceptionReason: null,
    });
  });

  it("doesn't reopen the delivery while the parcel is on its way back", async () => {
    for (const state of [24, 30, 41]) {
      fake().reset();
      fake().queue("Order", { data: order({ shippingStatus: "exception" }) });

      await POST(request(rto(state)));

      expect(fake().updates("Order")).toHaveLength(0);
    }
  });

  it("marks the order returned when the parcel is back", async () => {
    fake().queue(
      "Order",
      { data: order({ shippingStatus: "exception" }) },
      updated,
    );

    await POST(request(rto(46)));

    expect(fake().updates("Order")[0].payload).toEqual({
      shippingStatus: "returned",
    });
  });

  it("finds the order by tracking number if Bosta gives the return a new id", async () => {
    fake().queue(
      "Order",
      { data: null },
      { data: order({ shippingStatus: "cancelled" }) },
      updated,
    );

    await POST(request(rto(46, { _id: "rto-9" })));

    const [byID, byTracking] = fake().queries;
    expect(byID.filters).toContainEqual(["eq", "bostaOrderID", "rto-9"]);
    expect(byTracking.filters).toContainEqual([
      "eq",
      "bostaTrackingNumber",
      "TRK1",
    ]);
    expect(fake().updates("Order")[0].payload).toEqual({
      shippingStatus: "returned",
    });
  });

  it("only falls back to the tracking number for returns", async () => {
    fake().queue("Order", { data: null });

    await POST(request({ _id: "x", state: 46, trackingNumber: "TRK1" }));

    expect(fake().queries).toHaveLength(1);
  });
});

describe("Bosta webhook for a customer return pickup", () => {
  // Returns are arranged on WhatsApp; a pickup booked in Bosta's dashboard
  // must not touch the order, whatever its state codes say.
  it.each([10, 23, 41, 45, 46, 48, 49])(
    "ignores state %i without reading or changing any order",
    async (state) => {
      const response = await POST(
        request({
          _id: "crp-1",
          type: "CUSTOMER_RETURN_PICKUP",
          trackingNumber: "TRK1",
          state,
        }),
      );

      expect(response.status).toBe(200);
      expect(fake().queries).toHaveLength(0);
    },
  );
});

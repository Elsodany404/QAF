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

describe("Bosta webhook for a customer return pickup", () => {
  const returnPickup = (state: number) => ({
    _id: "crp-1",
    type: "CUSTOMER_RETURN_PICKUP",
    state,
  });
  const returning = (returnStatus: string) => ({
    data: { id: 42, returnStatus },
  });

  it("finds the order by its return pickup, not its delivery", async () => {
    fake().queue("Order", returning("pickup_scheduled"), updated);

    const response = await POST(request(returnPickup(23)));

    expect(response.status).toBe(200);
    expect(fake().queries[0].filters).toContainEqual([
      "eq",
      "bostaReturnID",
      "crp-1",
    ]);
  });

  it("marks the order refunded once the courier has the items", async () => {
    fake().queue("Order", returning("pickup_scheduled"), updated);

    await POST(request(returnPickup(23)));

    const [update] = fake().updates("Order");
    expect(update.payload).toEqual({
      returnStatus: "picked_up",
      paymentStatus: "refunded",
    });
    expect(update.filters).toContainEqual([
      "eq",
      "returnStatus",
      "pickup_scheduled",
    ]);
  });

  it("marks the order returned when the items are back", async () => {
    fake().queue("Order", returning("picked_up"), updated);

    await POST(request(returnPickup(46)));

    expect(fake().updates("Order")[0].payload).toEqual({
      returnStatus: "returned",
      paymentStatus: "refunded",
      shippingStatus: "returned",
    });
  });

  it("still records the refund when the pick-up webhook was missed", async () => {
    fake().queue("Order", returning("pickup_scheduled"), updated);

    await POST(request(returnPickup(46)));

    expect(fake().updates("Order")[0].payload).toMatchObject({
      paymentStatus: "refunded",
    });
  });

  it("reads 41 as heading back to the shop, never as out for delivery", async () => {
    fake().queue("Order", returning("pickup_scheduled"), updated);

    await POST(request(returnPickup(41)));

    expect(fake().updates("Order")[0].payload).toEqual({
      returnStatus: "picked_up",
      paymentStatus: "refunded",
    });
  });

  it("lets the admin book again when Bosta cancels the pickup", async () => {
    fake().queue("Order", returning("pickup_scheduled"), updated);

    await POST(request(returnPickup(48)));

    expect(fake().updates("Order")[0].payload).toEqual({
      returnStatus: "pickup_failed",
    });
  });

  it.each([
    ["a late cancel after the refund was paid", "picked_up", 49],
    ["an out-of-order update", "returned", 23],
    ["a repeat", "picked_up", 23],
    ["a return the admin hasn't booked", "requested", 23],
  ])("ignores %s", async (_, current, state) => {
    fake().queue("Order", returning(current));

    const response = await POST(request(returnPickup(state)));

    expect(response.status).toBe(200);
    expect(fake().updates("Order")).toHaveLength(0);
  });

  it("ignores states that don't change a return, without a query", async () => {
    for (const state of [47, 102, 103, 105]) {
      expect((await POST(request(returnPickup(state)))).status).toBe(200);
    }
    expect(fake().queries).toHaveLength(0);
  });

  it("acknowledges return pickups it doesn't know", async () => {
    fake().queue("Order", { data: null });
    expect((await POST(request(returnPickup(23)))).status).toBe(200);
    expect(fake().updates("Order")).toHaveLength(0);
  });

  it("re-reads and retries when another update wins the race", async () => {
    fake().queue(
      "Order",
      returning("pickup_scheduled"),
      lostRace,
      returning("picked_up"),
      updated,
    );

    const response = await POST(request(returnPickup(46)));

    expect(response.status).toBe(200);
    const [, retry] = fake().updates("Order");
    expect(retry.filters).toContainEqual(["eq", "returnStatus", "picked_up"]);
  });
});

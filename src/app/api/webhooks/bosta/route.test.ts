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

beforeEach(() => fake().reset());

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
    fake().queue("Order", { data: order() }, { data: null });

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
      { data: null },
    );

    await POST(request({ _id: "b1", state: 45 }));

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
      { data: null },
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
      { data: null },
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
});

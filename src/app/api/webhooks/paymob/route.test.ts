import crypto from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createFakeSupabase } from "@/test/fakeSupabase";

const mocks = vi.hoisted(() => ({
  fake: null as ReturnType<typeof createFakeSupabase> | null,
  createBostaDelivery: vi.fn(),
  sendOrderConfirmation: vi.fn(),
}));

vi.mock("@/supabase/admin", async () => {
  const { createFakeSupabase } = await import("@/test/fakeSupabase");
  mocks.fake = createFakeSupabase();
  return { default: mocks.fake.client };
});
vi.mock("@/services/Bosta", () => ({
  createBostaDelivery: mocks.createBostaDelivery,
}));
vi.mock("@/services/OrderEmails", () => ({
  sendOrderConfirmation: mocks.sendOrderConfirmation,
}));

const { POST } = await import("./route");
const fake = () => mocks.fake!;

function transaction(overrides: Record<string, unknown> = {}) {
  return {
    id: 9001,
    amount_cents: 46000,
    created_at: "2026-10-01T10:00:00",
    currency: "EGP",
    error_occured: false,
    has_parent_transaction: false,
    integration_id: 111,
    is_3d_secure: true,
    is_auth: false,
    is_capture: false,
    is_refunded: false,
    is_standalone_payment: true,
    is_voided: false,
    owner: 1,
    pending: false,
    success: true,
    order: { id: 777, merchant_order_id: "42-1700000000000" },
    source_data: { pan: "2346", sub_type: "MasterCard", type: "card" },
    ...overrides,
  };
}

// Same field order as Paymob's HMAC spec.
function sign(tx: ReturnType<typeof transaction>) {
  const raw = [
    tx.amount_cents,
    tx.created_at,
    tx.currency,
    tx.error_occured,
    tx.has_parent_transaction,
    tx.id,
    tx.integration_id,
    tx.is_3d_secure,
    tx.is_auth,
    tx.is_capture,
    tx.is_refunded,
    tx.is_standalone_payment,
    tx.is_voided,
    tx.order.id,
    tx.owner,
    tx.pending,
    tx.source_data.pan,
    tx.source_data.sub_type,
    tx.source_data.type,
    tx.success,
  ]
    .map(String)
    .join("");
  return crypto.createHmac("sha512", "paymob-hmac").update(raw).digest("hex");
}

function request(tx: ReturnType<typeof transaction>, hmac = sign(tx)) {
  return new Request(`https://shop.test/api/webhooks/paymob?hmac=${hmac}`, {
    method: "POST",
    body: JSON.stringify({ type: "TRANSACTION", obj: tx }),
  });
}

const pendingOrder = {
  id: 42,
  totalPrice: 460,
  paymentStatus: "pending",
  shippingStatus: "processing",
  bostaOrderID: null,
};

beforeEach(() => {
  fake().reset();
  mocks.createBostaDelivery.mockReset();
  mocks.sendOrderConfirmation.mockReset();
});

describe("Paymob webhook", () => {
  it("rejects requests with a wrong HMAC without touching the database", async () => {
    const response = await POST(request(transaction(), "00".repeat(64)));
    expect(response.status).toBe(401);
    expect(fake().queries).toHaveLength(0);
  });

  it("rejects a tampered amount even with the original signature", async () => {
    const tx = transaction();
    const hmac = sign(tx);
    const response = await POST(request({ ...tx, amount_cents: 100 }, hmac));
    expect(response.status).toBe(401);
  });

  it("marks the order paid, ships it and emails the customer once", async () => {
    fake().queue("Order", { data: pendingOrder }, { data: { id: 42 } });

    const response = await POST(request(transaction()));

    expect(response.status).toBe(200);
    const [update] = fake().updates("Order");
    expect(update.payload).toMatchObject({
      paymentStatus: "paid",
      paymobTransactionID: "9001",
      paymobOrderID: "777",
    });
    // Only pending/failed orders may be flipped to paid.
    expect(update.filters).toContainEqual([
      "in",
      "paymentStatus",
      ["pending", "failed"],
    ]);
    expect(mocks.createBostaDelivery).toHaveBeenCalledWith(42);
    expect(mocks.sendOrderConfirmation).toHaveBeenCalledWith(42, "en");
  });

  it("emails customers who paid on the Arabic site in Arabic", async () => {
    fake().queue("Order", { data: pendingOrder }, { data: { id: 42 } });
    const tx = transaction({
      order: { id: 777, merchant_order_id: "42-1700000000000-ar" },
    });

    const response = await POST(request(tx));

    expect(response.status).toBe(200);
    expect(fake().updates("Order")[0].filters).toContainEqual(["eq", "id", 42]);
    expect(mocks.sendOrderConfirmation).toHaveBeenCalledWith(42, "ar");
  });

  it("is idempotent for retries of an already-paid order", async () => {
    fake().queue("Order", { data: { ...pendingOrder, paymentStatus: "paid" } });

    const response = await POST(request(transaction()));

    expect(response.status).toBe(200);
    expect(fake().updates("Order")).toHaveLength(0);
    expect(mocks.createBostaDelivery).not.toHaveBeenCalled();
    expect(mocks.sendOrderConfirmation).not.toHaveBeenCalled();
  });

  it("does not mark paid when the amount doesn't match the order", async () => {
    const tx = transaction({ amount_cents: 1000 });
    fake().queue("Order", { data: pendingOrder });

    const response = await POST(request(tx));

    expect(response.status).toBe(200);
    expect(fake().updates("Order")).toHaveLength(0);
  });

  it("records failed payments without shipping or emailing", async () => {
    const tx = transaction({ success: false });
    fake().queue("Order", { data: pendingOrder }, { data: { id: 42 } });

    await POST(request(tx));

    expect(fake().updates("Order")[0].payload).toMatchObject({
      paymentStatus: "failed",
    });
    expect(mocks.createBostaDelivery).not.toHaveBeenCalled();
    expect(mocks.sendOrderConfirmation).not.toHaveBeenCalled();
  });

  it("doesn't ship an order the customer cancelled before paying", async () => {
    fake().queue(
      "Order",
      { data: { ...pendingOrder, shippingStatus: "cancelled" } },
      { data: { id: 42 } },
    );

    await POST(request(transaction()));

    expect(fake().updates("Order")[0].payload).toMatchObject({
      paymentStatus: "paid",
    });
    expect(mocks.createBostaDelivery).not.toHaveBeenCalled();
    expect(mocks.sendOrderConfirmation).not.toHaveBeenCalled();
  });

  it("still acknowledges the payment if Bosta is down", async () => {
    mocks.createBostaDelivery.mockRejectedValue(new Error("Bosta down"));
    fake().queue("Order", { data: pendingOrder }, { data: { id: 42 } });
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(request(transaction()));

    expect(response.status).toBe(200);
    expect(mocks.sendOrderConfirmation).toHaveBeenCalledWith(42, "en");
  });

  it("ignores pending and refund callbacks", async () => {
    expect((await POST(request(transaction({ pending: true })))).status).toBe(
      200,
    );
    expect((await POST(request(transaction({ is_refund: true })))).status).toBe(
      200,
    );
    expect(fake().queries).toHaveLength(0);
  });
});

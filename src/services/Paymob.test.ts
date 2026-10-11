import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createFakeSupabase } from "@/test/fakeSupabase";
import { makeOrder } from "@/test/fixtures";

const db = vi.hoisted(() => ({
  fake: null as ReturnType<typeof createFakeSupabase> | null,
}));
vi.mock("@/supabase/admin", async () => {
  const { createFakeSupabase } = await import("@/test/fakeSupabase");
  db.fake = createFakeSupabase();
  return { default: db.fake.client };
});

const {
  createPaymobCheckout,
  parsePaymobReference,
  refundPaymobOrder,
  toCents,
} = await import("./Paymob");
const fake = () => db.fake!;
const fetchMock = vi.fn();

beforeEach(() => {
  fake().reset();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

const jsonResponse = (body: unknown, ok = true) =>
  ({ ok, status: ok ? 200 : 400, json: async () => body }) as Response;

it("converts pounds to integer cents", () => {
  expect(toCents(460)).toBe(46000);
  expect(toCents(19.995)).toBe(2000);
});

it("extracts the order id from a retried special_reference", () => {
  expect(parsePaymobReference("42-1700000000000")).toBe(42);
  expect(parsePaymobReference(42)).toBe(42);
  expect(parsePaymobReference("abc")).toBeNull();
  expect(parsePaymobReference(undefined)).toBeNull();
});

describe("createPaymobCheckout", () => {
  it("sends itemised amounts that add up to the total", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ client_secret: "secret_1" }));

    const url = await createPaymobCheckout(makeOrder());

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.amount).toBe(46000);
    expect(body.payment_methods).toEqual([111]);
    const sum = body.items.reduce(
      (total: number, i: { amount: number; quantity: number }) =>
        total + i.amount * i.quantity,
      0,
    );
    expect(sum).toBe(46000);
    expect(body.special_reference).toMatch(/^42-\d+$/);
    expect(body.billing_data).toMatchObject({
      first_name: "Sara",
      last_name: "Ahmed",
    });
    expect(url).toContain("clientSecret=secret_1");
  });

  it("falls back to a single line item when rounding doesn't add up", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ client_secret: "s" }));
    const order = makeOrder({ subTotal: 100, totalPrice: 160 });
    order.orderItems[0] = {
      ...order.orderItems[0],
      quantity: 3,
      totalPrice: 100,
    };

    await createPaymobCheckout(order);

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.items).toEqual([
      expect.objectContaining({ amount: 16000, quantity: 1 }),
    ]);
  });

  it("refuses cash-on-delivery orders", async () => {
    await expect(
      createPaymobCheckout(makeOrder({ paymentMethod: "cash_on_delivery" })),
    ).rejects.toThrow("Unsupported");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("surfaces Paymob errors", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ detail: "bad phone" }, false));
    await expect(createPaymobCheckout(makeOrder())).rejects.toThrow(
      "bad phone",
    );
  });
});

describe("refundPaymobOrder", () => {
  const paidOrder = {
    id: 42,
    totalPrice: 460,
    paymentStatus: "paid",
    paymobTransactionID: "tx-1",
  };

  it("claims the order, refunds, then marks it refunded", async () => {
    fake().queue(
      "Order",
      { data: paidOrder },
      { data: { id: 42 } }, // claim
      { data: null }, // finalize
    );
    fetchMock.mockResolvedValue(jsonResponse({ success: true }));

    await refundPaymobOrder(42);

    const updates = fake()
      .updates("Order")
      .map((u) => u.payload);
    expect(updates).toEqual([
      { paymentStatus: "refunding" },
      { paymentStatus: "refunded" },
    ]);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      transaction_id: "tx-1",
      amount_cents: "46000",
    });
  });

  it("does not call Paymob when another refund already claimed the order", async () => {
    fake().queue("Order", { data: paidOrder }, { data: null });
    await expect(refundPaymobOrder(42)).rejects.toThrow("already in progress");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("releases the claim when Paymob rejects the refund", async () => {
    fake().queue(
      "Order",
      { data: paidOrder },
      { data: { id: 42 } },
      { data: null },
    );
    fetchMock.mockResolvedValue(
      jsonResponse({ success: false, detail: "nope" }),
    );

    await expect(refundPaymobOrder(42)).rejects.toThrow("nope");
    expect(
      fake()
        .updates("Order")
        .map((u) => u.payload),
    ).toEqual([{ paymentStatus: "refunding" }, { paymentStatus: "paid" }]);
  });

  it("refuses to refund more than the order total", async () => {
    fake().queue("Order", { data: paidOrder });
    await expect(refundPaymobOrder(42, 1000)).rejects.toThrow("Refund amount");
  });

  it("refuses unpaid orders", async () => {
    fake().queue("Order", { data: { ...paidOrder, paymentStatus: "pending" } });
    await expect(refundPaymobOrder(42)).rejects.toThrow("no successful");
  });
});

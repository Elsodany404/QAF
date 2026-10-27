import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { makeOrder } from "@/test/fixtures";

const { createPaymobCheckout, paymobReference, readPaymobReference, toCents } =
  await import("./Paymob");
const fetchMock = vi.fn();

beforeEach(() => {
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

it("carries the checkout's language through Paymob and back", async () => {
  fetchMock.mockResolvedValue(jsonResponse({ client_secret: "s" }));

  await createPaymobCheckout(makeOrder(), "ar");
  await createPaymobCheckout(makeOrder());

  const arabic = JSON.parse(fetchMock.mock.calls[0][1].body);
  const english = JSON.parse(fetchMock.mock.calls[1][1].body);
  expect(arabic.redirection_url).toBe("https://shop.test/order-success/42");
  expect(english.redirection_url).toBe("https://shop.test/en/order-success/42");
  // The webhook reads the order and language back from the reference.
  expect(arabic.special_reference).toMatch(/^42-\d+-ar-[0-9a-f]{32}$/);
  expect(readPaymobReference(arabic.special_reference)).toEqual({
    orderID: 42,
    locale: "ar",
  });
  expect(readPaymobReference(english.special_reference)).toEqual({
    orderID: 42,
    locale: "en",
  });
  // The notification address stays the same: Paymob adds ?hmac= to it.
  expect(arabic.notification_url).toBe(english.notification_url);
});

describe("readPaymobReference", () => {
  it("gives a retried payment a new reference for the same order", () => {
    vi.useFakeTimers();
    const first = paymobReference(42, "en");
    vi.advanceTimersByTime(5);
    const second = paymobReference(42, "en");
    vi.useRealTimers();

    expect(first).not.toBe(second);
    expect(readPaymobReference(second)?.orderID).toBe(42);
  });

  it("rejects references this site didn't sign", () => {
    const valid = paymobReference(42, "en");
    const [, time, signature] = valid.split("-");
    for (const forged of [
      // Another order's ID with this order's signature: the replay attack.
      `43-${time}-${signature}`,
      // Switching the language changes what was signed too.
      `42-${time}-ar-${signature}`,
      `42-${time}-${"0".repeat(32)}`,
      // Unsigned references, as created before signing.
      "42-1700000000000",
      "42-1700000000000-ar",
      "42",
      42,
      undefined,
    ]) {
      expect(readPaymobReference(forged), String(forged)).toBeNull();
    }
  });

  it("depends on the secret key", () => {
    const reference = paymobReference(42, "en");
    vi.stubEnv("PAYMOB_HMAC_KEY", "another-key");
    expect(readPaymobReference(reference)).toBeNull();
    vi.unstubAllEnvs();
  });
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
    expect(body.special_reference).toMatch(/^42-\d+-[0-9a-f]{32}$/);
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

  it("describes each item by the options the customer chose", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ client_secret: "s" }));
    const order = makeOrder();
    order.orderItems[0] = {
      ...order.orderItems[0],
      options: [
        { id: 10, optionID: 100, label: "250g", priceModifier: 0 },
        { id: 6, optionID: 2, label: "Medium", priceModifier: 0 },
      ],
    };

    await createPaymobCheckout(order);

    const [item] = JSON.parse(fetchMock.mock.calls[0][1].body).items;
    expect(item).toMatchObject({
      name: "House Blend",
      description: "250g, Medium",
    });
  });

  it("keeps item text within Paymob's limits, whatever the catalog says", async () => {
    // Paymob refuses the whole payment over 250 / 500 characters.
    fetchMock.mockResolvedValue(jsonResponse({ client_secret: "s" }));
    const order = makeOrder();
    order.orderItems[0] = {
      ...order.orderItems[0],
      productName: "N".repeat(300),
      options: [{ id: 10, optionID: 100, label: "L".repeat(600) }],
    };

    await createPaymobCheckout(order);

    const [item] = JSON.parse(fetchMock.mock.calls[0][1].body).items;
    expect(item.name).toHaveLength(250);
    expect(item.description).toHaveLength(500);
    expect(item.description.endsWith("…")).toBe(true);
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

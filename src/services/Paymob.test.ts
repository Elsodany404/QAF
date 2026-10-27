import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { makeOrder } from "@/test/fixtures";

const {
  createPaymobCheckout,
  parsePaymobReference,
  paymobReferenceLocale,
  toCents,
} = await import("./Paymob");
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
  expect(arabic.redirection_url).toBe("https://shop.test/ar/order-success/42");
  expect(english.redirection_url).toBe("https://shop.test/order-success/42");
  // The webhook reads the language back from the reference.
  expect(arabic.special_reference).toMatch(/^42-\d+-ar$/);
  expect(paymobReferenceLocale(arabic.special_reference)).toBe("ar");
  expect(paymobReferenceLocale(english.special_reference)).toBe("en");
  expect(parsePaymobReference(arabic.special_reference)).toBe(42);
  // The notification address stays the same: Paymob adds ?hmac= to it.
  expect(arabic.notification_url).toBe(english.notification_url);
});

it("treats an unknown reference as English", () => {
  expect(paymobReferenceLocale(undefined)).toBe("en");
  expect(paymobReferenceLocale(42)).toBe("en");
  expect(paymobReferenceLocale("42-1700000000000-fr")).toBe("en");
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

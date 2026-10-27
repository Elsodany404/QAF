import { beforeEach, describe, expect, it, vi } from "vitest";

import { makeOrder } from "@/test/fixtures";

const mocks = vi.hoisted(() => ({
  session: null as null | { user: { id: string; role?: string } },
  headers: new Headers(),
  getOrderWithItems: vi.fn(),
  createPaymobCheckout: vi.fn(),
}));

vi.mock("@/lib/adminAccess", () => ({
  getCurrentSession: async () => mocks.session,
}));
vi.mock("@/services/Order", () => ({
  getOrderWithItems: mocks.getOrderWithItems,
}));
vi.mock("@/services/Paymob", () => ({
  createPaymobCheckout: mocks.createPaymobCheckout,
}));
vi.mock("next/headers", () => ({ headers: async () => mocks.headers }));

const { payOrder } = await import("./payOrder");

beforeEach(() => {
  mocks.session = { user: { id: "user-1" } };
  mocks.headers = new Headers();
  mocks.getOrderWithItems.mockReset();
  mocks.createPaymobCheckout.mockReset().mockResolvedValue("https://pay.test");
});

describe("payOrder", () => {
  it("requires a signed-in customer", async () => {
    mocks.session = null;
    expect(await payOrder(42)).toMatchObject({ success: false });
    expect(mocks.getOrderWithItems).not.toHaveBeenCalled();
  });

  it.each([0, -3, 1.5, "42"])("rejects order ID %j", async (orderID) => {
    expect(await payOrder(orderID as number)).toEqual({
      success: false,
      error: "Invalid order",
    });
  });

  it("hides other customers' orders, even from admins", async () => {
    mocks.session = { user: { id: "admin-1", role: "admin" } };
    mocks.getOrderWithItems.mockResolvedValue(makeOrder());

    expect(await payOrder(42)).toEqual({
      success: false,
      error: "Order not found",
    });
    expect(mocks.createPaymobCheckout).not.toHaveBeenCalled();
  });

  it("starts a new payment for an unpaid or failed online order", async () => {
    for (const paymentStatus of ["pending", "failed"]) {
      const order = makeOrder({ paymentStatus });
      mocks.getOrderWithItems.mockResolvedValue(order);

      expect(await payOrder(42)).toEqual({
        success: true,
        data: "https://pay.test",
      });
      expect(mocks.createPaymobCheckout).toHaveBeenLastCalledWith(order, "en");
    }
  });

  it("pays in the language of the account page", async () => {
    mocks.headers = new Headers({ "x-locale": "ar" });
    const order = makeOrder();
    mocks.getOrderWithItems.mockResolvedValue(order);

    await payOrder(42);
    expect(mocks.createPaymobCheckout).toHaveBeenLastCalledWith(order, "ar");

    mocks.createPaymobCheckout.mockRejectedValue(new Error("Paymob 500"));
    expect(await payOrder(42)).toEqual({
      success: false,
      error: "حدث خطأ غير متوقع",
    });
    expect(await payOrder(0)).toEqual({
      success: false,
      error: "طلب غير صالح",
    });
  });

  it.each([
    ["a paid order", { paymentStatus: "paid" }],
    ["a refunded order", { paymentStatus: "refunded" }],
    ["a cash-on-delivery order", { paymentMethod: "cash_on_delivery" }],
    ["a cancelled order", { shippingStatus: "cancelled" }],
    ["an order already shipped", { shippingStatus: "shipped" }],
  ])("doesn't take payment for %s", async (_, overrides) => {
    mocks.getOrderWithItems.mockResolvedValue(makeOrder(overrides));

    expect(await payOrder(42)).toEqual({
      success: false,
      error: "This order cannot be paid online",
    });
    expect(mocks.createPaymobCheckout).not.toHaveBeenCalled();
  });

  it("reports Paymob errors", async () => {
    mocks.getOrderWithItems.mockResolvedValue(makeOrder());
    mocks.createPaymobCheckout.mockRejectedValue(new Error("bad phone"));

    expect(await payOrder(42)).toEqual({ success: false, error: "bad phone" });
  });
});

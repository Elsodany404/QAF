import { beforeEach, describe, expect, it, vi } from "vitest";

import { makeOrder } from "@/test/fixtures";

const mocks = vi.hoisted(() => ({
  createBostaDelivery: vi.fn(),
  getOrderWithItems: vi.fn(),
  sendOrderConfirmation: vi.fn(),
  createPaymobCheckout: vi.fn(),
}));

vi.mock("@/services/Bosta", () => ({
  createBostaDelivery: mocks.createBostaDelivery,
}));
vi.mock("@/services/Order", () => ({
  getOrderWithItems: mocks.getOrderWithItems,
}));
vi.mock("@/services/OrderEmails", () => ({
  sendOrderConfirmation: mocks.sendOrderConfirmation,
}));
vi.mock("@/services/Paymob", () => ({
  createPaymobCheckout: mocks.createPaymobCheckout,
}));

const { processOrderPayment } = await import("./processOrderPayment");

beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset();
  mocks.sendOrderConfirmation.mockResolvedValue(true);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("processOrderPayment", () => {
  it.each([0, -1, 1.5, Number.NaN])("rejects order ID %s", async (orderID) => {
    expect(await processOrderPayment(orderID, "cash_on_delivery")).toEqual({
      success: false,
      error: "Invalid order ID",
    });
    expect(mocks.createBostaDelivery).not.toHaveBeenCalled();
    expect(mocks.getOrderWithItems).not.toHaveBeenCalled();
  });

  describe("cash on delivery", () => {
    it("books the courier, emails the customer and confirms", async () => {
      mocks.createBostaDelivery.mockResolvedValue({ trackingNumber: "T1" });

      expect(await processOrderPayment(77, "cash_on_delivery")).toEqual({
        success: true,
        redirectUrl: "/en/order-success/77",
      });
      expect(mocks.createBostaDelivery).toHaveBeenCalledWith(77);
      expect(mocks.sendOrderConfirmation).toHaveBeenCalledWith(77, "en");
      expect(mocks.createPaymobCheckout).not.toHaveBeenCalled();
    });

    it("confirms an Arabic checkout in Arabic", async () => {
      mocks.createBostaDelivery.mockResolvedValue({ trackingNumber: "T1" });

      expect(await processOrderPayment(77, "cash_on_delivery", "ar")).toEqual({
        success: true,
        redirectUrl: "/order-success/77",
      });
      expect(mocks.sendOrderConfirmation).toHaveBeenCalledWith(77, "ar");
    });

    it("still confirms the saved order when Bosta is down", async () => {
      mocks.createBostaDelivery.mockRejectedValue(new Error("Bosta 503"));

      expect(await processOrderPayment(77, "cash_on_delivery")).toEqual({
        success: true,
        redirectUrl: "/en/order-success/77",
      });
      expect(mocks.sendOrderConfirmation).toHaveBeenCalledWith(77, "en");
    });
  });

  describe.each(["paymob_card", "mobile_wallet"] as const)("%s", (method) => {
    it("sends the customer to Paymob, without emailing or shipping yet", async () => {
      const order = makeOrder({ id: 77, paymentMethod: method });
      mocks.getOrderWithItems.mockResolvedValue(order);
      mocks.createPaymobCheckout.mockResolvedValue("https://pay.test/77");

      expect(await processOrderPayment(77, method)).toEqual({
        success: true,
        redirectUrl: "https://pay.test/77",
      });
      expect(mocks.createPaymobCheckout).toHaveBeenCalledWith(order, "en");
      // Both happen in the Paymob webhook once the payment succeeds.
      expect(mocks.sendOrderConfirmation).not.toHaveBeenCalled();
      expect(mocks.createBostaDelivery).not.toHaveBeenCalled();
    });

    it("says the order was saved when Paymob fails", async () => {
      mocks.getOrderWithItems.mockResolvedValue(makeOrder({ id: 77 }));
      mocks.createPaymobCheckout.mockRejectedValue(new Error("bad phone"));

      expect(await processOrderPayment(77, method)).toEqual({
        success: false,
        error:
          "Your order was saved but we couldn't start the payment. You can retry from your account page.",
      });
    });

    it("reports an order that disappeared", async () => {
      mocks.getOrderWithItems.mockResolvedValue(null);
      expect(await processOrderPayment(77, method)).toEqual({
        success: false,
        error: "Order not found",
      });
    });

    it("sends an Arabic checkout to Paymob in Arabic", async () => {
      const order = makeOrder({ id: 77, paymentMethod: method });
      mocks.getOrderWithItems.mockResolvedValue(order);
      mocks.createPaymobCheckout.mockRejectedValueOnce(new Error("bad phone"));

      expect(await processOrderPayment(77, method, "ar")).toEqual({
        success: false,
        error:
          "حفظنا طلبك لكن تعذّر بدء عملية الدفع. يمكنك إعادة المحاولة من صفحة حسابك.",
      });
      expect(mocks.createPaymobCheckout).toHaveBeenCalledWith(order, "ar");
    });
  });
});

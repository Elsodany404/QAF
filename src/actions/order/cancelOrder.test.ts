import { beforeEach, describe, expect, it, vi } from "vitest";

import { createFakeSupabase } from "@/test/fakeSupabase";
import { makeOrder } from "@/test/fixtures";

const mocks = vi.hoisted(() => ({
  fake: null as ReturnType<typeof createFakeSupabase> | null,
  headers: new Headers(),
  revalidatePath: vi.fn(),
  session: null as null | { user: { id: string; role: string } },
  terminateBostaDelivery: vi.fn(),
}));

vi.mock("@/supabase/admin", async () => {
  const { createFakeSupabase } = await import("@/test/fakeSupabase");
  mocks.fake = createFakeSupabase();
  return { default: mocks.fake.client };
});
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/headers", () => ({ headers: async () => mocks.headers }));
vi.mock("@/lib/adminAccess", () => ({
  getCurrentSession: async () => mocks.session,
}));
vi.mock("@/services/Bosta", () => ({
  terminateBostaDelivery: mocks.terminateBostaDelivery,
}));

const { cancelOrder } = await import("./cancelOrder");
const fake = () => mocks.fake!;
const customer = { user: { id: "user-1", role: "user" } };
const admin = { user: { id: "admin-1", role: "admin" } };

beforeEach(() => {
  fake().reset();
  mocks.session = customer;
  mocks.headers = new Headers();
  mocks.revalidatePath.mockReset();
  mocks.terminateBostaDelivery.mockReset();
});

describe("cancelOrder", () => {
  it("requires a signed-in user", async () => {
    mocks.session = null;
    expect(await cancelOrder(42)).toMatchObject({ success: false });
    expect(fake().queries).toHaveLength(0);
  });

  it("hides other customers' orders", async () => {
    fake().queue("Order", { data: makeOrder({ customer_ID: "someone-else" }) });
    expect(await cancelOrder(42)).toEqual({
      success: false,
      error: "Order not found",
    });
    expect(fake().updates("Order")).toHaveLength(0);
  });

  it("lets admins cancel any order", async () => {
    mocks.session = admin;
    fake().queue(
      "Order",
      { data: makeOrder({ customer_ID: "someone-else" }) },
      { data: { id: 42 } },
    );
    expect(await cancelOrder(42)).toMatchObject({ success: true });
  });

  it("refuses once the courier has the parcel", async () => {
    fake().queue("Order", { data: makeOrder({ shippingStatus: "shipped" }) });
    const result = await cancelOrder(42);
    expect(result.success).toBe(false);
    expect(mocks.terminateBostaDelivery).not.toHaveBeenCalled();
  });

  it("terminates the shipment of an unpaid order and cancels it", async () => {
    fake().queue(
      "Order",
      {
        data: makeOrder({
          shippingStatus: "ready_for_pickup",
          bostaTrackingNumber: "TRK1",
          paymentMethod: "cash_on_delivery",
        }),
      },
      { data: { id: 42 } },
    );

    const result = await cancelOrder(42);

    expect(mocks.terminateBostaDelivery).toHaveBeenCalledWith("TRK1");
    const [update] = fake().updates("Order");
    expect(update.payload).toEqual({ shippingStatus: "cancelled" });
    expect(update.filters).toContainEqual([
      "eq",
      "shippingStatus",
      "ready_for_pickup",
    ]);
    expect(result).toEqual({ success: true, data: "Order cancelled" });
    // The account page in both languages.
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/en/user");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/ar/user");
  });

  it("answers customers on the Arabic site in Arabic", async () => {
    mocks.headers = new Headers({ "x-locale": "ar" });
    fake().queue(
      "Order",
      { data: makeOrder({ shippingStatus: "shipped" }) },
      { data: makeOrder({ paymentMethod: "cash_on_delivery" }) },
      { data: { id: 42 } },
    );

    expect(await cancelOrder(42)).toEqual({
      success: false,
      error:
        "تم تسليم هذا الطلب لشركة الشحن ولم يعد من الممكن إلغاؤه. يُرجى مراسلتنا على واتساب.",
    });
    expect(await cancelOrder(42)).toEqual({
      success: true,
      data: "تم إلغاء الطلب",
    });
  });

  it("keeps the dashboard's messages in English", async () => {
    mocks.session = admin;
    mocks.headers = new Headers({ "x-locale": "ar" });
    mocks.terminateBostaDelivery.mockRejectedValue(new Error("Bosta 500"));
    fake().queue("Order", {
      data: makeOrder({
        shippingStatus: "ready_for_pickup",
        bostaTrackingNumber: "TRK1",
      }),
    });

    expect(await cancelOrder(42)).toEqual({
      success: false,
      error: "Could not cancel the Bosta shipment: Bosta 500",
    });
  });

  it("sends a customer who paid online to WhatsApp instead of cancelling", async () => {
    fake().queue("Order", {
      data: makeOrder({
        paymentStatus: "paid",
        paymobTransactionID: "tx-1",
        bostaTrackingNumber: "TRK1",
        shippingStatus: "ready_for_pickup",
      }),
    });

    expect(await cancelOrder(42)).toEqual({
      success: false,
      error:
        "You've paid for this order online, so please message us on WhatsApp to cancel it and arrange your refund.",
    });
    expect(mocks.terminateBostaDelivery).not.toHaveBeenCalled();
    expect(fake().updates("Order")).toHaveLength(0);
  });

  it("lets the shop cancel a paid order, and reminds it to refund by hand", async () => {
    mocks.session = admin;
    fake().queue(
      "Order",
      {
        data: makeOrder({
          customer_ID: "someone-else",
          paymentStatus: "paid",
          paymobTransactionID: "tx-1",
          bostaTrackingNumber: "TRK1",
          shippingStatus: "ready_for_pickup",
        }),
      },
      { data: { id: 42 } },
    );

    expect(await cancelOrder(42)).toEqual({
      success: true,
      data: "Order cancelled. It was paid online: refund the customer in your Paymob dashboard, then set its payment to Refunded.",
    });
    expect(mocks.terminateBostaDelivery).toHaveBeenCalledWith("TRK1");
    // Only the shipping status changes: the payment stays as it was.
    expect(fake().updates("Order").map((u) => u.payload)).toEqual([
      { shippingStatus: "cancelled" },
    ]);
  });

  it("keeps the order open if Bosta refuses to cancel the shipment", async () => {
    mocks.terminateBostaDelivery.mockRejectedValue(new Error("picked up"));
    fake().queue("Order", {
      data: makeOrder({
        shippingStatus: "ready_for_pickup",
        bostaTrackingNumber: "TRK1",
      }),
    });

    expect(await cancelOrder(42)).toMatchObject({ success: false });
    expect(fake().updates("Order")).toHaveLength(0);
  });

  it("reports a race when the status changed underneath us", async () => {
    fake().queue("Order", { data: makeOrder() }, { data: null });
    expect(await cancelOrder(42)).toMatchObject({
      success: false,
      error: expect.stringContaining("just changed"),
    });
  });

  it("cancels an unpaid online order for its customer", async () => {
    fake().queue("Order", { data: makeOrder() }, { data: { id: 42 } });
    expect(await cancelOrder(42)).toEqual({
      success: true,
      data: "Order cancelled",
    });
  });
});

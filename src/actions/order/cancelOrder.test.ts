import { beforeEach, describe, expect, it, vi } from "vitest";

import { createFakeSupabase } from "@/test/fakeSupabase";
import { makeOrder } from "@/test/fixtures";

const mocks = vi.hoisted(() => ({
  fake: null as ReturnType<typeof createFakeSupabase> | null,
  session: null as null | { user: { id: string; role: string } },
  terminateBostaDelivery: vi.fn(),
  refundPaymobOrder: vi.fn(),
}));

vi.mock("@/supabase/admin", async () => {
  const { createFakeSupabase } = await import("@/test/fakeSupabase");
  mocks.fake = createFakeSupabase();
  return { default: mocks.fake.client };
});
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/adminAccess", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/adminAccess")>()),
  getCurrentSession: async () => mocks.session,
}));
vi.mock("@/services/Bosta", () => ({
  terminateBostaDelivery: mocks.terminateBostaDelivery,
}));
vi.mock("@/services/Paymob", () => ({
  refundPaymobOrder: mocks.refundPaymobOrder,
}));

const { cancelOrder } = await import("./cancelOrder");
const fake = () => mocks.fake!;
const customer = { user: { id: "user-1", role: "user" } };

beforeEach(() => {
  fake().reset();
  mocks.session = customer;
  mocks.terminateBostaDelivery.mockReset();
  mocks.refundPaymobOrder.mockReset();
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
    mocks.session = { user: { id: "admin-1", role: "admin" } };
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

  it("terminates the shipment and refunds a paid card order", async () => {
    fake().queue(
      "Order",
      {
        data: makeOrder({
          shippingStatus: "ready_for_pickup",
          bostaTrackingNumber: "TRK1",
          paymentStatus: "paid",
          paymobTransactionID: "tx-1",
        }),
      },
      { data: { id: 42 } },
    );

    const result = await cancelOrder(42);

    expect(mocks.terminateBostaDelivery).toHaveBeenCalledWith("TRK1");
    expect(mocks.refundPaymobOrder).toHaveBeenCalledWith(42);
    const [update] = fake().updates("Order");
    expect(update.payload).toEqual({ shippingStatus: "cancelled" });
    expect(update.filters).toContainEqual([
      "eq",
      "shippingStatus",
      "ready_for_pickup",
    ]);
    expect(result).toEqual({
      success: true,
      data: "Order cancelled and your payment has been refunded",
    });
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

  it("still cancels, and says so, when the refund fails", async () => {
    mocks.refundPaymobOrder.mockRejectedValue(new Error("Paymob down"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    fake().queue(
      "Order",
      { data: makeOrder({ paymentStatus: "paid", paymobTransactionID: "tx" }) },
      { data: { id: 42 } },
    );

    expect(await cancelOrder(42)).toEqual({
      success: true,
      data: "Order cancelled. Your refund will be processed by our team shortly.",
    });
  });

  it("reports a race when the status changed underneath us", async () => {
    fake().queue("Order", { data: makeOrder() }, { data: null });
    expect(await cancelOrder(42)).toMatchObject({
      success: false,
      error: expect.stringContaining("just changed"),
    });
  });

  it("does not refund unpaid orders", async () => {
    fake().queue("Order", { data: makeOrder() }, { data: { id: 42 } });
    expect(await cancelOrder(42)).toEqual({
      success: true,
      data: "Order cancelled",
    });
    expect(mocks.refundPaymobOrder).not.toHaveBeenCalled();
  });
});

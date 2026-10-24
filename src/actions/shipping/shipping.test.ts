import { beforeEach, describe, expect, it, vi } from "vitest";

import { createFakeSupabase } from "@/test/fakeSupabase";

const mocks = vi.hoisted(() => ({
  fake: null as ReturnType<typeof createFakeSupabase> | null,
  isAdmin: true,
  createBostaDelivery: vi.fn(),
  terminateBostaDelivery: vi.fn(),
}));

vi.mock("@/supabase/admin", async () => {
  const { createFakeSupabase } = await import("@/test/fakeSupabase");
  mocks.fake = createFakeSupabase();
  return { default: mocks.fake.client };
});
vi.mock("@/lib/adminAccess", () => ({
  isAdminUser: async () => mocks.isAdmin,
}));
vi.mock("@/services/Bosta", () => ({
  createBostaDelivery: mocks.createBostaDelivery,
  terminateBostaDelivery: mocks.terminateBostaDelivery,
}));

const { createDelivery } = await import("./createDelivery");
const { cancelDelivery } = await import("./cancelDelivery");
const fake = () => mocks.fake!;

beforeEach(() => {
  fake().reset();
  mocks.isAdmin = true;
  mocks.createBostaDelivery.mockReset();
  mocks.terminateBostaDelivery.mockReset().mockResolvedValue(undefined);
});

describe("createDelivery", () => {
  it("is admin-only", async () => {
    mocks.isAdmin = false;
    expect(await createDelivery(42)).toMatchObject({ success: false });
    expect(mocks.createBostaDelivery).not.toHaveBeenCalled();
  });

  it("rejects invalid order IDs", async () => {
    expect(await createDelivery(0)).toEqual({
      success: false,
      error: "Invalid order ID",
    });
  });

  it("reports the tracking number", async () => {
    mocks.createBostaDelivery.mockResolvedValue({ trackingNumber: "987" });
    expect(await createDelivery(42)).toEqual({
      success: true,
      data: "Bosta delivery created (tracking 987)",
    });

    mocks.createBostaDelivery.mockResolvedValue({ trackingNumber: null });
    expect(await createDelivery(42)).toEqual({
      success: true,
      data: "Bosta delivery created",
    });
  });

  it("reports why Bosta refused", async () => {
    mocks.createBostaDelivery.mockRejectedValue(
      new Error("Order has not been paid yet"),
    );
    expect(await createDelivery(42)).toEqual({
      success: false,
      error: "Order has not been paid yet",
    });
  });
});

describe("cancelDelivery", () => {
  const order = (overrides = {}) => ({
    id: 42,
    shippingStatus: "ready_for_pickup",
    bostaTrackingNumber: "TRK1",
    ...overrides,
  });

  it("is admin-only", async () => {
    mocks.isAdmin = false;
    expect(await cancelDelivery(42)).toMatchObject({ success: false });
    expect(fake().queries).toHaveLength(0);
  });

  it("terminates the shipment and reopens the order for a new one", async () => {
    fake().queue("Order", { data: order() }, { data: null });

    expect(await cancelDelivery(42)).toEqual({
      success: true,
      data: "Bosta delivery cancelled",
    });
    expect(mocks.terminateBostaDelivery).toHaveBeenCalledWith("TRK1");
    expect(fake().updates("Order")[0].payload).toEqual({
      bostaOrderID: null,
      bostaTrackingNumber: null,
      bostaTrackingUrl: null,
      shippingStatus: "processing",
    });
  });

  it("needs a shipment to cancel", async () => {
    fake().queue("Order", { data: order({ bostaTrackingNumber: null }) });
    expect(await cancelDelivery(42)).toEqual({
      success: false,
      error: "Order has no Bosta delivery to cancel",
    });
  });

  it.each(["shipped", "out_for_delivery", "delivered"])(
    "refuses once the order is %s",
    async (shippingStatus) => {
      fake().queue("Order", { data: order({ shippingStatus }) });

      expect(await cancelDelivery(42)).toEqual({
        success: false,
        error: "The courier already picked this order up",
      });
      expect(mocks.terminateBostaDelivery).not.toHaveBeenCalled();
    },
  );

  it("keeps the shipment on the order when Bosta refuses", async () => {
    fake().queue("Order", { data: order() });
    mocks.terminateBostaDelivery.mockRejectedValue(
      new Error("Already picked up"),
    );

    expect(await cancelDelivery(42)).toEqual({
      success: false,
      error: "Already picked up",
    });
    expect(fake().updates("Order")).toHaveLength(0);
  });

  it("says so when Bosta cancelled but the order couldn't be updated", async () => {
    fake().queue("Order", { data: order() }, { error: { message: "timeout" } });

    expect(await cancelDelivery(42)).toMatchObject({
      success: false,
      error: expect.stringContaining("update it manually"),
    });
  });
});

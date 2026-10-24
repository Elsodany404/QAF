import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createFakeSupabase } from "@/test/fakeSupabase";

const mocks = vi.hoisted(() => ({
  fake: null as ReturnType<typeof createFakeSupabase> | null,
  isAdmin: true,
  getAllOrders: vi.fn(),
}));

vi.mock("@/supabase/admin", async () => {
  const { createFakeSupabase } = await import("@/test/fakeSupabase");
  mocks.fake = createFakeSupabase();
  return { default: mocks.fake.client };
});
vi.mock("@/lib/adminAccess", () => ({
  isAdminUser: async () => mocks.isAdmin,
}));
vi.mock("@/services/Order", () => ({ getAllOrders: mocks.getAllOrders }));

const { updateOrderStatus } = await import("./updateOrderStatus");
const { createPickup } = await import("./createPickup");
const { getAdminOrders } = await import("./getAdminOrders");
const fake = () => mocks.fake!;
const fetchMock = vi.fn();

beforeEach(() => {
  fake().reset();
  mocks.isAdmin = true;
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("getAdminOrders", () => {
  it("is admin-only", async () => {
    mocks.isAdmin = false;
    await expect(getAdminOrders()).rejects.toThrow("Not authorized");
    expect(mocks.getAllOrders).not.toHaveBeenCalled();
  });

  it("lists every order for admins", async () => {
    mocks.getAllOrders.mockResolvedValue([{ id: 1 }]);
    expect(await getAdminOrders()).toEqual([{ id: 1 }]);
  });
});

describe("updateOrderStatus", () => {
  it("is admin-only", async () => {
    mocks.isAdmin = false;
    expect(
      await updateOrderStatus(42, { paymentStatus: "paid" }),
    ).toMatchObject({ success: false });
    expect(fake().queries).toHaveLength(0);
  });

  it("updates only the statuses given", async () => {
    fake().queue("Order", { data: { id: 42 } }, { data: { id: 42 } });

    await updateOrderStatus(42, { paymentStatus: "paid" });
    await updateOrderStatus(42, { shippingStatus: "delivered" });

    expect(
      fake()
        .updates("Order")
        .map((u) => u.payload),
    ).toEqual([{ paymentStatus: "paid" }, { shippingStatus: "delivered" }]);
  });

  it.each([
    ["nothing to change", {}],
    ["an unknown shipping status", { shippingStatus: "lost_in_space" }],
    ["an unknown payment status", { paymentStatus: "maybe" }],
    // Refunds must go through Paymob, not a status change.
    ["a manual refund in progress", { paymentStatus: "refunding" }],
  ])("rejects %s", async (_, update) => {
    expect(await updateOrderStatus(42, update as never)).toEqual({
      success: false,
      error: "Invalid order status update",
    });
    expect(fake().queries).toHaveLength(0);
  });

  it("rejects invalid order IDs and a missing update", async () => {
    expect(
      await updateOrderStatus(-1, { paymentStatus: "paid" }),
    ).toMatchObject({ success: false });
    expect(await updateOrderStatus(42, undefined as never)).toMatchObject({
      success: false,
    });
  });

  it("reports unknown orders", async () => {
    fake().queue("Order", { data: null });
    expect(await updateOrderStatus(42, { paymentStatus: "paid" })).toEqual({
      success: false,
      error: "Order not found",
    });
  });
});

describe("createPickup", () => {
  function configure() {
    vi.stubEnv("BOSTA_PICKUP_CONTACT_NAME", "Mohamed");
    vi.stubEnv("BOSTA_PICKUP_CONTACT_PHONE", "01012345678");
    vi.stubEnv("BOSTA_PICKUP_CONTACT_EMAIL", "");
  }

  // 23:30 UTC on 1 Oct is already 2 Oct in Egypt.
  const LATE_EVENING_UTC = new Date("2026-10-01T23:30:00Z");

  it("is admin-only", async () => {
    mocks.isAdmin = false;
    expect(await createPickup()).toMatchObject({ status: "failed" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("needs the pickup contact", async () => {
    vi.stubEnv("BOSTA_PICKUP_CONTACT_NAME", "");
    expect(await createPickup()).toMatchObject({
      status: "failed",
      message: expect.stringContaining("BOSTA_PICKUP_CONTACT_NAME"),
    });
  });

  it("schedules today's pickup in Egypt for every parcel waiting", async () => {
    configure();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(LATE_EVENING_UTC);
    fake().queue("Order", { count: 3 });
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { _id: "pickup-1" } }),
    });

    expect(await createPickup()).toEqual({
      status: "success",
      message: "Pickup for 3 parcels scheduled for 02-10-2026",
      pickupID: "pickup-1",
    });
    expect(fake().queries[0].filters).toEqual([
      ["eq", "shippingStatus", "ready_for_pickup"],
    ]);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      businessLocationId: "loc-1",
      scheduledDate: "02-10-2026",
      contactPerson: { name: "Mohamed", phone: "01012345678" },
      numberOfParcels: 3,
      packageType: "Normal",
    });
  });

  it("says “parcel” for one", async () => {
    configure();
    fake().queue("Order", { count: 1 });
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, _id: "p" }),
    });

    expect(await createPickup("2099-01-31")).toMatchObject({
      message: "Pickup for 1 parcel scheduled for 31-01-2099",
    });
  });

  it.each(["2026-02-30", "31-01-2099", "tomorrow", ""])(
    "rejects the date %j",
    async (date) => {
      configure();
      expect(await createPickup(date)).toMatchObject({
        status: "failed",
        message: "Pickup date must be a real date in YYYY-MM-DD format",
      });
    },
  );

  it("rejects dates that are already over in Egypt", async () => {
    configure();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(LATE_EVENING_UTC);

    expect(await createPickup("2026-10-01")).toMatchObject({
      status: "failed",
      message: "Pickup date cannot be in the past",
    });
    expect(fake().queries).toHaveLength(0);
  });

  it("doesn't book a courier for nothing", async () => {
    configure();
    fake().queue("Order", { count: 0 });

    expect(await createPickup("2099-01-31")).toMatchObject({
      status: "failed",
      message: "No orders are waiting for the courier",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports Bosta's refusal", async () => {
    configure();
    fake().queue("Order", { count: 2 });
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ success: false, message: "No pickups on Friday" }),
    });

    expect(await createPickup("2099-01-31")).toMatchObject({
      status: "failed",
      message: "Failed to schedule pickup: No pickups on Friday",
    });
  });
});

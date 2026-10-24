import { beforeEach, describe, expect, it, vi } from "vitest";

import { createFakeSupabase } from "@/test/fakeSupabase";

const mocks = vi.hoisted(() => ({
  fake: null as ReturnType<typeof createFakeSupabase> | null,
  isAdmin: true,
  createBostaReturnPickup: vi.fn(),
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
  createBostaReturnPickup: mocks.createBostaReturnPickup,
}));

const { approveReturn } = await import("./approveReturn");
const { rejectReturn } = await import("./rejectReturn");
const fake = () => mocks.fake!;

beforeEach(() => {
  fake().reset();
  mocks.isAdmin = true;
  mocks.createBostaReturnPickup
    .mockReset()
    .mockResolvedValue({ trackingNumber: "555", refund: 924 });
});

describe("approveReturn", () => {
  it("is admin-only", async () => {
    mocks.isAdmin = false;
    expect(await approveReturn(42, 924)).toMatchObject({ success: false });
    expect(mocks.createBostaReturnPickup).not.toHaveBeenCalled();
  });

  it("books the Bosta pickup with the refund the admin entered", async () => {
    expect(await approveReturn(42, 924)).toEqual({
      success: true,
      data: "Return pickup booked (tracking 555). The courier will pay the customer 924 EGP.",
    });
    expect(mocks.createBostaReturnPickup).toHaveBeenCalledWith(42, 924);
  });

  it("works without a tracking number in Bosta's reply", async () => {
    mocks.createBostaReturnPickup.mockResolvedValue({
      trackingNumber: null,
      refund: 100,
    });
    expect(await approveReturn(42, 100)).toEqual({
      success: true,
      data: "Return pickup booked. The courier will pay the customer 100 EGP.",
    });
  });

  it.each([0, -5, Number.NaN, Infinity])(
    "asks for a refund instead of %s",
    async (refund) => {
      expect(await approveReturn(42, refund)).toEqual({
        success: false,
        error: "Enter the refund the courier pays the customer",
      });
      expect(mocks.createBostaReturnPickup).not.toHaveBeenCalled();
    },
  );

  it("rejects invalid order IDs", async () => {
    expect(await approveReturn(0, 100)).toEqual({
      success: false,
      error: "Invalid order ID",
    });
  });

  it("reports why Bosta or the order refused", async () => {
    mocks.createBostaReturnPickup.mockRejectedValue(
      new Error("The refund must be between 1 and 984 EGP"),
    );
    expect(await approveReturn(42, 5000)).toEqual({
      success: false,
      error: "The refund must be between 1 and 984 EGP",
    });
  });
});

describe("rejectReturn", () => {
  it("is admin-only", async () => {
    mocks.isAdmin = false;
    expect(await rejectReturn(42)).toMatchObject({ success: false });
    expect(fake().queries).toHaveLength(0);
  });

  it("declines a return no courier is on the way for", async () => {
    fake().queue("Order", { data: { id: 42 } });

    expect(await rejectReturn(42)).toEqual({
      success: true,
      data: "Return declined",
    });
    const [update] = fake().updates("Order");
    expect(update.payload).toEqual({ returnStatus: "rejected" });
    expect(update.filters).toContainEqual([
      "in",
      "returnStatus",
      ["requested", "pickup_failed"],
    ]);
  });

  it("refuses once a pickup is booked or done", async () => {
    fake().queue("Order", { data: null });
    expect(await rejectReturn(42)).toEqual({
      success: false,
      error: "This return can no longer be declined",
    });
  });

  it("rejects invalid order IDs", async () => {
    expect(await rejectReturn(-1)).toMatchObject({ success: false });
    expect(fake().queries).toHaveLength(0);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isAdmin: true,
  refundPaymobOrder: vi.fn(),
}));

vi.mock("@/lib/adminAccess", () => ({
  isAdminUser: async () => mocks.isAdmin,
}));
vi.mock("@/services/Paymob", () => ({
  refundPaymobOrder: mocks.refundPaymobOrder,
}));

const { createRefund } = await import("./createRefund");

beforeEach(() => {
  mocks.isAdmin = true;
  mocks.refundPaymobOrder.mockReset().mockResolvedValue(undefined);
});

describe("createRefund", () => {
  it("is admin-only", async () => {
    mocks.isAdmin = false;
    expect(await createRefund(42)).toMatchObject({ success: false });
    expect(mocks.refundPaymobOrder).not.toHaveBeenCalled();
  });

  it("refunds the whole order", async () => {
    expect(await createRefund(42)).toEqual({
      success: true,
      data: "Refund completed",
    });
    expect(mocks.refundPaymobOrder).toHaveBeenCalledWith(42);
  });

  it.each([0, -1, 2.5])("rejects order ID %s", async (orderID) => {
    expect(await createRefund(orderID)).toEqual({
      success: false,
      error: "A valid order ID is required",
    });
  });

  it("reports why Paymob or the order refused", async () => {
    mocks.refundPaymobOrder.mockRejectedValue(
      new Error("A refund is already in progress"),
    );
    expect(await createRefund(42)).toEqual({
      success: false,
      error: "A refund is already in progress",
    });
  });
});

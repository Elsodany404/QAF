import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ repriceCart: vi.fn() }));

vi.mock("@/actions/createOrder/buildServerCart", () => ({
  repriceCart: mocks.repriceCart,
}));

const { refreshCart } = await import("./refreshCart");

const line = { productID: 1, optionsIDs: [], valuesIDs: [], quantity: 1 };

beforeEach(() => {
  mocks.repriceCart.mockReset();
});

describe("refreshCart", () => {
  it("returns the server's line-by-line prices", async () => {
    mocks.repriceCart.mockResolvedValue([{ itemPrice: 462 }, null]);

    expect(await refreshCart([line, line])).toEqual([{ itemPrice: 462 }, null]);
    expect(mocks.repriceCart).toHaveBeenCalledWith([line, line]);
  });

  it("answers “keep the cart as it is” instead of throwing", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.repriceCart.mockRejectedValue(new Error("socket hang up"));

    expect(await refreshCart([line])).toBeNull();
  });
});

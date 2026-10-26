import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  session: null as null | { user: { id: string } },
  createOrder: vi.fn(),
  parseCreateOrderForm: vi.fn(),
  redirect: vi.fn((url: string) => {
    // Like Next.js: redirect() never returns.
    throw Object.assign(new Error("NEXT_REDIRECT"), { url });
  }),
}));

vi.mock("@/lib/adminAccess", () => ({
  getCurrentSession: vi.fn(async () => mocks.session),
}));
vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
  RedirectType: { push: "push", replace: "replace" },
}));
vi.mock("./createOrder", () => ({ createOrder: mocks.createOrder }));
vi.mock("./parseCreateOrderForm", () => ({
  parseCreateOrderForm: mocks.parseCreateOrderForm,
}));

const { default: placeOrder } = await import("./index");
const { getCurrentSession } = await import("@/lib/adminAccess");

const parsed = { success: true, data: { paymentMethod: "cash_on_delivery" } };

beforeEach(() => {
  mocks.session = { user: { id: "user-1" } };
  mocks.createOrder.mockReset();
  mocks.parseCreateOrderForm.mockReset().mockReturnValue(parsed);
  mocks.redirect.mockClear();
  vi.mocked(getCurrentSession).mockClear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("checkout action", () => {
  it("requires a signed-in customer", async () => {
    mocks.session = null;

    expect(await placeOrder(undefined, new FormData())).toEqual({
      success: false,
      error: "Please sign in to place your order",
    });
    expect(mocks.createOrder).not.toHaveBeenCalled();
  });

  it("returns form errors without creating anything", async () => {
    mocks.parseCreateOrderForm.mockReturnValue({
      success: false,
      error: "Invalid order form data",
    });

    expect(await placeOrder(undefined, new FormData())).toEqual({
      success: false,
      error: "Invalid order form data",
    });
    expect(mocks.createOrder).not.toHaveBeenCalled();
  });

  it("orders for the signed-in customer, never one named in the form", async () => {
    mocks.createOrder.mockResolvedValue({ success: true, redirectUrl: "/x" });
    const form = new FormData();
    form.append("customerID", "someone-else");

    await placeOrder(undefined, form).catch(() => {});

    expect(mocks.createOrder).toHaveBeenCalledWith({
      customerID: "user-1",
      input: parsed.data,
    });
  });

  it("passes failures on, including the price-changed code", async () => {
    mocks.createOrder.mockResolvedValue({
      success: false,
      error: "Prices changed",
      code: "price_changed",
    });

    expect(await placeOrder(undefined, new FormData())).toEqual({
      success: false,
      error: "Prices changed",
      code: "price_changed",
    });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it.each([
    "https://accept.paymob.com/unifiedcheckout/?x=1",
    "/order-success/77",
  ])("replaces the checkout in the history with %s", async (redirectUrl) => {
    mocks.createOrder.mockResolvedValue({ success: true, redirectUrl });

    await expect(placeOrder(undefined, new FormData())).rejects.toThrow(
      "NEXT_REDIRECT",
    );
    // Back from the confirmation must not reopen a placed checkout.
    expect(mocks.redirect).toHaveBeenCalledWith(redirectUrl, "replace");
  });
});

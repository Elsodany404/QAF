import { beforeEach, describe, expect, it, vi } from "vitest";

import { createFakeSupabase } from "@/test/fakeSupabase";
import { makeOrder } from "@/test/fixtures";

const mocks = vi.hoisted(() => ({
  fake: null as ReturnType<typeof createFakeSupabase> | null,
  session: null as null | { user: { id: string; role?: string } },
  sendEmail: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/supabase/admin", async () => {
  const { createFakeSupabase } = await import("@/test/fakeSupabase");
  mocks.fake = createFakeSupabase();
  return { default: mocks.fake.client };
});
vi.mock("@/lib/adminAccess", () => ({
  getCurrentSession: async () => mocks.session,
}));
vi.mock("@/lib/email", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/email")>()),
  sendEmail: mocks.sendEmail,
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

const { requestReturn } = await import("./requestReturn");
const { SHOP_EMAIL } = await import("@/lib/email");
const fake = () => mocks.fake!;

const delivered = (overrides = {}) =>
  makeOrder({
    paymentMethod: "cash_on_delivery",
    paymentStatus: "paid",
    shippingStatus: "delivered",
    ...overrides,
  });
const reason = "The bag arrived torn";

beforeEach(() => {
  fake().reset();
  mocks.session = { user: { id: "user-1" } };
  mocks.sendEmail.mockReset().mockResolvedValue(true);
  mocks.revalidatePath.mockReset();
});

describe("requestReturn", () => {
  it("records the request and tells the shop", async () => {
    fake().queue("Order", { data: delivered() }, { data: { id: 42 } });

    expect(await requestReturn(42, `  ${reason}  `)).toEqual({
      success: true,
      data: "Return requested. We'll review it and let you know.",
    });

    const [update] = fake().updates("Order");
    expect(update.payload).toEqual({
      returnStatus: "requested",
      returnReason: reason,
      returnRequestedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
    });
    // Only while it's still delivered and has no return yet.
    expect(update.filters).toEqual(
      expect.arrayContaining([
        ["eq", "id", 42],
        ["eq", "shippingStatus", "delivered"],
        ["is", "returnStatus", null],
      ]),
    );
    expect(mocks.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: SHOP_EMAIL,
        replyTo: "sara@example.com",
        subject: "[Return request] Order #00042",
        text: expect.stringContaining(`Reason: ${reason}`),
      }),
    );
    expect(mocks.sendEmail.mock.calls[0][0].text).toContain(
      "https://shop.test/admin/dashboard",
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/user");
  });

  it("still saves the request when the shop email fails", async () => {
    fake().queue("Order", { data: delivered() }, { data: { id: 42 } });
    mocks.sendEmail.mockResolvedValue(false);

    expect(await requestReturn(42, reason)).toMatchObject({ success: true });
  });

  it("requires a signed-in customer", async () => {
    mocks.session = null;
    expect(await requestReturn(42, reason)).toMatchObject({ success: false });
    expect(fake().queries).toHaveLength(0);
  });

  it.each(["", "    ", "torn", "x".repeat(501)])(
    "asks for a reason of 5 to 500 characters, not %j",
    async (badReason) => {
      expect(await requestReturn(42, badReason)).toMatchObject({
        success: false,
        error: expect.stringContaining("5 to 500 characters"),
      });
      expect(fake().queries).toHaveLength(0);
    },
  );

  it("rejects a reason that isn't text", async () => {
    expect(await requestReturn(42, 42 as never)).toMatchObject({
      success: false,
    });
    expect(fake().queries).toHaveLength(0);
  });

  it.each([0, -1, 1.5])("rejects order ID %s", async (orderID) => {
    expect(await requestReturn(orderID, reason)).toEqual({
      success: false,
      error: "Invalid order",
    });
  });

  it("hides other customers' orders, even from admins", async () => {
    mocks.session = { user: { id: "admin-1", role: "admin" } };
    fake().queue("Order", { data: delivered() });

    expect(await requestReturn(42, reason)).toEqual({
      success: false,
      error: "Order not found",
    });
    expect(fake().updates("Order")).toHaveLength(0);
  });

  it.each([
    ["an order that isn't delivered yet", { shippingStatus: "shipped" }],
    ["a cancelled order", { shippingStatus: "cancelled" }],
    ["a second request", { returnStatus: "requested" }],
    ["a declined return", { returnStatus: "rejected" }],
    ["a finished return", { returnStatus: "returned" }],
  ])("refuses %s", async (_, overrides) => {
    fake().queue("Order", { data: delivered(overrides) });

    expect(await requestReturn(42, reason)).toEqual({
      success: false,
      error: "Only a delivered order can be returned, and only once",
    });
    expect(fake().updates("Order")).toHaveLength(0);
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("doesn't email when another tab got there first", async () => {
    fake().queue("Order", { data: delivered() }, { data: null });

    expect(await requestReturn(42, reason)).toMatchObject({
      success: false,
      error: expect.stringContaining("just changed"),
    });
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

import { DELIVERY_CITIES } from "@/lib/bostaLocations";
import { createFakeSupabase } from "@/test/fakeSupabase";
import { makeOrder } from "@/test/fixtures";
import type { AdminCreateOrderPayload } from "./createManualOrder";

const mocks = vi.hoisted(() => ({
  fake: null as ReturnType<typeof createFakeSupabase> | null,
  isAdmin: true,
  getBostaFees: vi.fn(),
  createBostaDelivery: vi.fn(),
  sendOrderConfirmation: vi.fn(),
  createPaymobCheckout: vi.fn(),
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
  MAX_COD_AMOUNT: 30000,
  getBostaFees: mocks.getBostaFees,
  createBostaDelivery: mocks.createBostaDelivery,
}));
vi.mock("@/services/OrderEmails", () => ({
  sendOrderConfirmation: mocks.sendOrderConfirmation,
}));
vi.mock("@/services/Paymob", () => ({
  createPaymobCheckout: mocks.createPaymobCheckout,
}));

const { adminCreateOrder } = await import("./createManualOrder");
const fake = () => mocks.fake!;

const city = DELIVERY_CITIES[0];
const district = city.districts[0];

// Product row as returned by the nested Supabase select.
function productRow({
  price = 200,
  largeInStock = true,
}: { price?: number; largeInStock?: boolean } = {}) {
  return {
    id: 1,
    name: "House Blend",
    description: "",
    category: "espresso",
    price,
    imageUrl: "",
    "blurred-image": "",
    featured: false,
    inStock: true,
    ProductOptions: [
      {
        optionID: {
          id: 100,
          name: "Size",
          description: "",
          icon: "",
          OptionValues: [
            {
              id: 10,
              optionID: 100,
              label: "250g",
              priceModifier: 0,
              default: true,
              inStock: true,
            },
            {
              id: 11,
              optionID: 100,
              label: "500g",
              priceModifier: 0.8,
              default: false,
              inStock: largeInStock,
            },
          ],
        },
      },
    ],
  };
}

function payload(
  overrides: Partial<AdminCreateOrderPayload> = {},
): AdminCreateOrderPayload {
  return {
    customerName: " Sara Ahmed ",
    customerEmail: "Sara@Example.com",
    customerPhone: "010 1234 5678",
    cityID: city.cityId,
    districtID: district.districtId,
    street: "9 Road",
    apartment: "4",
    paymentMethod: "cash_on_delivery",
    shippingFees: null,
    items: [{ productID: 1, optionsIDs: [100], valuesIDs: [11], quantity: 2 }],
    ...overrides,
  };
}

beforeEach(() => {
  fake().reset();
  mocks.isAdmin = true;
  mocks.getBostaFees.mockReset().mockResolvedValue(85);
  mocks.createBostaDelivery.mockReset().mockResolvedValue({ trackingNumber: "T1" });
  mocks.sendOrderConfirmation.mockReset().mockResolvedValue(true);
  mocks.createPaymobCheckout.mockReset();
});

describe("adminCreateOrder", () => {
  it("is admin-only", async () => {
    mocks.isAdmin = false;
    expect(await adminCreateOrder(payload())).toMatchObject({
      status: "failed",
    });
    expect(fake().queries).toHaveLength(0);
  });

  it("prices the chosen options on the server and charges Bosta's fee", async () => {
    fake().queue("Product", { data: [productRow()] });
    fake().queue("user", { data: { id: "user-9" } });
    fake().queue("create_order", { data: 77 });

    const result = await adminCreateOrder(payload());

    expect(result).toEqual({ status: "success", orderID: 77 });
    // 200 × 1.8 = 360 per bag, × 2
    expect(mocks.getBostaFees).toHaveBeenCalledWith(city.cityName, 720);
    const rpc = fake().queries.find((q) => q.operation === "rpc");
    expect(rpc?.payload).toMatchObject({
      p_customer_id: "user-9",
      p_customer_name: "Sara Ahmed",
      p_customer_phone: "01012345678",
      p_city: city.cityName,
      p_subtotal: 720,
      p_shipping_fees: 85,
      p_payment_method: "cash_on_delivery",
      p_items: [
        {
          productID: 1,
          quantity: 2,
          totalPrice: 720,
          options: [expect.objectContaining({ id: 11, label: "500g" })],
        },
      ],
    });
    // Account emails are stored lowercased.
    const userQuery = fake().queries.find((q) => q.table === "user");
    expect(userQuery?.filters).toContainEqual(["eq", "email", "sara@example.com"]);
    expect(mocks.createBostaDelivery).toHaveBeenCalledWith(77);
    expect(mocks.sendOrderConfirmation).toHaveBeenCalledWith(77);
  });

  it("uses the admin's shipping fee instead of Bosta's and returns a payment link", async () => {
    fake().queue("Product", { data: [productRow()] });
    fake().queue("user", { data: { id: "user-9" } });
    fake().queue("create_order", { data: 77 });
    fake().queue("Order", { data: makeOrder({ id: 77 }) });
    mocks.createPaymobCheckout.mockResolvedValue("https://pay.test/77");

    const result = await adminCreateOrder(
      payload({ paymentMethod: "paymob_card", shippingFees: 0 }),
    );

    expect(result).toEqual({
      status: "success",
      orderID: 77,
      paymentUrl: "https://pay.test/77",
    });
    expect(mocks.getBostaFees).not.toHaveBeenCalled();
    const rpc = fake().queries.find((q) => q.operation === "rpc");
    expect(rpc?.payload).toMatchObject({ p_shipping_fees: 0 });
    expect(mocks.createBostaDelivery).not.toHaveBeenCalled();
  });

  it("refuses sold-out option values", async () => {
    fake().queue("Product", { data: [productRow({ largeInStock: false })] });

    const result = await adminCreateOrder(payload());

    expect(result).toMatchObject({ status: "failed" });
    expect(fake().queries.some((q) => q.operation === "rpc")).toBe(false);
  });

  it("needs an existing customer account", async () => {
    fake().queue("Product", { data: [productRow()] });
    fake().queue("user", { data: null });

    const result = await adminCreateOrder(payload());

    expect(result).toMatchObject({
      status: "failed",
      message: expect.stringContaining("No account uses that email"),
    });
    expect(fake().queries.some((q) => q.operation === "rpc")).toBe(false);
  });

  it("keeps cash on delivery under Bosta's limit", async () => {
    fake().queue("Product", { data: [productRow({ price: 1000 })] });
    fake().queue("user", { data: { id: "user-9" } });

    const result = await adminCreateOrder(
      payload({
        shippingFees: 100,
        items: [
          { productID: 1, optionsIDs: [100], valuesIDs: [10], quantity: 40 },
        ],
      }),
    );

    expect(result).toMatchObject({
      status: "failed",
      message: expect.stringContaining("30000"),
    });
  });

  it("rejects a district outside the chosen city", async () => {
    const result = await adminCreateOrder(
      payload({ districtID: "not-a-district" }),
    );
    expect(result).toEqual({
      status: "failed",
      message: "Bosta doesn't deliver there",
    });
    expect(fake().queries).toHaveLength(0);
  });
});

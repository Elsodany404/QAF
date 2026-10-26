import { beforeEach, describe, expect, it, vi } from "vitest";

import { createFakeSupabase } from "@/test/fakeSupabase";
import { makeOptionValue, makeProduct } from "@/test/fixtures";
import type { orderPayloadT } from "@/types/customTypes";

const mocks = vi.hoisted(() => ({
  fake: null as ReturnType<typeof createFakeSupabase> | null,
}));

vi.mock("@/supabase/admin", async () => {
  const { createFakeSupabase } = await import("@/test/fakeSupabase");
  mocks.fake = createFakeSupabase();
  return { default: mocks.fake.client };
});

const { getOrderWithItems, getOrdersByCustomerID, postOrder } =
  await import("./Order");
const fake = () => mocks.fake!;

function payload(overrides: Partial<orderPayloadT> = {}): orderPayloadT {
  return {
    customerID: "user-1",
    customerName: "Sara Ahmed",
    customerEmail: "sara@example.com",
    customerPhone: "01012345678",
    city: "Cairo",
    cityID: "c1",
    district: "Maadi",
    districtID: "d1",
    street: "9 Road",
    apartment: "4",
    paymentMethod: "cash_on_delivery",
    shippingFees: 60,
    cart: [
      {
        itemID: "4:15:23",
        product: makeProduct({ id: 4, name: "Espresso" }),
        options: [
          makeOptionValue({
            id: 15,
            optionID: 5,
            label: "100% Arabica",
            priceModifier: 0.4,
            default: false,
          }),
          makeOptionValue({
            id: 23,
            optionID: 1,
            label: "500g",
            priceModifier: 1,
          }),
        ],
        quantity: 2,
        itemPrice: 462,
      },
      {
        itemID: "1:10",
        product: makeProduct({ id: 1, name: "House Blend" }),
        options: [makeOptionValue()],
        quantity: 3,
        itemPrice: 200,
      },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  fake().reset();
});

describe("postOrder", () => {
  it("saves line totals and the subtotal the customer was charged", async () => {
    fake().queue("create_order", { data: 77 });

    expect(await postOrder(payload())).toBe(77);

    const [rpc] = fake().queries;
    expect(rpc.table).toBe("create_order");
    expect(rpc.payload).toEqual({
      p_customer_id: "user-1",
      p_customer_name: "Sara Ahmed",
      p_customer_email: "sara@example.com",
      p_customer_phone: "01012345678",
      p_apartment: "4",
      p_street: "9 Road",
      p_city: "Cairo",
      p_cityid: "c1",
      p_district: "Maadi",
      p_districtid: "d1",
      // 2 × 462 + 3 × 200
      p_subtotal: 1524,
      p_shipping_fees: 60,
      p_payment_method: "cash_on_delivery",
      p_items: [
        {
          productID: 4,
          productName: "Espresso",
          quantity: 2,
          totalPrice: 924,
          // Only what the order history needs from each chosen value.
          options: [
            { id: 15, optionID: 5, label: "100% Arabica", priceModifier: 0.4 },
            { id: 23, optionID: 1, label: "500g", priceModifier: 1 },
          ],
        },
        {
          productID: 1,
          productName: "House Blend",
          quantity: 3,
          totalPrice: 600,
          options: [{ id: 10, optionID: 100, label: "250g", priceModifier: 0 }],
        },
      ],
    });
  });

  it("throws database errors and missing IDs", async () => {
    fake().queue("create_order", { error: { message: "violates check" } });
    await expect(postOrder(payload())).rejects.toMatchObject({
      message: "violates check",
    });

    fake().queue("create_order", { data: null });
    await expect(postOrder(payload())).rejects.toThrow(
      "Failed to create order",
    );
  });
});

describe("order queries", () => {
  it("loads one order with its items", async () => {
    fake().queue("Order", { data: { id: 7 } });

    expect(await getOrderWithItems(7)).toEqual({ id: 7 });
    expect(fake().queries[0].filters).toEqual([["eq", "id", 7]]);
  });

  it("returns null for an unknown order and throws on errors", async () => {
    fake().queue("Order", { data: null }, { error: { message: "down" } });

    expect(await getOrderWithItems(7)).toBeNull();
    await expect(getOrderWithItems(7)).rejects.toThrow("down");
  });

  it("only lists the customer's own orders", async () => {
    fake().queue("Order", { data: [{ id: 1 }] }, { data: null });

    expect(await getOrdersByCustomerID("user-1")).toEqual([{ id: 1 }]);
    expect(fake().queries[0].filters).toEqual([
      ["eq", "customer_ID", "user-1"],
    ]);
    expect(await getOrdersByCustomerID("user-2")).toEqual([]);
  });
});

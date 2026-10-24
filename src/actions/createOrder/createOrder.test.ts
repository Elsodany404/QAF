import { beforeEach, describe, expect, it, vi } from "vitest";

import { createFakeSupabase } from "@/test/fakeSupabase";
import type { CreateOrderInput } from "./parseCreateOrderForm";

const mocks = vi.hoisted(() => ({
  fake: null as ReturnType<typeof createFakeSupabase> | null,
  getBostaFees: vi.fn(),
  postOrder: vi.fn(),
  processOrderPayment: vi.fn(),
}));

vi.mock("@/supabase/admin", async () => {
  const { createFakeSupabase } = await import("@/test/fakeSupabase");
  mocks.fake = createFakeSupabase();
  return { default: mocks.fake.client };
});
vi.mock("@/services/Bosta", () => ({
  MAX_COD_AMOUNT: 30000,
  getBostaFees: mocks.getBostaFees,
}));
vi.mock("@/services/Order", () => ({ postOrder: mocks.postOrder }));
vi.mock("./processOrderPayment", () => ({
  processOrderPayment: mocks.processOrderPayment,
}));

const { createOrder } = await import("./createOrder");
const { calculateCartTotal } = await import("./calculateCartTotal");
const fake = () => mocks.fake!;

// The live Espresso product: 165 EGP, 100% Arabica +40%, 500g +100%.
const espressoRow = (price = 165) => ({
  id: 4,
  name: "Espresso",
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
        id: 5,
        name: "Percentage of Arabica",
        description: "",
        icon: "",
        OptionValues: [
          {
            id: 13,
            optionID: 5,
            label: "70% Arabica",
            priceModifier: 0,
            default: true,
            inStock: true,
          },
          {
            id: 15,
            optionID: 5,
            label: "100% Arabica",
            priceModifier: 0.4,
            default: false,
            inStock: true,
          },
        ],
      },
    },
    {
      optionID: {
        id: 1,
        name: "Size",
        description: "",
        icon: "",
        OptionValues: [
          {
            id: 22,
            optionID: 1,
            label: "250g",
            priceModifier: 0,
            default: true,
            inStock: true,
          },
          {
            id: 23,
            optionID: 1,
            label: "500g",
            priceModifier: 1,
            default: false,
            inStock: true,
          },
        ],
      },
    },
  ],
});

function input(overrides: Partial<CreateOrderInput> = {}): CreateOrderInput {
  return {
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
    // 500g of 100% Arabica, twice: 462 × 2 = 924
    secureCart: [
      { productID: 4, optionsIDs: [5, 1], valuesIDs: [15, 23], quantity: 2 },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  fake().reset();
  mocks.getBostaFees.mockReset().mockResolvedValue(60);
  mocks.postOrder.mockReset().mockResolvedValue(77);
  mocks.processOrderPayment
    .mockReset()
    .mockResolvedValue({ success: true, redirectUrl: "/order-success/77" });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("createOrder", () => {
  it("saves the server-priced cart and starts payment", async () => {
    fake().queue("Product", { data: [espressoRow()] });

    const result = await createOrder({ customerID: "user-1", input: input() });

    expect(result).toEqual({ success: true, redirectUrl: "/order-success/77" });
    const [payload] = mocks.postOrder.mock.calls[0];
    expect(payload).toMatchObject({
      customerID: "user-1",
      customerName: "Sara Ahmed",
      customerPhone: "01012345678",
      city: "Cairo",
      cityID: "c1",
      district: "Maadi",
      districtID: "d1",
      paymentMethod: "cash_on_delivery",
      shippingFees: 60,
    });
    expect(payload.cart).toHaveLength(1);
    expect(payload.cart[0]).toMatchObject({ itemPrice: 462, quantity: 2 });
    // Only the fields the order needs, nothing from the browser's input.
    expect(payload).not.toHaveProperty("secureCart");
    expect(payload).not.toHaveProperty("expectedTotal");
    expect(mocks.processOrderPayment).toHaveBeenCalledWith(
      77,
      "cash_on_delivery",
    );
  });

  it("prices cash-on-delivery shipping on the amount the courier collects", async () => {
    fake().queue("Product", { data: [espressoRow()] });
    await createOrder({ customerID: "user-1", input: input() });
    expect(mocks.getBostaFees).toHaveBeenCalledWith("Cairo", 924);
  });

  it("prices prepaid shipping without a cash amount", async () => {
    fake().queue("Product", { data: [espressoRow()] });
    await createOrder({
      customerID: "user-1",
      input: input({ paymentMethod: "paymob_card" }),
    });
    expect(mocks.getBostaFees).toHaveBeenCalledWith("Cairo", 0);
  });

  it("passes cart problems on without quoting shipping or saving", async () => {
    fake().queue("Product", { data: [{ ...espressoRow(), inStock: false }] });

    const result = await createOrder({ customerID: "user-1", input: input() });

    expect(result).toEqual({
      success: false,
      error: "Product Espresso is out of stock",
    });
    expect(mocks.getBostaFees).not.toHaveBeenCalled();
    expect(mocks.postOrder).not.toHaveBeenCalled();
  });

  it("doesn't save the order when shipping can't be priced", async () => {
    fake().queue("Product", { data: [espressoRow()] });
    mocks.getBostaFees.mockRejectedValue(new Error("Bosta down"));

    expect(await createOrder({ customerID: "user-1", input: input() })).toEqual(
      { success: false, error: "Failed to calculate shipping fees" },
    );
    expect(mocks.postOrder).not.toHaveBeenCalled();
  });

  it.each([Number.NaN, -5, Infinity])(
    "refuses a nonsensical shipping fee (%s)",
    async (fee) => {
      fake().queue("Product", { data: [espressoRow()] });
      mocks.getBostaFees.mockResolvedValue(fee);

      expect(
        await createOrder({ customerID: "user-1", input: input() }),
      ).toEqual({ success: false, error: "Invalid shipping fee" });
      expect(mocks.postOrder).not.toHaveBeenCalled();
    },
  );

  describe("cash on delivery limit", () => {
    // 30 × 2000 EGP = 60,000: more than Bosta can collect.
    const bigOrder = (paymentMethod: CreateOrderInput["paymentMethod"]) =>
      input({
        paymentMethod,
        secureCart: [
          {
            productID: 4,
            optionsIDs: [5, 1],
            valuesIDs: [13, 22],
            quantity: 30,
          },
        ],
      });

    it("refuses cash orders the courier couldn't collect", async () => {
      fake().queue("Product", { data: [espressoRow(2000)] });

      const result = await createOrder({
        customerID: "user-1",
        input: bigOrder("cash_on_delivery"),
      });

      expect(result).toMatchObject({
        success: false,
        error: expect.stringContaining("30000 EGP"),
      });
      expect(mocks.postOrder).not.toHaveBeenCalled();
    });

    it("counts shipping towards the limit", async () => {
      // 29,990 + 60 shipping = 30,050
      fake().queue("Product", { data: [{ ...espressoRow(29990) }] });

      const result = await createOrder({
        customerID: "user-1",
        input: input({
          secureCart: [
            {
              productID: 4,
              optionsIDs: [5, 1],
              valuesIDs: [13, 22],
              quantity: 1,
            },
          ],
        }),
      });

      expect(result.success).toBe(false);
    });

    it("lets the same order be paid online", async () => {
      fake().queue("Product", { data: [espressoRow(2000)] });

      const result = await createOrder({
        customerID: "user-1",
        input: bigOrder("paymob_card"),
      });

      expect(result.success).toBe(true);
    });
  });

  describe("the total the customer was shown", () => {
    it("refuses to charge more than the customer saw", async () => {
      // A cart saved before the pricing fix showed 2 × 396 + 60 = 852;
      // today it costs 2 × 462 + 60 = 984.
      fake().queue("Product", { data: [espressoRow()] });

      const result = await createOrder({
        customerID: "user-1",
        input: input({ expectedTotal: 852 }),
      });

      expect(result).toMatchObject({ success: false, code: "price_changed" });
      expect(mocks.postOrder).not.toHaveBeenCalled();
    });

    it("refuses a lower total too, e.g. after shipping got cheaper", async () => {
      fake().queue("Product", { data: [espressoRow()] });
      mocks.getBostaFees.mockResolvedValue(45);

      const result = await createOrder({
        customerID: "user-1",
        input: input({ expectedTotal: 984 }),
      });

      expect(result).toMatchObject({ code: "price_changed" });
    });

    it("places the order when the totals match", async () => {
      fake().queue("Product", { data: [espressoRow()] });
      expect(
        await createOrder({
          customerID: "user-1",
          input: input({ expectedTotal: 984 }),
        }),
      ).toMatchObject({ success: true });
    });

    it("ignores floating-point noise in the total", async () => {
      fake().queue("Product", { data: [espressoRow()] });
      mocks.getBostaFees.mockResolvedValue(52.3);

      expect(
        await createOrder({
          customerID: "user-1",
          input: input({ expectedTotal: 924 + 52.3 + 1e-9 }),
        }),
      ).toMatchObject({ success: true });
    });

    it("still works for checkout pages that don't send it", async () => {
      fake().queue("Product", { data: [espressoRow()] });
      expect(
        await createOrder({ customerID: "user-1", input: input() }),
      ).toMatchObject({ success: true });
    });
  });

  it("hides database errors from the customer", async () => {
    fake().queue("Product", { data: [espressoRow()] });
    mocks.postOrder.mockRejectedValue({
      message: "insert failed",
      code: "23505",
    });

    expect(await createOrder({ customerID: "user-1", input: input() })).toEqual(
      { success: false, error: "Unexpected error happened" },
    );
    expect(console.error).toHaveBeenCalledWith("createOrder failed:", {
      message: "insert failed",
      code: "23505",
    });
    expect(mocks.processOrderPayment).not.toHaveBeenCalled();
  });

  it("returns the payment step's failure as is", async () => {
    fake().queue("Product", { data: [espressoRow()] });
    mocks.processOrderPayment.mockResolvedValue({
      success: false,
      error: "Your order was saved but we couldn't start the payment.",
    });

    expect(
      await createOrder({
        customerID: "user-1",
        input: input({ paymentMethod: "mobile_wallet" }),
      }),
    ).toEqual({
      success: false,
      error: "Your order was saved but we couldn't start the payment.",
    });
  });
});

describe("calculateCartTotal", () => {
  it("multiplies each unit price by its quantity", () => {
    expect(
      calculateCartTotal([
        { itemPrice: 462, quantity: 2 },
        { itemPrice: 33, quantity: 3 },
      ] as never),
    ).toBe(1023);
    expect(calculateCartTotal([])).toBe(0);
  });
});

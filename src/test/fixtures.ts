import type { OrderQuery } from "@/types/customTypes";
import type { OptionValue, Product } from "@/types/db";

export function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    name: "House Blend",
    description: "Smooth and chocolatey",
    category: "espresso",
    price: 200,
    imageUrl: "https://img.test/p.jpg",
    "blurred-image": "https://img.test/p-blur.jpg",
    featured: false,
    inStock: true,
    ...overrides,
  };
}

export function makeOptionValue(
  overrides: Partial<OptionValue> = {},
): OptionValue {
  return {
    id: 10,
    optionID: 100,
    label: "250g",
    priceModifier: 0,
    default: true,
    inStock: true,
    ...overrides,
  };
}

export function makeOrder(overrides: Partial<OrderQuery> = {}): OrderQuery {
  return {
    id: 42,
    created_at: "2026-10-01T10:00:00Z",
    customer_ID: "user-1",
    customerName: "Sara Ahmed",
    customerEmail: "sara@example.com",
    customerPhone: "01000000000",
    city: "Cairo",
    cityID: "c1",
    district: "Maadi",
    districtID: "d1",
    street: "9 Road",
    apartment: "4",
    paymentMethod: "paymob_card",
    paymentStatus: "pending",
    shippingStatus: "processing",
    subTotal: 400,
    shippingFees: 60,
    totalPrice: 460,
    bostaOrderID: null,
    bostaTrackingNumber: null,
    bostaTrackingUrl: null,
    paymobOrderID: null,
    paymobTransactionID: null,
    returnStatus: null,
    returnReason: null,
    returnRequestedAt: null,
    refundAmount: null,
    bostaReturnID: null,
    bostaReturnTrackingNumber: null,
    orderItems: [
      {
        id: 1,
        createdAt: "2026-10-01T10:00:00Z",
        orderID: 42,
        productID: 1,
        productName: "House Blend",
        quantity: 2,
        totalPrice: 400,
        options: [{ id: 10, optionID: 100, label: "250g", priceModifier: 0 }],
        product: makeProduct(),
      },
    ],
    ...overrides,
  };
}

import type { Option, OptionValue, Order, OrderItem, OrderStatus, Product } from "./db";

export type OptionWithValue = Option & {
  OptionValues: OptionValue[];
};

export type ProductWithOptions = Product & {
  ProductOptions: {
    optionID: OptionWithValue;
  }[];
};
export const CATEGORIES = [
  { id: "all", label: "All Coffee" },
  { id: "turkish", label: "Turkish Coffee" },
  { id: "espresso", label: "Espresso" },
  { id: "flavored", label: "Flavored Coffee" },
  { id: "arabian & green blends", label: "Arabian & Green Blends" },
];

export type Item = {
  itemID: string;
  options: OptionValue[];
  product: Product;
  quantity: number;
  itemPrice: number;
};
export type PaymentMethod = "paymob_card" | "vodafone_cash" | "cash_on_delivery";

export type AdminOrder = Order & {
  paymentMethod?: PaymentMethod | null;
  paymentStatus?: string | null;
  shippingStatus?: string | null;
  OrderItem?: OrderItem[];
  bostaOrderID?: string | null;
  bostaTrackingNumber?: string | null;
  bostaTrackingUrl?: string | null;
};

export type StatusFilter = OrderStatus | "all";

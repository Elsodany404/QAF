import type { LucideIcon } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { Option, OptionValue, Order, OrderItem, Product } from "./db";

export type ProductOption = Option & {
  OptionValues: OptionValue[];
};
export type OrderQuery = Order & {
  orderItems: (OrderItem & { product: Product })[];
};
export type ProductQuery = Product & {
  options: ProductOption[];
};

export type TransformedOption = Option & {
  values: OptionValue[];
  defaultValue: OptionValue;
};

export type ActionState = {
  status: "idle" | "success" | "failed";
  message: string;
  /** Machine-readable reason, for flows that react to a specific failure. */
  code?: string;
};

export type ActionReturnType =
  | {
      success: true;
      data: unknown;
    }
  | {
      success: false;
      error: string;
    };

export type DataItem = {
  product: Product;
  options: TransformedOption[];
};
export type User = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  email: string;
  emailVerified: boolean;
  name: string;
  image?: string | null | undefined;
  role: string | null | undefined;
};
export type Cart = Item[];
export type AddItemResult = "added" | "max_quantity" | "cart_full";

export type orderPayloadT = {
  customerID: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  city: string;
  cityID: string;
  district: string;
  districtID: string;
  street: string;
  apartment: string;
  paymentMethod: PaymentMethod;
  shippingFees: number;
  cart: Cart;
};
export type SecureItem = {
  productID: number;
  optionsIDs: number[];
  valuesIDs: number[];
  quantity: number;
};
export type SecureCart = SecureItem[];

export type FormValues = {
  name: string;
  email: string;
  phone: string;
  city: string;
  cityID: string;
  district: string;
  districtID: string;
  street: string;
  apartment: string;
  paymentMethod: PaymentMethod;
};

export type PaymentOptionsT = {
  value: PaymentMethod;
  title: string;
  desc: string;
  Icon: LucideIcon;
}[];

export type CartContextT = {
  cart: Cart;
  open: boolean;
  totalItems: number;
  cartPrice: number;
  closeCart: () => void;
  openCart: () => void;
  clearCart: () => void;
  /** Re-prices the cart with today's products (prices, stock, names). */
  refreshCartPrices: () => Promise<void>;
  addItem: (item: Item) => AddItemResult;
  removeItem: (itemID: string) => void;
  increaseQuantity: (itemID: string) => void;
  decreaseQuantity: (itemID: string) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: Dispatch<SetStateAction<PaymentMethod>>;
  /** City the checkout is quoting shipping for; null until one is picked. */
  cityName: string | null;
  setCityName: Dispatch<SetStateAction<string | null>>;
  /** null until Bosta has priced the chosen city. */
  shippingFees: number | null;
  shippingFeesLoading: boolean;
  shippingFeesError: string | null;
  retryShippingFees: () => void;
  cartLoaded: boolean;
};

export type ProductFormInputs = {
  name: string;
  description: string;
  priceRaw: number;
  /** A CATEGORIES id other than "all". */
  category: string;
  imageUrl: string;
  blurredImageUrl: string;
  featured: boolean;
  inStock: boolean;
  options: ProductOptionFormInput[];
};

export type ProductOptionFormInput = {
  name: string;
  description: string;
  icon: string;
  values: ProductOptionValueFormInput[];
};

export type ProductOptionValueFormInput = {
  label: string;
  /**
   * Price change as a fraction of the base price: 0.1 = +10%, -0.2 = -20%.
   * (The admin form takes percent and converts.)
   */
  priceModifier: number;
  default: boolean;
  inStock: boolean;
};

export type GetProductsParams = {
  search?: string;
  category?: string;
  isFeatured?: boolean;
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
  product: Product;
  options: OptionValue[];
  quantity: number;
  itemPrice: number;
};
export type PaymentMethod =
  "paymob_card" | "mobile_wallet" | "cash_on_delivery";

export type AddProductResult =
  | { type: "success"; message: "Product created"; productID: number }
  | { type: "error"; message: string }
  | { type: "idle" };

/** Shape of src/assets/data/bostaDistricts.json (Bosta's city list). */
export type BostaCity = {
  cityId: string;
  cityName: string;
  cityOtherName: string;
  cityCode: string;
  districts: BostaDistrict[];
  pickupAvailability: boolean;
  dropOffAvailability: boolean;
};

export type BostaDistrict = {
  zoneId: string;
  zoneName: string;
  zoneOtherName: string;
  districtId: string;
  districtName: string;
  districtOtherName: string;
  pickupAvailability: boolean;
  dropOffAvailability: boolean;
  isBusy?: boolean;
  notAllowedBulkyOrders?: boolean;
};

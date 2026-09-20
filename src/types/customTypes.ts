import { CreditCard } from "lucide-react";
import type {
  Option,
  OptionValue,
  Order,
  OrderItem,
  OrderStatus,
  Product,
} from "./db";
import { Dispatch, SetStateAction } from "react";
export type ActionState = {
  status: "idle" | "success" | "failed";
  message: string;
};
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
export type CreatePaymentResult =
  | {
      success: true;
      data: {
        client_secret: string;
        [key: string]: unknown;
      };
    }
  | {
      success: false;
      error: string;
    };

export type DataItem = {
  product: Product;
  options: TransformedOption[]; // Added [] here
};
export type Cart = Item[];

export type orderPayloadT = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  city: string;
  cityID: string;
  district: string;
  districtID: string;
  street: string;
  apartment: string;
  paymentMethod: string;
  shippingFees: number;
  cart: Cart;
};
export type secureItem = {
  productID: number;
  optionsIDs: number[];
  valuesIDs: number[];
  quantity: number;
};
export type secureCart = secureItem[];

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
  Icon: typeof CreditCard;
}[];

export type CartContextT = {
  cart: Cart;
  open: boolean;
  totalItems: number;
  cartPrice: number;
  closeCart: () => void;
  openCart: () => void;
  clearCart: () => void;
  addItem: (item: Item) => void;
  removeItem: (itemID: string) => void;
  increaseQuantity: (itemID: string) => void;
  decreaseQuantity: (itemID: string) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: Dispatch<SetStateAction<PaymentMethod>>;
  setCityName: Dispatch<SetStateAction<string | null>>;
  taxOnCod: number;
  shippingFees: number;
  shippingFeesLoading: boolean;
  cartLoaded: boolean;
};

export type ImageDimensions = {
  width: number;
  height: number;
};

export type ProductFormInputs = {
  name: string;
  description: string;
  priceRaw: number;
  category: (typeof CATEGORIES)[number]["label"];
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
  | "paymob_card"
  | "vodafone_cash"
  | "cash_on_delivery";

export type StatusFilter = OrderStatus | "all";

export type AddProductResult =
  | { type: "success"; message: "Product created"; productID: number }
  | { type: "error"; message: "Failed to create product" }
  | { type: "idle" };

export type BostaApiResponse = {
  data: BostaCity[];
};

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

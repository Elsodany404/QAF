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

export type constructedData = {
  product: Product;
  options: TransformedOption[]; // Added [] here
};
export type Cart = Item[];
export type orderPayloadT = Partial<Order> & { cart: Cart };
export type FormValues = {
  name: string;
  email: string;
  phone: string;
  governorate: string;
  city: string;
  streetAddress: string;
  apartment: string;
  details: string;
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

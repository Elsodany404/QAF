export type OrderStatus =
  | "pending"
  | "paid"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  inStock: boolean;
  featured: boolean;
  description: string;
}

export interface Order {
  id: string;
  created_at: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  totalAmount: number;
  status: OrderStatus;
  paymobOrderID: string | null;
  paymobTransactionID: string | null;
}

export interface OrderItem {
  id: string;
  createdAt: string;
  orderID: string;
  productID: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  options: { option: ProductOption; value: ProductOptionValue }[];
}
export interface ProductOption {
  id: string;
  productID: string;
  optionName: string;
} // (1)size [50,100,250,500,1000] , (2)roasting [plain,blended], (3) percentage arabica [70%,80%,100%], (4)type of blend [QAF blend, Gold Blend, Colombian Blend]

export interface ProductOptionValue {
  id: string;
  optionID: string;
  valueName: string;
  priceModifier: number;
}

export interface Database {
  public: {
    Tables: {
      products: {
        Row: Product;
        Insert: Omit<Product, "id" | "created_at">;
        Update: Partial<Omit<Product, "id" | "created_at">>;
      };
      orders: {
        Row: Order;
        Insert: Omit<Order, "id" | "created_at">;
        Update: Partial<Omit<Order, "id" | "created_at">>;
      };
      order_items: {
        Row: OrderItem;
        Insert: Omit<OrderItem, "id">;
        Update: Partial<Omit<OrderItem, "id">>;
      };
    };
  };
}

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
  image_url: string;
  in_stock: boolean;
  featured: boolean;
  description: string;
}

export interface Order {
  id: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  orderItems: OrderItem[];
  total_amount: number;
  status: OrderStatus;
  paymob_order_id: string | null;
  paymob_transaction_id: string | null;
}

export interface OrderItem {
  id: string;
  created_at: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  options: { option: Product_Option; value: Product_Option_Value }[];
}
export interface Product_Option {
  id: string;
  productID: string;
  optionName: string;
} // (1)size [50,100,250,500,1000] , (2)roasting [plain,blended], (3) percentage arabica [70%,80%,100%], (4)type of blend [QAF blend, Gold Blend, Colombian Blend]

export interface Product_Option_Value {
  id: string;
  optionID: string;
  valueName: string;
  price_modifier: number; 
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

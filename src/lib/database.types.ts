export type ProductCategory = 'turkish_coffee' | 'espresso' | 'flavored_coffee';
export type ProductSubcategory = 'qaf_blend' | 'colombian_blend' | 'golden_blend';
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

export interface WeightOption {
  label: string;
  price_modifier: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  subcategory: ProductSubcategory | null;
  image_url: string;
  weight_options: WeightOption[];
  in_stock: boolean;
  featured: boolean;
  sort_order: number;
  created_at: string;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  total_amount: number;
  status: OrderStatus;
  paymob_order_id: string | null;
  paymob_transaction_id: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  weight_option: string | null;
}

export interface Database {
  public: {
    Tables: {
      products: {
        Row: Product;
        Insert: Omit<Product, 'id' | 'created_at'>;
        Update: Partial<Omit<Product, 'id' | 'created_at'>>;
      };
      orders: {
        Row: Order;
        Insert: Omit<Order, 'id' | 'created_at'>;
        Update: Partial<Omit<Order, 'id' | 'created_at'>>;
      };
      order_items: {
        Row: OrderItem;
        Insert: Omit<OrderItem, 'id'>;
        Update: Partial<Omit<OrderItem, 'id'>>;
      };
    };
  };
}

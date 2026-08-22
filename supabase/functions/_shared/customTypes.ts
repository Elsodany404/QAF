import type { Database } from "./database.types.ts";

export type Order = Database["public"]["Tables"]["Order"]["Row"];

export type OrderItem =
  Database["public"]["Tables"]["OrderItem"]["Row"];

export type Product =
  Database["public"]["Tables"]["Product"]["Row"];

export type OrderQuery = Order & {
  orderItems: (OrderItem & {
    product: Product;
  })[];
};
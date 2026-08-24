import type {
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
} from "../lib/database.types";

// Rows
export type Product = Tables<"Product">;
export type ProductOption = Tables<"ProductOptions">;
export type Option = Tables<"Options">;
export type OptionValue = Tables<"OptionValues">;
export type Order = Tables<"Order">;
export type OrderItem = Tables<"OrderItem">;

// Insert types
export type ProductInsert = TablesInsert<"Product">;
export type ProductOptionInsert = TablesInsert<"ProductOptions">;
export type OptionInsert = TablesInsert<"Options">;
export type OptionValueInsert = TablesInsert<"OptionValues">;
export type OrderInsert = TablesInsert<"Order">;
export type OrderItemInsert = TablesInsert<"OrderItem">;

// Update types
export type ProductUpdate = TablesUpdate<"Product">;
export type ProductOptionUpdate = TablesUpdate<"ProductOptions">;
export type OptionUpdate = TablesUpdate<"Options">;
export type OptionValueUpdate = TablesUpdate<"OptionValues">;
export type OrderUpdate = TablesUpdate<"Order">;
export type OrderItemUpdate = TablesUpdate<"OrderItem">;

// Enums
export type OrderStatus = Enums<"orderStatus">;

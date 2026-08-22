export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      Options: {
        Row: {
          description: string | null;
          icon: string | null;
          id: number;
          name: string;
        };
        Insert: {
          description?: string | null;
          icon?: string | null;
          id: number;
          name: string;
        };
        Update: {
          description?: string | null;
          icon?: string | null;
          id?: number;
          name?: string;
        };
        Relationships: [];
      };
      OptionValues: {
        Row: {
          default: boolean;
          id: number;
          inStock: boolean;
          label: string;
          optionID: number;
          priceModifier: number | null;
        };
        Insert: {
          default?: boolean;
          id: number;
          inStock?: boolean;
          label: string;
          optionID: number;
          priceModifier?: number | null;
        };
        Update: {
          default?: boolean;
          id?: number;
          inStock?: boolean;
          label?: string;
          optionID?: number;
          priceModifier?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "ProductOptionValue_optionID_fkey";
            columns: ["optionID"];
            isOneToOne: false;
            referencedRelation: "Options";
            referencedColumns: ["id"];
          },
        ];
      };
      Order: {
        Row: {
          addressDetails: string;
          apartment: string;
          bostaOrderID: string | null;
          bostaTrackingNumber: string | null;
          bostaTrackingUrl: string | null;
          city: string;
          created_at: string;
          customerEmail: string;
          customerName: string;
          customerPhone: string;
          governorate: string;
          id: number;
          paymentMethod: string | null;
          paymentStatus: string | null;
          paymobOrderID: string | null;
          paymobTransactionID: string | null;
          shippingStatus: string | null;
          status: Database["public"]["Enums"]["orderStatus"];
          street: string;
          totalPrice: number;
        };
        Insert: {
          addressDetails: string;
          apartment: string;
          bostaOrderID?: string | null;
          bostaTrackingNumber?: string | null;
          bostaTrackingUrl?: string | null;
          city: string;
          created_at?: string;
          customerEmail: string;
          customerName: string;
          customerPhone: string;
          governorate: string;
          id?: number;
          paymentMethod?: string | null;
          paymentStatus?: string | null;
          paymobOrderID?: string | null;
          paymobTransactionID?: string | null;
          shippingStatus?: string | null;
          status?: Database["public"]["Enums"]["orderStatus"];
          street: string;
          totalPrice: number;
        };
        Update: {
          addressDetails?: string;
          apartment?: string;
          bostaOrderID?: string | null;
          bostaTrackingNumber?: string | null;
          bostaTrackingUrl?: string | null;
          city?: string;
          created_at?: string;
          customerEmail?: string;
          customerName?: string;
          customerPhone?: string;
          governorate?: string;
          id?: number;
          paymentMethod?: string | null;
          paymentStatus?: string | null;
          paymobOrderID?: string | null;
          paymobTransactionID?: string | null;
          shippingStatus?: string | null;
          status?: Database["public"]["Enums"]["orderStatus"];
          street?: string;
          totalPrice?: number;
        };
        Relationships: [];
      };
      OrderItem: {
        Row: {
          createdAt: string;
          id: number;
          options: Json | null;
          orderID: number;
          productID: number;
          productName: string;
          quantity: number;
          totalPrice: number;
        };
        Insert: {
          createdAt?: string;
          id?: number;
          options?: Json | null;
          orderID: number;
          productID: number;
          productName: string;
          quantity: number;
          totalPrice: number;
        };
        Update: {
          createdAt?: string;
          id?: number;
          options?: Json | null;
          orderID?: number;
          productID?: number;
          productName?: string;
          quantity?: number;
          totalPrice?: number;
        };
        Relationships: [
          {
            foreignKeyName: "OrderItem_orderID_fkey";
            columns: ["orderID"];
            isOneToOne: false;
            referencedRelation: "Order";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "OrderItem_productID_fkey";
            columns: ["productID"];
            isOneToOne: false;
            referencedRelation: "Product";
            referencedColumns: ["id"];
          },
        ];
      };
      Product: {
        Row: {
          category: string | null;
          description: string | null;
          featured: boolean;
          id: number;
          imageUrl: string | null;
          inStock: boolean;
          name: string | null;
          price: number;
        };
        Insert: {
          category?: string | null;
          description?: string | null;
          featured?: boolean;
          id: number;
          imageUrl?: string | null;
          inStock?: boolean;
          name?: string | null;
          price: number;
        };
        Update: {
          category?: string | null;
          description?: string | null;
          featured?: boolean;
          id?: number;
          imageUrl?: string | null;
          inStock?: boolean;
          name?: string | null;
          price?: number;
        };
        Relationships: [];
      };
      ProductOptions: {
        Row: {
          id: number;
          optionID: number;
          productID: number;
        };
        Insert: {
          id?: number;
          optionID: number;
          productID: number;
        };
        Update: {
          id?: number;
          optionID?: number;
          productID?: number;
        };
        Relationships: [
          {
            foreignKeyName: "ProductOptions_optionID_fkey";
            columns: ["optionID"];
            isOneToOne: false;
            referencedRelation: "Options";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ProductOptions_productID_fkey";
            columns: ["productID"];
            isOneToOne: false;
            referencedRelation: "Product";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_order:
        | {
            Args: {
              p_customer_email: string;
              p_customer_name: string;
              p_customer_phone: string;
              p_items: Json;
              p_payment_method: string;
              p_shipping_address: string;
              p_total_amount: number;
            };
            Returns: number;
          }
        | {
            Args: {
              p_customer_email: string;
              p_customer_name: string;
              p_customer_phone: string;
              p_items: Json;
              p_payment_method: string;
              p_shipping_address: string;
              p_total_price: number;
            };
            Returns: number;
          };
    };
    Enums: {
      orderstatus:
        "pending" | "paid" | "shipped" | "completed" | "cancelled" | "failed";
      orderStatus: "pending" | "paid" | "shipped" | "completed" | "cancelled";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      orderstatus: [
        "pending",
        "paid",
        "shipped",
        "completed",
        "cancelled",
        "failed",
      ],
      orderStatus: ["pending", "paid", "shipped", "completed", "cancelled"],
    },
  },
} as const;

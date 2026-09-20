export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      account: {
        Row: {
          accessToken: string | null
          accessTokenExpiresAt: string | null
          accountId: string
          createdAt: string
          id: string
          idToken: string | null
          issuer: string | null
          password: string | null
          providerId: string
          refreshToken: string | null
          refreshTokenExpiresAt: string | null
          scope: string | null
          updatedAt: string
          userId: string
        }
        Insert: {
          accessToken?: string | null
          accessTokenExpiresAt?: string | null
          accountId: string
          createdAt?: string
          id: string
          idToken?: string | null
          issuer?: string | null
          password?: string | null
          providerId: string
          refreshToken?: string | null
          refreshTokenExpiresAt?: string | null
          scope?: string | null
          updatedAt: string
          userId: string
        }
        Update: {
          accessToken?: string | null
          accessTokenExpiresAt?: string | null
          accountId?: string
          createdAt?: string
          id?: string
          idToken?: string | null
          issuer?: string | null
          password?: string | null
          providerId?: string
          refreshToken?: string | null
          refreshTokenExpiresAt?: string | null
          scope?: string | null
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      Options: {
        Row: {
          description: string
          icon: string
          id: number
          name: string
        }
        Insert: {
          description: string
          icon: string
          id: number
          name: string
        }
        Update: {
          description?: string
          icon?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      OptionValues: {
        Row: {
          default: boolean
          id: number
          inStock: boolean
          label: string
          optionID: number
          priceModifier: number
        }
        Insert: {
          default?: boolean
          id: number
          inStock?: boolean
          label: string
          optionID: number
          priceModifier?: number
        }
        Update: {
          default?: boolean
          id?: number
          inStock?: boolean
          label?: string
          optionID?: number
          priceModifier?: number
        }
        Relationships: [
          {
            foreignKeyName: "ProductOptionValue_optionID_fkey"
            columns: ["optionID"]
            isOneToOne: false
            referencedRelation: "Options"
            referencedColumns: ["id"]
          },
        ]
      }
      Order: {
        Row: {
          apartment: string
          bostaOrderID: string | null
          bostaTrackingNumber: string | null
          bostaTrackingUrl: string | null
          city: string
          cityID: string
          created_at: string
          customerEmail: string
          customerName: string
          customerPhone: string
          district: string
          districtID: string
          id: number
          paymentMethod: string
          paymentStatus: string
          paymobOrderID: string | null
          paymobTransactionID: string | null
          shippingFees: number
          shippingStatus: string
          status: Database["public"]["Enums"]["orderStatus"]
          street: string
          subTotal: number
          totalPrice: number
        }
        Insert: {
          apartment: string
          bostaOrderID?: string | null
          bostaTrackingNumber?: string | null
          bostaTrackingUrl?: string | null
          city: string
          cityID: string
          created_at?: string
          customerEmail: string
          customerName: string
          customerPhone: string
          district: string
          districtID: string
          id?: number
          paymentMethod: string
          paymentStatus?: string
          paymobOrderID?: string | null
          paymobTransactionID?: string | null
          shippingFees: number
          shippingStatus?: string
          status?: Database["public"]["Enums"]["orderStatus"]
          street: string
          subTotal: number
          totalPrice: number
        }
        Update: {
          apartment?: string
          bostaOrderID?: string | null
          bostaTrackingNumber?: string | null
          bostaTrackingUrl?: string | null
          city?: string
          cityID?: string
          created_at?: string
          customerEmail?: string
          customerName?: string
          customerPhone?: string
          district?: string
          districtID?: string
          id?: number
          paymentMethod?: string
          paymentStatus?: string
          paymobOrderID?: string | null
          paymobTransactionID?: string | null
          shippingFees?: number
          shippingStatus?: string
          status?: Database["public"]["Enums"]["orderStatus"]
          street?: string
          subTotal?: number
          totalPrice?: number
        }
        Relationships: []
      }
      OrderItem: {
        Row: {
          createdAt: string
          id: number
          options: Json
          orderID: number
          productID: number
          productName: string
          quantity: number
          totalPrice: number
        }
        Insert: {
          createdAt?: string
          id?: number
          options: Json
          orderID: number
          productID: number
          productName: string
          quantity: number
          totalPrice: number
        }
        Update: {
          createdAt?: string
          id?: number
          options?: Json
          orderID?: number
          productID?: number
          productName?: string
          quantity?: number
          totalPrice?: number
        }
        Relationships: [
          {
            foreignKeyName: "OrderItem_orderID_fkey"
            columns: ["orderID"]
            isOneToOne: false
            referencedRelation: "Order"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "OrderItem_productID_fkey"
            columns: ["productID"]
            isOneToOne: false
            referencedRelation: "Product"
            referencedColumns: ["id"]
          },
        ]
      }
      Product: {
        Row: {
          "blurred-image": string
          category: string
          description: string
          featured: boolean
          id: number
          ID: string
          imageUrl: string
          inStock: boolean
          name: string
          price: number
          uuid: string
        }
        Insert: {
          "blurred-image": string
          category: string
          description: string
          featured?: boolean
          id: number
          ID?: string
          imageUrl: string
          inStock?: boolean
          name: string
          price: number
          uuid?: string
        }
        Update: {
          "blurred-image"?: string
          category?: string
          description?: string
          featured?: boolean
          id?: number
          ID?: string
          imageUrl?: string
          inStock?: boolean
          name?: string
          price?: number
          uuid?: string
        }
        Relationships: []
      }
      ProductOptions: {
        Row: {
          id: number
          optionID: number
          productID: number
        }
        Insert: {
          id?: number
          optionID: number
          productID: number
        }
        Update: {
          id?: number
          optionID?: number
          productID?: number
        }
        Relationships: [
          {
            foreignKeyName: "ProductOptions_optionID_fkey"
            columns: ["optionID"]
            isOneToOne: false
            referencedRelation: "Options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ProductOptions_productID_fkey"
            columns: ["productID"]
            isOneToOne: false
            referencedRelation: "Product"
            referencedColumns: ["id"]
          },
        ]
      }
      session: {
        Row: {
          createdAt: string
          expiresAt: string
          id: string
          ipAddress: string | null
          token: string
          updatedAt: string
          userAgent: string | null
          userId: string
        }
        Insert: {
          createdAt?: string
          expiresAt: string
          id: string
          ipAddress?: string | null
          token: string
          updatedAt: string
          userAgent?: string | null
          userId: string
        }
        Update: {
          createdAt?: string
          expiresAt?: string
          id?: string
          ipAddress?: string | null
          token?: string
          updatedAt?: string
          userAgent?: string | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      user: {
        Row: {
          createdAt: string
          email: string
          emailVerified: boolean
          id: string
          image: string | null
          name: string
          role: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          email: string
          emailVerified: boolean
          id: string
          image?: string | null
          name: string
          role?: string
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          email?: string
          emailVerified?: boolean
          id?: string
          image?: string | null
          name?: string
          role?: string
          updatedAt?: string
        }
        Relationships: []
      }
      verification: {
        Row: {
          createdAt: string
          expiresAt: string
          id: string
          identifier: string
          updatedAt: string
          value: string
        }
        Insert: {
          createdAt?: string
          expiresAt: string
          id: string
          identifier: string
          updatedAt?: string
          value: string
        }
        Update: {
          createdAt?: string
          expiresAt?: string
          id?: string
          identifier?: string
          updatedAt?: string
          value?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_order: {
        Args: {
          p_apartment: string
          p_city: string
          p_cityid: string
          p_customer_email: string
          p_customer_name: string
          p_customer_phone: string
          p_district: string
          p_districtid: string
          p_items: Json
          p_payment_method: string
          p_shipping_fees: number
          p_street: string
          p_subtotal: number
        }
        Returns: number
      }
    }
    Enums: {
      orderstatus:
        | "pending"
        | "paid"
        | "shipped"
        | "completed"
        | "cancelled"
        | "failed"
      orderStatus: "pending" | "paid" | "shipped" | "completed" | "cancelled"
      role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

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
      role: ["admin", "user"],
    },
  },
} as const

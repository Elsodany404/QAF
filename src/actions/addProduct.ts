"use server";

import { createClient } from "@supabase/supabase-js";
import { CATEGORIES } from "@/types/customTypes";

// Admin client bypasses RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
);

export type AddProductResult =
  | { status: "success"; message: string; productID: number }
  | { status: "failed"; message: string };

export async function addProduct(
  _: unknown,
  formData: FormData,
): Promise<AddProductResult> {
  try {
    const name = (formData.get("name") as string | null)?.trim();
    const description = (formData.get("description") as string | null)?.trim();
    const priceRaw = formData.get("price") as string | null;
    const category = formData.get("category") as string | null;
    const imageUrl = (formData.get("imageUrl") as string | null)?.trim();
    const featured = formData.get("featured") === "true";
    const inStock = formData.get("inStock") !== "false";

    if (!name || !description || !priceRaw || !category || !imageUrl) {
      return { status: "failed", message: "All fields are required" };
    }

    const price = Number(priceRaw);
    if (isNaN(price) || price <= 0) {
      return { status: "failed", message: "Price must be a positive number" };
    }

    const validCategories = CATEGORIES.filter((c) => c.id !== "all").map(
      (c) => c.id,
    );
    if (!validCategories.includes(category)) {
      return { status: "failed", message: "Invalid category" };
    }

    const { data, error } = await supabaseAdmin
      .from("Product")
      .insert({ name, description, price, category, imageUrl, featured, inStock })
      .select("id")
      .single();

    if (error) {
      return { status: "failed", message: error.message };
    }

    return {
      status: "success",
      message: `Product "${name}" added successfully`,
      productID: data.id,
    };
  } catch (err) {
    return {
      status: "failed",
      message: err instanceof Error ? err.message : "Unexpected error",
    };
  }
}


"use server";

import { AddProductResult, CATEGORIES } from "@/types/customTypes";
import supabaseAdmin from "@/supabase/admin";

export async function addProduct(
  prevState: AddProductResult,
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
      console.error("All fields are required");
      return { type: "error", message: "Failed to create product" };
    }

    const price = Number(priceRaw);
    if (isNaN(price) || price <= 0) {
      return { type: "error", message: "Failed to create product" };
    }

    const validCategories = CATEGORIES.filter((c) => c.id !== "all").map(
      (c) => c.id,
    );
    if (!validCategories.includes(category)) {
      console.error("invalid category");
      return { type: "error", message: "Failed to create product" };
    }

    const { data, error } = await supabaseAdmin
      .from("Product")
      .insert({
        name,
        description,
        price,
        category,
        imageUrl,
        featured,
        inStock,
      })
      .select("id")
      .single();

    if (error) {
      console.error(error.message);
      return { type: "error", message: "Failed to create product" };
    }

    console.log(`Product "${name}" added successfully`);
    return {
      type: "success",
      message: "Product created",
      productID: data.id,
    };
  } catch (err) {
    console.error(err instanceof Error ? err.message : "Unexpected error");
    return {
      type: "error",
      message: "Failed to create product",
    };
  }
}

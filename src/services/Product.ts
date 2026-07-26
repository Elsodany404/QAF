import { supabase } from "../lib/supabase";
import { ProductWithOptions } from "../types/customTypes";

export async function getAllProducts() {
  const { data, error } = await supabase.from("Product").select("*");

  if (error) throw error;

  return data;
}

export async function getProductByID(
  productId: number,
): Promise<ProductWithOptions> {
  const { data, error } = await supabase
    .from("Product")
    .select(
      `
    *,
    ProductOptions(
      optionID(
        *,
        OptionValues(*)
      )
    )
  `,
    )
    .eq("id", productId)
    .single();

  if (error) throw error;

  return data;
}

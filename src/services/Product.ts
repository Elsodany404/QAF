import { data } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Product } from "../types/db";

export async function getAllProducts() {
  const { data, error } = await supabase.from("Product").select("*");

  if (error) throw error;

  return data;
}
export async function getProductByID(id: number): Promise<Product> {
  // 1. We keep the variable name as 'data' for cleanliness
  // 2. We add .single() at the end to get one object instead of an array
  let { data, error } = await supabase
    .from("Product")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data as Product;
}
export async function getOptions(productId: number) {
  const { data, error } = await supabase
    .from("ProductOptions")
    .select(
      `
    productID,
    optionID (
      id,
      name,
      OptionValues (
        id,
        label,
        priceModifier,
        inStock,
        optionID
      )
    )
  `,
    )
    .eq("productID", productId);

  if (error) throw error;

  return (data as any).map((item: any) => item.optionID);
}

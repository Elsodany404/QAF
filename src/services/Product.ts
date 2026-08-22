import { constructData } from "../helper/helper";
import { supabase } from "../lib/supabase";
import { constructedData } from "../types/customTypes";

export async function getAllProducts() {
  const { data, error } = await supabase.from("Product").select("*");

  if (error) throw error;

  return data;
}

export async function getProductByID(
  productId: number,
): Promise<constructedData> {
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
  // Extract ProductOptions and return a flattened 'options' array
  const { ProductOptions, ...product } = data;
  const rawData = {
    ...product,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options: ProductOptions.map((item: any) => item.optionID),
  };
  return constructData(rawData);
}

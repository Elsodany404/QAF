import { constructData } from "../helper/helper";
import { supabase } from "../lib/supabase";
import { DataItem } from "../types/customTypes";

export async function getAllProducts(): Promise<DataItem[]> {
  const { data, error } = await supabase.from("Product").select(
    `
      *,
      ProductOptions(
        optionID(
          *,
          OptionValues(*)
        )
      )
    `,
  );
  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((item: any) => {
    const { ProductOptions, ...product } = item;
    const rawData = {
      ...product,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      options: ProductOptions?.map((opt: any) => opt.optionID) ?? [],
    };
    return constructData(rawData);
  });
}

export async function getProductByID(productId: number): Promise<DataItem> {
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

import { constructData } from "../helper/helper";
import { supabase } from "../lib/supabase";
import { DataItem, GetProductsParams } from "../types/customTypes";

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

export async function getProducts({
  search = "",
  category = "all",
  isFeatured = false,
}: GetProductsParams): Promise<DataItem[]> {
  // 1. Start the base query on the Product table
  let query = supabase.from("Product").select("*");

  // 2. Add exact match filter for category
  if (category !== "all") {
    query = query.eq("category", category);
  }

  // 3. Add boolean filter for featured items
  if (isFeatured) {
    query = query.eq("featured", true);
  }

  // 4. Add case-insensitive partial match for search
  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }

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

export async function getProductByID(
  productId: number | string,
): Promise<DataItem | null> {
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

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }

    throw error;
  }

  // Extract ProductOptions and return a flattened 'options' array
  const { ProductOptions, ...product } = data;
  const rawData = {
    ...product,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options: ProductOptions.map((item: any) => item.optionID),
  };
  return constructData(rawData);
}

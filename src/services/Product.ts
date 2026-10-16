import { supabase } from "@/supabase/supabase";
import type { DataItem, GetProductsParams } from "@/types/customTypes";
import {
  PRODUCT_WITH_OPTIONS,
  toDataItem,
  type ProductRow,
} from "@/utils/constructAPI";

/*
 * Public catalog reads (publishable key). Query errors are thrown, so a
 * database outage shows the error page with "Try again" instead of an empty
 * shop that looks like it has no products.
 */

export async function getProducts({
  search = "",
  category = "all",
  isFeatured = false,
}: GetProductsParams = {}): Promise<DataItem[]> {
  let query = supabase.from("Product").select(PRODUCT_WITH_OPTIONS);

  if (category !== "all") {
    query = query.eq("category", category);
  }

  if (isFeatured) {
    query = query.eq("featured", true);
  }

  // PostgREST filter syntax uses , . ( ) : and * — strip them (and the LIKE
  // wildcards) so a search term can't inject extra filter clauses.
  const safeSearch = search
    .replace(/[,.():*%\\]/g, " ")
    .trim()
    .slice(0, 100);
  if (safeSearch) {
    query = query.or(
      `name.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%`,
    );
  }

  const { data, error } = await query.order("id");
  if (error) {
    throw new Error(`Failed to load products: ${error.message}`);
  }

  return ((data ?? []) as ProductRow[]).map(toDataItem);
}

export function getAllProducts(): Promise<DataItem[]> {
  return getProducts();
}

export async function getProductByID(
  productId: string,
): Promise<DataItem | null> {
  // A malformed ID can't match a product: that's a 404, not a query error.
  if (!/^\d{1,18}$/.test(productId)) return null;

  const { data, error } = await supabase
    .from("Product")
    .select(PRODUCT_WITH_OPTIONS)
    .eq("id", productId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load product ${productId}: ${error.message}`);
  }
  return data ? toDataItem(data as ProductRow) : null;
}

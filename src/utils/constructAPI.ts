import type {
  DataItem,
  ProductOption,
  ProductQuery,
} from "@/types/customTypes";
import type { OptionValue, Product } from "@/types/db";

/** Supabase select for a product with its options and their values. */
export const PRODUCT_WITH_OPTIONS = `
  *,
  ProductOptions(
    optionID(
      *,
      OptionValues(*)
    )
  )
`;

/** A row returned by PRODUCT_WITH_OPTIONS. */
export type ProductRow = Product & {
  ProductOptions?: { optionID: ProductOption }[] | null;
};

const byID = (a: { id: number }, b: { id: number }) => a.id - b.id;

/** The value a product page/card starts with: the default unless it's sold out. */
export function pickDefaultValue(values: OptionValue[]): OptionValue {
  return (
    values.find((value) => value.default && value.inStock) ??
    values.find((value) => value.inStock) ??
    values.find((value) => value.default) ??
    values[0]
  );
}

/**
 * Flattens a product with its options into the shape the UI and the order
 * code use. Options and values are sorted by ID so every page lists them in
 * the same order (the database returns them in no particular order).
 */
export function constructData(data: ProductQuery): DataItem {
  const { options, ...product } = data;
  return {
    product,
    options: [...options].sort(byID).map(({ OptionValues, ...option }) => {
      const values = [...(OptionValues ?? [])].sort(byID);
      return { ...option, values, defaultValue: pickDefaultValue(values) };
    }),
  };
}

export function toDataItem({ ProductOptions, ...product }: ProductRow): DataItem {
  return constructData({
    ...product,
    options: (ProductOptions ?? []).map((link) => link.optionID),
  });
}

import type {
  Cart,
  DataItem,
  Item,
  SecureCart,
  SecureItem,
} from "@/types/customTypes";
import type { OptionValue } from "@/types/db";

import supabaseAdmin from "@/supabase/admin";

import {
  PRODUCT_WITH_OPTIONS,
  toDataItem,
  type ProductRow,
} from "@/utils/constructAPI";
import { MAX_CART_LINES, MAX_QUANTITY_PER_ITEM } from "@/utils/cartLimits";
import { calcPrice, generateItemID } from "@/utils/helper";

type BuildServerCartResult =
  | {
      success: true;
      cart: Cart;
    }
  | {
      success: false;
      error: string;
    };

type PricedLine =
  { success: true; item: Item } | { success: false; error: string };

const isPositiveInteger = (value: unknown): value is number =>
  Number.isSafeInteger(value) && (value as number) > 0;

/**
 * Structural checks on what the browser sent, before anything touches the
 * database. Returns the problem, or null when the cart is well formed.
 */
function checkCartShape(secureCart: unknown): string | null {
  if (!Array.isArray(secureCart)) return "Invalid cart item";
  if (secureCart.length > MAX_CART_LINES) return "Too many items in the cart";

  for (const line of secureCart) {
    if (
      !line ||
      typeof line !== "object" ||
      !isPositiveInteger(line.productID) ||
      !Array.isArray(line.optionsIDs) ||
      !Array.isArray(line.valuesIDs) ||
      !isPositiveInteger(line.quantity) ||
      line.quantity > MAX_QUANTITY_PER_ITEM
    ) {
      return "Invalid cart item";
    }

    if (
      !line.optionsIDs.every(isPositiveInteger) ||
      !line.valuesIDs.every(isPositiveInteger)
    ) {
      return "Invalid option or value selection";
    }
  }
  return null;
}

/**
 * Lines for the same product and choices count as one line, so sending the
 * same item twice can't get around the per-item limit.
 */
function mergeDuplicateLines(secureCart: SecureCart): SecureCart {
  const sortedIDs = (ids: number[]) => [...ids].sort((a, b) => a - b).join(":");
  const merged = new Map<string, SecureItem>();

  for (const line of secureCart) {
    const key = [
      line.productID,
      sortedIDs(line.optionsIDs),
      sortedIDs(line.valuesIDs),
    ].join("|");
    const existing = merged.get(key);
    merged.set(
      key,
      existing
        ? { ...existing, quantity: existing.quantity + line.quantity }
        : line,
    );
  }
  return [...merged.values()];
}

/** The products with their options and values; null if the query failed. */
async function loadProducts(productIDs: number[]): Promise<DataItem[] | null> {
  const { data, error } = await supabaseAdmin
    .from("Product")
    .select(PRODUCT_WITH_OPTIONS)
    .in("id", productIDs);

  if (error || !data) {
    console.error("Cart: error fetching products", error);
    return null;
  }
  return (data as ProductRow[]).map(toDataItem);
}

const uniqueProductIDs = (secureCart: SecureCart) => [
  ...new Set(secureCart.map((line) => line.productID)),
];

/**
 * Checks one cart line against its product (stock, options, values) and
 * prices one unit with the same formula as the storefront, so the customer
 * is charged exactly what they saw.
 */
export function priceCartLine(
  dataItem: DataItem | undefined,
  line: SecureItem,
): PricedLine {
  if (!dataItem) {
    return { success: false, error: `Product ${line.productID} not found` };
  }

  const { product, options } = dataItem;

  if (!product.inStock) {
    return {
      success: false,
      error: `Product ${product.name} is out of stock`,
    };
  }

  // The line must pick exactly this product's options, each once...
  const optionIDs = new Set(options.map((option) => option.id));
  if (
    new Set(line.optionsIDs).size !== line.optionsIDs.length ||
    line.optionsIDs.length !== optionIDs.size ||
    line.optionsIDs.some((optionID) => !optionIDs.has(optionID))
  ) {
    return {
      success: false,
      error: `Invalid option selection for product ${product.id}`,
    };
  }

  // ...and one in-stock value of this product for each of them.
  const selectedValues: OptionValue[] = [];

  for (const valueID of line.valuesIDs) {
    const value = options
      .flatMap((option) => option.values)
      .find((optionValue) => optionValue.id === valueID);

    if (!value) {
      return {
        success: false,
        error: `Value ${valueID} does not belong to product ${product.id}`,
      };
    }
    if (!value.inStock) {
      return {
        success: false,
        error: `Selected option value ${valueID} is out of stock`,
      };
    }
    selectedValues.push(value);
  }

  for (const option of options) {
    const valuesForOption = selectedValues.filter((selected) =>
      option.values.some((optionValue) => optionValue.id === selected.id),
    );

    if (valuesForOption.length !== 1) {
      return {
        success: false,
        error: `Invalid value selection for option ${option.id}`,
      };
    }
  }

  // Final price for ONE unit of this cart item.
  const itemPrice = calcPrice(product, selectedValues);

  if (!Number.isFinite(itemPrice) || itemPrice <= 0) {
    return {
      success: false,
      error: `Invalid price for product ${product.id}`,
    };
  }

  return {
    success: true,
    item: {
      itemID: generateItemID(product.id, line.valuesIDs),
      product,
      options: selectedValues,
      quantity: line.quantity,
      itemPrice,
    },
  };
}

/** The cart an order is placed for, built only from database prices. */
export async function buildServerCart(
  secureCart: SecureCart,
): Promise<BuildServerCartResult> {
  const shapeError = checkCartShape(secureCart);
  if (shapeError) {
    return { success: false, error: shapeError };
  }
  if (secureCart.length === 0) {
    return { success: false, error: "Your cart is empty" };
  }

  const lines = mergeDuplicateLines(secureCart);
  if (lines.some((line) => line.quantity > MAX_QUANTITY_PER_ITEM)) {
    return {
      success: false,
      error: `You can order up to ${MAX_QUANTITY_PER_ITEM} of one item`,
    };
  }

  const productIDs = uniqueProductIDs(lines);
  const dataItems = await loadProducts(productIDs);

  if (!dataItems) {
    return {
      success: false,
      error: "We couldn't load your cart's products. Please try again.",
    };
  }

  if (dataItems.length !== productIDs.length) {
    return {
      success: false,
      error: "One or more products are no longer available",
    };
  }

  const cart: Cart = [];

  for (const line of lines) {
    const priced = priceCartLine(
      dataItems.find((item) => item.product.id === line.productID),
      line,
    );
    if (!priced.success) return priced;
    cart.push(priced.item);
  }

  return {
    success: true,
    cart,
  };
}

/**
 * Re-prices a saved cart line by line with today's products and prices: each
 * entry is the line as it would be ordered now, or null when it can't be
 * ordered any more (removed, sold out, options changed). Null overall when
 * the cart is malformed or the products couldn't be loaded.
 */
export async function repriceCart(
  secureCart: SecureCart,
): Promise<(Item | null)[] | null> {
  if (checkCartShape(secureCart)) return null;
  if (secureCart.length === 0) return [];

  const dataItems = await loadProducts(uniqueProductIDs(secureCart));
  if (!dataItems) return null;

  return secureCart.map((line) => {
    const priced = priceCartLine(
      dataItems.find((item) => item.product.id === line.productID),
      line,
    );
    return priced.success ? priced.item : null;
  });
}

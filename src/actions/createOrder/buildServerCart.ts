import type {
  Cart,
  DataItem,
  Item,
  SecureCart,
  SecureItem,
} from "@/types/customTypes";
import type { OptionValue } from "@/types/db";

import { productName } from "@/i18n/catalog";
import type { Locale } from "@/i18n/config";
import { format } from "@/i18n/format";
import { getMessages, type Messages } from "@/i18n/messages";
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

type ServerMessages = Messages["server"];

const isPositiveInteger = (value: unknown): value is number =>
  Number.isSafeInteger(value) && (value as number) > 0;

/**
 * Structural checks on what the browser sent, before anything touches the
 * database. Returns the problem, or null when the cart is well formed.
 */
function checkCartShape(
  secureCart: unknown,
  m: ServerMessages,
): string | null {
  if (!Array.isArray(secureCart)) return m.invalidCartItem;
  if (secureCart.length > MAX_CART_LINES) return m.tooManyItems;

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
      return m.invalidCartItem;
    }

    if (
      !line.optionsIDs.every(isPositiveInteger) ||
      !line.valuesIDs.every(isPositiveInteger)
    ) {
      return m.invalidSelection;
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
 * is charged exactly what they saw. Problems are explained in `locale`.
 */
export function priceCartLine(
  dataItem: DataItem | undefined,
  line: SecureItem,
  locale: Locale = "en",
): PricedLine {
  const m = getMessages(locale).server;
  if (!dataItem) {
    return {
      success: false,
      error: format(m.productNotFound, { id: line.productID }),
    };
  }

  const { product, options } = dataItem;

  if (!product.inStock) {
    return {
      success: false,
      error: format(m.productOutOfStock, {
        name: productName(product, locale),
      }),
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
      error: format(m.invalidOptions, { id: product.id }),
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
        error: format(m.valueNotInProduct, { value: valueID, id: product.id }),
      };
    }
    if (!value.inStock) {
      return {
        success: false,
        error: format(m.valueOutOfStock, { value: valueID }),
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
        error: format(m.invalidValues, { id: option.id }),
      };
    }
  }

  // Final price for ONE unit of this cart item.
  const itemPrice = calcPrice(product, selectedValues);

  if (!Number.isFinite(itemPrice) || itemPrice <= 0) {
    return {
      success: false,
      error: format(m.invalidPrice, { id: product.id }),
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

/**
 * The cart an order is placed for, built only from database prices.
 * Problems are explained in `locale`, the checkout's language.
 */
export async function buildServerCart(
  secureCart: SecureCart,
  locale: Locale = "en",
): Promise<BuildServerCartResult> {
  const m = getMessages(locale).server;
  const shapeError = checkCartShape(secureCart, m);
  if (shapeError) {
    return { success: false, error: shapeError };
  }
  if (secureCart.length === 0) {
    return { success: false, error: m.cartEmpty };
  }

  const lines = mergeDuplicateLines(secureCart);
  if (lines.some((line) => line.quantity > MAX_QUANTITY_PER_ITEM)) {
    return {
      success: false,
      error: format(m.maxPerItem, { max: MAX_QUANTITY_PER_ITEM }),
    };
  }

  const productIDs = uniqueProductIDs(lines);
  const dataItems = await loadProducts(productIDs);

  if (!dataItems) {
    return {
      success: false,
      error: m.productsNotLoaded,
    };
  }

  if (dataItems.length !== productIDs.length) {
    return {
      success: false,
      error: m.productsUnavailable,
    };
  }

  const cart: Cart = [];

  for (const line of lines) {
    const priced = priceCartLine(
      dataItems.find((item) => item.product.id === line.productID),
      line,
      locale,
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
  if (checkCartShape(secureCart, getMessages("en").server)) return null;
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

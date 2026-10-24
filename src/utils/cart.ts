import type {
  AddItemResult,
  Cart,
  Item,
  SecureCart,
} from "@/types/customTypes";
import { MAX_CART_LINES, MAX_QUANTITY_PER_ITEM } from "./cartLimits";
import { generateItemID } from "./helper";

/*
 * Pure cart operations used by CartContext. They never mutate the cart they
 * are given, so they work as React state updates.
 */

/**
 * Carts are saved in the browser, possibly by an older version of the site.
 * Entries that don't match the current shape would crash the cart UI.
 */
function isCartItem(value: unknown): value is Item {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Partial<Item>;
  return (
    typeof item.itemID === "string" &&
    typeof item.product?.id === "number" &&
    typeof item.product.name === "string" &&
    typeof item.product.imageUrl === "string" &&
    Array.isArray(item.options) &&
    item.options.every(
      (option) =>
        typeof option?.id === "number" && typeof option.optionID === "number",
    ) &&
    typeof item.quantity === "number" &&
    Number.isInteger(item.quantity) &&
    item.quantity > 0 &&
    Number.isFinite(item.itemPrice)
  );
}

/**
 * A cart read back from storage: broken entries dropped, lines re-keyed
 * with the current itemID format (older versions didn't sort the values, so
 * one choice could sit on two lines) and merged, within the cart limits.
 */
export function restoreCart(saved: unknown): Cart {
  if (!Array.isArray(saved)) return [];

  const cart: Cart = [];
  for (const entry of saved) {
    if (!isCartItem(entry)) continue;

    const itemID = generateItemID(
      entry.product.id,
      entry.options.map((option) => option.id),
    );
    const index = cart.findIndex((item) => item.itemID === itemID);

    if (index !== -1) {
      cart[index] = {
        ...cart[index],
        quantity: Math.min(
          cart[index].quantity + entry.quantity,
          MAX_QUANTITY_PER_ITEM,
        ),
      };
    } else if (cart.length < MAX_CART_LINES) {
      cart.push({
        ...entry,
        itemID,
        quantity: Math.min(entry.quantity, MAX_QUANTITY_PER_ITEM),
      });
    }
  }
  return cart;
}

/** Adds one unit of an item. The result says whether it was added or why not. */
export function addToCart(
  cart: Cart,
  item: Item,
): { cart: Cart; result: AddItemResult } {
  const existing = cart.find((i) => i.itemID === item.itemID);

  // Product already in the cart → one more of it
  if (existing) {
    if (existing.quantity >= MAX_QUANTITY_PER_ITEM) {
      return { cart, result: "max_quantity" };
    }
    return {
      cart: cart.map((i) =>
        i.itemID === item.itemID ? { ...i, quantity: i.quantity + 1 } : i,
      ),
      result: "added",
    };
  }

  if (cart.length >= MAX_CART_LINES) {
    return { cart, result: "cart_full" };
  }
  return { cart: [...cart, item], result: "added" };
}

/** Changes a line's quantity by `delta`; a line that reaches 0 is removed. */
export function changeQuantity(cart: Cart, itemID: string, delta: number) {
  return cart
    .map((item) =>
      item.itemID === itemID
        ? {
            ...item,
            quantity: Math.min(item.quantity + delta, MAX_QUANTITY_PER_ITEM),
          }
        : item,
    )
    .filter((item) => item.quantity > 0);
}

export function cartTotals(cart: Cart) {
  return {
    // Total quantity of all products
    totalItems: cart.reduce((total, item) => total + item.quantity, 0),
    // Total price before shipping
    cartPrice: cart.reduce(
      (total, item) => total + item.itemPrice * item.quantity,
      0,
    ),
  };
}

/** What checkout sends the server: IDs and quantities, never prices. */
export function toSecureCart(cart: Cart): SecureCart {
  return cart.map((item) => ({
    productID: item.product.id,
    optionsIDs: item.options.map((option) => option.optionID),
    valuesIDs: item.options.map((option) => option.id),
    quantity: item.quantity,
  }));
}

/**
 * Applies a refresh (see actions/cart/refreshCart) to the current cart.
 * `sent` is the cart the refresh was requested for and `fresh` the answer,
 * line by line. Lines added since keep their data; lines the server can't
 * price any more are removed.
 */
export function applyCartRefresh(
  cart: Cart,
  sent: Cart,
  fresh: (Item | null)[],
): { cart: Cart; removed: Item[]; repriced: Item[] } {
  // A malformed answer changes nothing; checkout checks the cart again.
  if (fresh.length !== sent.length) return { cart, removed: [], repriced: [] };

  const freshByID = new Map(sent.map((item, i) => [item.itemID, fresh[i]]));
  const removed: Item[] = [];
  const repriced: Item[] = [];
  const next: Cart = [];

  for (const item of cart) {
    if (!freshByID.has(item.itemID)) {
      next.push(item);
      continue;
    }

    const current = freshByID.get(item.itemID);
    if (!current) {
      removed.push(item);
      continue;
    }
    if (current.itemPrice !== item.itemPrice) repriced.push(current);
    // The customer's quantity and line stay; everything else is today's.
    next.push({ ...current, itemID: item.itemID, quantity: item.quantity });
  }

  return { cart: next, removed, repriced };
}

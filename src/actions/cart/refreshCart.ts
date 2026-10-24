"use server";

import { repriceCart } from "@/actions/createOrder/buildServerCart";
import type { Item, SecureCart } from "@/types/customTypes";

/**
 * Today's version of a cart saved in the browser: one entry per line, in
 * order, or null for a line that can't be ordered any more. Null overall
 * when the cart couldn't be checked; keep it as it is then.
 */
export async function refreshCart(
  secureCart: SecureCart,
): Promise<(Item | null)[] | null> {
  try {
    return await repriceCart(secureCart);
  } catch (error) {
    console.error("refreshCart failed:", error);
    return null;
  }
}

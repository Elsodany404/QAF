import type { Cart } from "@/types/customTypes";

export function calculateCartTotal(cart: Cart): number {
  const cartTotal = cart.reduce(
    (total, item) => total + item.itemPrice * item.quantity,
    0,
  );

  return cartTotal;
}

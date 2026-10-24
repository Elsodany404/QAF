"use client";

import { useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { claimCartClear } from "./clearCartOnce";

/**
 * Empties the cart the order was placed with. Only the first time this
 * order's confirmation is shown: opening it again (Back button, Paymob
 * sending the customer back, an old link) must not wipe a new cart.
 */
export default function ClearCart({ orderID }: { orderID: number }) {
  const { clearCart, cartLoaded } = useCart();

  useEffect(() => {
    if (cartLoaded && claimCartClear(orderID)) {
      clearCart();
    }
  }, [cartLoaded, clearCart, orderID]);

  return null;
}

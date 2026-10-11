"use client";

import { useEffect } from "react";
import { useCart } from "@/context/CartContext";

export default function ClearCart() {
  const { clearCart, cart } = useCart();

  // Clear the cart when the component mounts
  useEffect(() => {
    if (cart.length > 0) {
      clearCart();
    }
  }, [cart, clearCart]);

  return null;
}

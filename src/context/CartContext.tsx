"use client";
import { createContext, ReactNode, useContext, useState } from "react";
import { Cart, CartContextT, Item, PaymentMethod } from "../types/customTypes";

const cartContext = createContext<CartContextT | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>([]);
  const [open, setOpen] = useState(false);
  const totalItems = cart.length;
  const cartPrice = cart.reduce(
    (acc, curr) => acc + curr.itemPrice * curr.quantity,
    0,
  );
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("paymob_card");

  function addItem(item: Item) {
    const exist = cart.find((i) => i.itemID === item.itemID);
    if (exist) {
      increaseQuantity(item.itemID);
      return;
    }
    setCart([...cart, item]);
  }
  function removeItem(itemID: string) {
    const newCart = cart.filter((i) => i.itemID !== itemID);
    setCart(newCart);
  }
  function increaseQuantity(itemID: string) {
    const newCart = cart.map((i) => {
      if (i.itemID === itemID) {
        i.quantity += 1;
      }
      return i;
    });
    setCart(newCart);
  }
  function decreaseQuantity(itemID: string) {
    if (cart.find((i) => i.itemID === itemID)?.quantity === 1) {
      removeItem(itemID);
    }
    const newCart = cart.map((i) => {
      if (i.itemID === itemID) {
        i.quantity -= 1;
      }
      return i;
    });
    setCart(newCart);
  }
  function closeCart() {
    setOpen(false);
  }
  function openCart() {
    setOpen(true);
  }
  function clearCart() {
    setCart([]);
  }

  return (
    <cartContext.Provider
      value={{
        clearCart,
        cart,
        open,
        closeCart,
        openCart,
        addItem,
        removeItem,
        increaseQuantity,
        decreaseQuantity,
        cartPrice,
        totalItems,
        setPaymentMethod,
        paymentMethod,
      }}
    >
      {children}
    </cartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(cartContext);
  if (!context) throw Error("Cart context is used outside its scope");
  return context;
}

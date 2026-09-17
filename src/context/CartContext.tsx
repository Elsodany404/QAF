"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { Cart, CartContextT, Item, PaymentMethod } from "../types/customTypes";

import useShippingFees from "@/hooks/useShippingFees";

const cartContext = createContext<CartContextT | undefined>(undefined);

const CART_STORAGE_KEY = "cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>([]);
  const [cartLoaded, setCartLoaded] = useState(false);

  const [open, setOpen] = useState(false);
  const [cityName, setCityName] = useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("cash_on_delivery");

  // Load cart from localStorage when the provider mounts
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);

      if (savedCart) {
        const parsedCart: Cart = JSON.parse(savedCart);

        if (Array.isArray(parsedCart)) {
          setCart(parsedCart);
        }
      }
    } catch (error) {
      console.error("Failed to load cart from localStorage:", error);

      localStorage.removeItem(CART_STORAGE_KEY);
    } finally {
      setCartLoaded(true);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!cartLoaded) return;

    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error("Failed to save cart to localStorage:", error);
    }
  }, [cart, cartLoaded]);

  // Total quantity of all products
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

  // Total price before shipping/tax
  const cartPrice = cart.reduce(
    (total, item) => total + item.itemPrice * item.quantity,
    0,
  );

  const { shippingFees, shippingFeesLoading, taxOnCod } = useShippingFees({
    cartPrice,
    paymentMethod,
    cityName,
  });

  function addItem(item: Item) {
    setCart((prevCart) => {
      const existingItem = prevCart.find((i) => i.itemID === item.itemID);

      // Product already exists → increase quantity
      if (existingItem) {
        return prevCart.map((i) =>
          i.itemID === item.itemID
            ? {
                ...i,
                quantity: i.quantity + 1,
              }
            : i,
        );
      }

      // Product doesn't exist → add it
      return [...prevCart, item];
    });
  }

  function removeItem(itemID: string) {
    setCart((prevCart) => prevCart.filter((item) => item.itemID !== itemID));
  }

  function increaseQuantity(itemID: string) {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.itemID === itemID
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item,
      ),
    );
  }

  function decreaseQuantity(itemID: string) {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item.itemID === itemID
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function clearCart() {
    setCart([]);
  }

  function closeCart() {
    setOpen(false);
  }

  function openCart() {
    setOpen(true);
  }

  return (
    <cartContext.Provider
      value={{
        setCityName,

        taxOnCod,
        shippingFees,
        shippingFeesLoading,

        clearCart,

        cart,
        open,

        closeCart,
        openCart,
        cartLoaded,
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

  if (!context) {
    throw new Error("Cart context is used outside its scope");
  }

  return context;
}

"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useCallback,
  useState,
} from "react";

import { toast } from "react-hot-toast";

import type {
  AddItemResult,
  Cart,
  CartContextT,
  Item,
  PaymentMethod,
} from "../types/customTypes";

import useShippingFees from "@/hooks/useShippingFees";
import { MAX_CART_LINES, MAX_QUANTITY_PER_ITEM } from "@/utils/cartLimits";

const cartContext = createContext<CartContextT | undefined>(undefined);

/** Toast for the outcome of an "Add to cart" click. */
export function announceAddToCart(result: AddItemResult, productName: string) {
  if (result === "added") {
    toast.success(`${productName} added to your cart`);
  } else if (result === "max_quantity") {
    toast.error(
      `You can order up to ${MAX_QUANTITY_PER_ITEM} of one item. For bulk orders, please contact us.`,
    );
  } else {
    toast.error(
      `Your cart can hold ${MAX_CART_LINES} different items. Please check out or remove something first.`,
    );
  }
}

const CART_STORAGE_KEY = "cart";

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
        const parsedCart: unknown = JSON.parse(savedCart);

        if (Array.isArray(parsedCart)) {
          // localStorage only exists after mount; reading it during render
          // would make the server and client HTML differ.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setCart(parsedCart.filter(isCartItem).slice(0, MAX_CART_LINES));
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

  // Total price before shipping
  const cartPrice = cart.reduce(
    (total, item) => total + item.itemPrice * item.quantity,
    0,
  );

  const {
    shippingFees,
    shippingFeesLoading,
    shippingFeesError,
    retryShippingFees,
  } = useShippingFees({
    cartPrice,
    paymentMethod,
    cityName,
  });

  /** Adds one unit. The result says whether it was added or why not. */
  function addItem(item: Item): AddItemResult {
    const existing = cart.find((i) => i.itemID === item.itemID);
    if (existing && existing.quantity >= MAX_QUANTITY_PER_ITEM) {
      return "max_quantity";
    }
    if (!existing && cart.length >= MAX_CART_LINES) {
      return "cart_full";
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find((i) => i.itemID === item.itemID);

      // Product already exists → increase quantity
      if (existingItem) {
        return prevCart.map((i) =>
          i.itemID === item.itemID
            ? {
                ...i,
                quantity: Math.min(i.quantity + 1, MAX_QUANTITY_PER_ITEM),
              }
            : i,
        );
      }

      // Product doesn't exist → add it
      if (prevCart.length >= MAX_CART_LINES) return prevCart;
      return [...prevCart, item];
    });
    return "added";
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
              quantity: Math.min(item.quantity + 1, MAX_QUANTITY_PER_ITEM),
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

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  function closeCart() {
    setOpen(false);
  }

  function openCart() {
    setOpen(true);
  }

  return (
    <cartContext.Provider
      value={{
        cityName,
        setCityName,

        shippingFees,
        shippingFeesLoading,
        shippingFeesError,
        retryShippingFees,

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

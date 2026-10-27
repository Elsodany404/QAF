"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useCallback,
  useRef,
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

import { refreshCart } from "@/actions/cart/refreshCart";
import useShippingFees from "@/hooks/useShippingFees";
import { productName } from "@/i18n/catalog";
import type { Locale } from "@/i18n/config";
import { format } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import type { ClientMessages } from "@/i18n/messages";
import {
  addToCart,
  applyCartRefresh,
  cartTotals,
  changeQuantity,
  restoreCart,
  toSecureCart,
} from "@/utils/cart";
import { MAX_CART_LINES, MAX_QUANTITY_PER_ITEM } from "@/utils/cartLimits";

const cartContext = createContext<CartContextT | undefined>(undefined);

type CartMessages = ClientMessages["cart"];

/** Toast for the outcome of an "Add to cart" click. */
export function announceAddToCart(
  result: AddItemResult,
  name: string,
  messages: CartMessages,
) {
  if (result === "added") {
    toast.success(format(messages.added, { name }));
  } else if (result === "max_quantity") {
    toast.error(format(messages.maxQuantity, { max: MAX_QUANTITY_PER_ITEM }));
  } else {
    toast.error(format(messages.full, { max: MAX_CART_LINES }));
  }
}

const CART_STORAGE_KEY = "cart";

/** Toasts for lines a refresh removed or re-priced. */
function announceCartRefresh(
  removed: Item[],
  repriced: Item[],
  { locale, messages }: { locale: Locale; messages: CartMessages },
) {
  for (const item of removed) {
    toast.error(
      format(messages.removed, { name: productName(item.product, locale) }),
    );
  }
  if (repriced.length > 0) {
    toast(messages.pricesChanged);
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { locale, t } = useI18n();
  const [cart, setCart] = useState<Cart>([]);
  const [cartLoaded, setCartLoaded] = useState(false);

  const [open, setOpen] = useState(false);
  const [cityName, setCityName] = useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("cash_on_delivery");

  // The refresh reads the latest cart (and text) without re-subscribing to
  // them.
  const cartRef = useRef(cart);
  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);
  const textRef = useRef({ locale, messages: t.cart });
  useEffect(() => {
    textRef.current = { locale, messages: t.cart };
  }, [locale, t.cart]);

  // Load cart from localStorage when the provider mounts
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);

      if (savedCart) {
        // localStorage only exists after mount; reading it during render
        // would make the server and client HTML differ.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCart(restoreCart(JSON.parse(savedCart)));
      }
    } catch (error) {
      console.error("Failed to load cart from localStorage:", error);

      localStorage.removeItem(CART_STORAGE_KEY);
    } finally {
      setCartLoaded(true);
    }
  }, []);

  /**
   * Re-prices the cart with today's products. A saved cart keeps the prices
   * from when each item was added, and checkout would otherwise show a total
   * the server no longer charges.
   */
  const refreshCartPrices = useCallback(async () => {
    const sent = cartRef.current;
    if (sent.length === 0) return;

    const fresh = await refreshCart(toSecureCart(sent)).catch(() => null);
    if (!fresh) return;

    // Applied to the cart as it is now: items may have changed meanwhile.
    setCart((current) => applyCartRefresh(current, sent, fresh).cart);
    const { removed, repriced } = applyCartRefresh(sent, sent, fresh);
    announceCartRefresh(removed, repriced, textRef.current);
  }, []);

  // Once per visit, as soon as the saved cart is loaded.
  useEffect(() => {
    if (cartLoaded) void refreshCartPrices();
  }, [cartLoaded, refreshCartPrices]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!cartLoaded) return;

    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error("Failed to save cart to localStorage:", error);
    }
  }, [cart, cartLoaded]);

  const { totalItems, cartPrice } = cartTotals(cart);

  const {
    shippingFees,
    shippingFeesLoading,
    shippingFeesError,
    retryShippingFees,
  } = useShippingFees({
    cartPrice,
    paymentMethod,
    cityName,
    errorMessage: t.checkout.shippingError,
  });

  /** Adds one unit. The result says whether it was added or why not. */
  function addItem(item: Item): AddItemResult {
    const { result } = addToCart(cart, item);
    if (result === "added") {
      setCart((prevCart) => addToCart(prevCart, item).cart);
    }
    return result;
  }

  function removeItem(itemID: string) {
    setCart((prevCart) => prevCart.filter((item) => item.itemID !== itemID));
  }

  function increaseQuantity(itemID: string) {
    setCart((prevCart) => changeQuantity(prevCart, itemID, 1));
  }

  function decreaseQuantity(itemID: string) {
    setCart((prevCart) => changeQuantity(prevCart, itemID, -1));
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
        refreshCartPrices,

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

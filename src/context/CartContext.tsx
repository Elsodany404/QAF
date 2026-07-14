import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { Product, WeightOption } from '../lib/database.types';

export interface CartItem {
  product: Product;
  quantity: number;
  selectedWeight: WeightOption | null;
  linePrice: number;
}

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  isOpen: boolean;
  addItem: (product: Product, weight: WeightOption | null) => void;
  removeItem: (productId: string, weightLabel: string | null) => void;
  updateQuantity: (productId: string, weightLabel: string | null, qty: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function makeKey(productId: string, weightLabel: string | null) {
  return `${productId}::${weightLabel ?? 'default'}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const addItem = useCallback((product: Product, weight: WeightOption | null) => {
    const key = makeKey(product.id, weight?.label ?? null);
    setItems(prev => {
      const existing = prev.find(i => makeKey(i.product.id, i.selectedWeight?.label ?? null) === key);
      const unitPrice = product.price + (weight?.price_modifier ?? 0);
      if (existing) {
        return prev.map(i =>
          makeKey(i.product.id, i.selectedWeight?.label ?? null) === key
            ? { ...i, quantity: i.quantity + 1, linePrice: (i.quantity + 1) * unitPrice }
            : i
        );
      }
      return [...prev, { product, quantity: 1, selectedWeight: weight, linePrice: unitPrice }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((productId: string, weightLabel: string | null) => {
    const key = makeKey(productId, weightLabel);
    setItems(prev => prev.filter(i => makeKey(i.product.id, i.selectedWeight?.label ?? null) !== key));
  }, []);

  const updateQuantity = useCallback((productId: string, weightLabel: string | null, qty: number) => {
    const key = makeKey(productId, weightLabel);
    if (qty <= 0) {
      setItems(prev => prev.filter(i => makeKey(i.product.id, i.selectedWeight?.label ?? null) !== key));
      return;
    }
    setItems(prev =>
      prev.map(i => {
        if (makeKey(i.product.id, i.selectedWeight?.label ?? null) !== key) return i;
        const unitPrice = i.product.price + (i.selectedWeight?.price_modifier ?? 0);
        return { ...i, quantity: qty, linePrice: qty * unitPrice };
      })
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.linePrice, 0);

  return (
    <CartContext.Provider value={{ items, totalItems, totalPrice, isOpen, addItem, removeItem, updateQuantity, clearCart, openCart, closeCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}

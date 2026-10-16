"use client";

import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eraser,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";

import { useCart } from "@/context/CartContext";
import { useDialog } from "@/hooks/useDialog";
import { MAX_QUANTITY_PER_ITEM } from "@/utils/cartLimits";
import { formatCurrency } from "@/utils/helper";
import styles from "./CartDrawer.module.css";

export default function CartDrawer() {
  const router = useRouter();
  const {
    cart,
    open,
    closeCart,
    removeItem,
    increaseQuantity,
    decreaseQuantity,
    cartPrice,
    totalItems,
    clearCart,
  } = useCart();
  const drawerRef = useDialog<HTMLDivElement>(open, closeCart);

  return (
    <>
      {open && (
        <div
          className={styles.overlay}
          onClick={closeCart}
          aria-hidden="true"
        />
      )}

      <div
        ref={drawerRef}
        className={`${styles.drawer} ${open ? styles.open : styles.closed}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        tabIndex={-1}
        // Off-screen: keep it out of the tab order and accessibility tree.
        inert={!open}
      >
        <div className={styles.header}>
          <div className={styles.titleWrap}>
            <div className={styles.iconWrap}>
              <ShoppingBag aria-hidden="true" />
            </div>
            <h2 id="cart-drawer-title" className={styles.title}>
              Cart
              {totalItems > 0 && (
                <span className={styles.count}>({totalItems})</span>
              )}
            </h2>
          </div>

          <button
            type="button"
            onClick={closeCart}
            className={styles.closeButton}
            aria-label="Close cart"
          >
            <X aria-hidden="true" />
          </button>
        </div>

        <div className={styles.body}>
          {totalItems === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <ShoppingBag aria-hidden="true" />
              </div>
              <p className={styles.emptyTitle}>Cart is empty</p>
              <p className={styles.emptyText}>
                Start adding some premium coffee!
              </p>
              <button
                type="button"
                onClick={closeCart}
                className={styles.emptyButton}
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.itemID} className={styles.itemCard}>
                <div className={styles.itemRow}>
                  <p className={styles.itemName}>{item.product.name}</p>
                  <div className={styles.itemOptions}>
                    {item.options.map((option) => (
                      <span key={option.optionID}>{option.label}</span>
                    ))}
                  </div>
                  <p className={styles.itemPrice}>
                    {formatCurrency(item.itemPrice)}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeItem(item.itemID)}
                    className={styles.removeButton}
                    aria-label={`Remove ${item.product.name} from the cart`}
                  >
                    <Trash2 aria-hidden="true" />
                  </button>
                </div>

                <div className={styles.quantityRow}>
                  <button
                    type="button"
                    onClick={() => decreaseQuantity(item.itemID)}
                    className={styles.qtyButton}
                    aria-label={`Decrease quantity of ${item.product.name}`}
                  >
                    <Minus aria-hidden="true" />
                  </button>
                  <span className={styles.qtyValue} aria-live="polite">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => increaseQuantity(item.itemID)}
                    className={styles.qtyButton}
                    disabled={item.quantity >= MAX_QUANTITY_PER_ITEM}
                    aria-label={`Increase quantity of ${item.product.name}`}
                  >
                    <Plus aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {totalItems > 0 && (
          <div className={styles.footer}>
            <div className={styles.subtotalRow}>
              <span className={styles.subtotalLabel}>Subtotal</span>
              <span className={styles.subtotalValue}>
                {formatCurrency(cartPrice)}
              </span>
            </div>
            <p className={styles.helperText}>Shipping calculated at checkout</p>
            <div className={styles.footerButtons}>
              <button
                type="button"
                onClick={() => {
                  clearCart();
                  setTimeout(closeCart, 300);
                }}
                className={styles.clearButton}
              >
                Clear Cart
                <Eraser size={20} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => {
                  closeCart();
                  router.push("/checkout");
                }}
                className={styles.checkoutButton}
              >
                Checkout
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

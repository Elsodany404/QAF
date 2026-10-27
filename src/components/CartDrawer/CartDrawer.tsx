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
import { productName, valueLabel } from "@/i18n/catalog";
import { format } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import { MAX_QUANTITY_PER_ITEM } from "@/utils/cartLimits";
import { formatCurrency } from "@/utils/helper";
import styles from "./CartDrawer.module.css";

export default function CartDrawer() {
  const router = useRouter();
  const { locale, t, href } = useI18n();
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
              {t.cart.title}
              {totalItems > 0 && (
                <span className={styles.count}>({totalItems})</span>
              )}
            </h2>
          </div>

          <button
            type="button"
            onClick={closeCart}
            className={styles.closeButton}
            aria-label={t.cart.close}
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
              <p className={styles.emptyTitle}>{t.cart.emptyTitle}</p>
              <p className={styles.emptyText}>{t.cart.emptyText}</p>
              <button
                type="button"
                onClick={closeCart}
                className={styles.emptyButton}
              >
                {t.cart.continueShopping}
              </button>
            </div>
          ) : (
            cart.map((item) => {
              const name = productName(item.product, locale);
              return (
                <div key={item.itemID} className={styles.itemCard}>
                  <div className={styles.itemRow}>
                    <p className={styles.itemName}>{name}</p>
                    <div className={styles.itemOptions}>
                      {item.options.map((option) => (
                        <span key={option.optionID}>
                          {valueLabel(option, locale)}
                        </span>
                      ))}
                    </div>
                    <p className={styles.itemPrice}>
                      {formatCurrency(item.itemPrice, locale)}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeItem(item.itemID)}
                      className={styles.removeButton}
                      aria-label={format(t.cart.remove, { name })}
                    >
                      <Trash2 aria-hidden="true" />
                    </button>
                  </div>

                  <div className={styles.quantityRow}>
                    <button
                      type="button"
                      onClick={() => decreaseQuantity(item.itemID)}
                      className={styles.qtyButton}
                      aria-label={format(t.cart.decrease, { name })}
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
                      aria-label={format(t.cart.increase, { name })}
                    >
                      <Plus aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {totalItems > 0 && (
          <div className={styles.footer}>
            <div className={styles.subtotalRow}>
              <span className={styles.subtotalLabel}>{t.cart.subtotal}</span>
              <span className={styles.subtotalValue}>
                {formatCurrency(cartPrice, locale)}
              </span>
            </div>
            <p className={styles.helperText}>{t.cart.shippingNote}</p>
            <div className={styles.footerButtons}>
              <button
                type="button"
                onClick={() => {
                  clearCart();
                  setTimeout(closeCart, 300);
                }}
                className={styles.clearButton}
              >
                {t.cart.clear}
                <Eraser size={20} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => {
                  closeCart();
                  router.push(href("/checkout"));
                }}
                className={styles.checkoutButton}
              >
                {t.cart.checkout}
                <ArrowRight size={16} className="flipRtl" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

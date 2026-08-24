"use client"
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "../../context/CartContext";
import styles from "./CartDrawer.module.css";
import { formatCurrency } from "../../helper/helper";
import { useRouter } from "next/navigation";

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
  } = useCart();

  return (
    <>
      {open && <div className={styles.overlay} onClick={closeCart} />}

      <div className={`${styles.drawer} ${open ? styles.open : styles.closed}`}>
        <div className={styles.header}>
          <div className={styles.titleWrap}>
            <div className={styles.iconWrap}>
              <ShoppingBag />
            </div>
            <h2 className={styles.title}>
              Cart
              {totalItems > 0 && (
                <span className={styles.count}>({totalItems})</span>
              )}
            </h2>
          </div>
          <button onClick={closeCart} className={styles.closeButton}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className={styles.body}>
          {totalItems === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <ShoppingBag />
              </div>
              <p className={styles.emptyTitle}>Cart is empty</p>
              <p className={styles.emptyText}>
                Start adding some premium coffee!
              </p>
              <button onClick={closeCart} className={styles.emptyButton}>
                Continue Shopping
              </button>
            </div>
          ) : (
            cart.map((item) => {
              const key = `${item.product.id}`;
              const product = item.product;
              const options = item.options;

              return (
                <div key={key} className={styles.itemCard}>
                  <div className={styles.itemRow}>
                    <p className={styles.itemName}>{product.name}</p>
                    <div className={styles.itemOptions}>
                      {options.map((op) => (
                        <span key={op.optionID}>{op.label}</span>
                      ))}
                    </div>
                    <p className={styles.itemPrice}>
                      {formatCurrency(item.itemPrice)}
                    </p>
                    <button
                      onClick={() => removeItem(item.itemID)}
                      className={styles.removeButton}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className={styles.quantityRow}>
                    <button
                      onClick={() => decreaseQuantity(item.itemID)}
                      className={styles.qtyButton}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className={styles.qtyValue}>{item.quantity}</span>
                    <button
                      onClick={() => increaseQuantity(item.itemID)}
                      className={styles.qtyButton}
                    >
                      <Plus className="w-3 h-3" />
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
              <span className={styles.subtotalLabel}>Subtotal</span>
              <span className={styles.subtotalValue}>
                {formatCurrency(cartPrice)}
              </span>
            </div>
            <p className={styles.helperText}>Shipping & taxes at checkout</p>
            <button
              onClick={() => {
                closeCart();
                router.push("/checkout");
              }}
              className={styles.checkoutButton}
            >
              Checkout
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}

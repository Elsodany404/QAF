import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "../../context/CartContext";
import styles from "./CartDrawer.module.css";

export default function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    totalPrice,
    totalItems,
  } = useCart();

  return (
    <>
      {isOpen && <div className={styles.overlay} onClick={closeCart} />}

      <div
        className={`${styles.drawer} ${isOpen ? styles.open : styles.closed}`}
      >
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
          {items.length === 0 ? (
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
            items.map((item) => {
              const key = `${item.product.id}::${item.selectedWeight?.label ?? "default"}`;
              return (
                <div key={key} className={styles.itemCard}>
                  <div className={styles.itemRow}>
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className={styles.itemImage}
                    />
                    <div className={styles.itemDetails}>
                      <p className={styles.itemName}>{item.product.name}</p>
                      {item.selectedWeight && (
                        <p className={styles.itemWeight}>
                          {item.selectedWeight.label}
                        </p>
                      )}
                      <p className={styles.itemPrice}>
                        ${item.linePrice.toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        removeItem(
                          item.product.id,
                          item.selectedWeight?.label ?? null,
                        )
                      }
                      className={styles.removeButton}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className={styles.quantityRow}>
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.product.id,
                          item.selectedWeight?.label ?? null,
                          item.quantity - 1,
                        )
                      }
                      className={styles.qtyButton}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className={styles.qtyValue}>{item.quantity}</span>
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.product.id,
                          item.selectedWeight?.label ?? null,
                          item.quantity + 1,
                        )
                      }
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

        {items.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.subtotalRow}>
              <span className={styles.subtotalLabel}>Subtotal</span>
              <span className={styles.subtotalValue}>
                ${totalPrice.toFixed(2)}
              </span>
            </div>
            <p className={styles.helperText}>Shipping & taxes at checkout</p>
            <button
              onClick={() => {
                closeCart();
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

import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Your Cart",
};

function EmptyCart() {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        <ShoppingBag aria-hidden="true" />
      </div>
      <h1 className={styles.emptyTitle}>Your cart is empty</h1>
      <p className={styles.emptyText}>
        Add some premium coffee before checking out.
      </p>
      <Link className={styles.emptyButton} href="/menu">
        Browse Products
      </Link>
    </div>
  );
}

export default EmptyCart;

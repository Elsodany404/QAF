import { ShoppingBag } from 'lucide-react';
import styles from './page.module.css';
import Link from 'next/link';
function EmptyCart() {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        <ShoppingBag className="w-10 h-10" />
      </div>
      <h2 className={styles.emptyTitle}>Cart is empty</h2>
      <p className={styles.emptyText}>
        Add some premium coffee before checking out.
      </p>
      <Link className={styles.emptyButton} href={"/menu"}>
        Browse Products
      </Link>
    </div>
  );
}

export default EmptyCart;

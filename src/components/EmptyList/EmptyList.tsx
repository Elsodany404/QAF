import { SlidersHorizontal } from "lucide-react";
import styles from "./EmptyList.module.css";

function EmptyList({ handler }: { handler?: () => void }) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        <SlidersHorizontal />
      </div>
      <p className={styles.emptyTitle}>No coffee found</p>
      <p className={styles.emptyText}>Try adjusting your filters or search</p>
      <button onClick={handler} className={styles.resetButton}>
        View all product
      </button>
    </div>
  );
}

export default EmptyList;

"use client";
import { SlidersHorizontal } from "lucide-react";
import styles from "./EmptyList.module.css";
import useMenuFilters from "@/hooks/useMenuFilters";

function EmptyList() {
  const { resetFilters } = useMenuFilters();
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        <SlidersHorizontal aria-hidden="true" />
      </div>
      <p className={styles.emptyTitle}>No coffee found</p>
      <p className={styles.emptyText}>Try adjusting your filters or search</p>
      <button
        type="button"
        onClick={resetFilters}
        className={styles.resetButton}
      >
        Reset filters
      </button>
    </div>
  );
}

export default EmptyList;

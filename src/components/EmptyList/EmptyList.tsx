"use client"
import { SlidersHorizontal } from "lucide-react";
import styles from "./EmptyList.module.css";
import useParams from "@/hooks/useParams";

function EmptyList() {
  const { resetFilters } = useParams();
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        <SlidersHorizontal />
      </div>
      <p className={styles.emptyTitle}>No coffee found</p>
      <p className={styles.emptyText}>Try adjusting your filters or search</p>
      <button onClick={resetFilters} className={styles.resetButton}>
        Reset filters
      </button>
    </div>
  );
}

export default EmptyList;

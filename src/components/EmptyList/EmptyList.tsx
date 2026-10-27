"use client";
import { SlidersHorizontal } from "lucide-react";
import styles from "./EmptyList.module.css";
import useMenuFilters from "@/hooks/useMenuFilters";
import { useI18n } from "@/i18n/I18nProvider";

function EmptyList() {
  const { t } = useI18n();
  const { resetFilters } = useMenuFilters();
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        <SlidersHorizontal aria-hidden="true" />
      </div>
      <p className={styles.emptyTitle}>{t.menu.emptyTitle}</p>
      <p className={styles.emptyText}>{t.menu.emptyText}</p>
      <button
        type="button"
        onClick={resetFilters}
        className={styles.resetButton}
      >
        {t.menu.resetFilters}
      </button>
    </div>
  );
}

export default EmptyList;

import type { Metadata } from "next";
import Link from "@/i18n/Link";
import { getI18n } from "@/i18n/server";
import { ShoppingBag } from "lucide-react";
import styles from "./page.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.emptyCart.metaTitle };
}

async function EmptyCart() {
  const { t } = await getI18n();
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        <ShoppingBag aria-hidden="true" />
      </div>
      <h1 className={styles.emptyTitle}>{t.emptyCart.title}</h1>
      <p className={styles.emptyText}>{t.emptyCart.text}</p>
      <Link className={styles.emptyButton} href="/menu">
        {t.emptyCart.browse}
      </Link>
    </div>
  );
}

export default EmptyCart;

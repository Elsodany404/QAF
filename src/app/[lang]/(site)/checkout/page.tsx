import type { Metadata } from "next";
import Link from "@/i18n/Link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import Form from "@/components/Form/Form";
import OrderSummary from "@/components/OrderSummary/OrderSummary";
import { getI18n } from "@/i18n/server";
import { getCurrentSession } from "@/lib/adminAccess";
import { signInPath } from "@/lib/redirect";
import styles from "./page.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.checkout.metaTitle };
}

export default async function Checkout() {
  const [session, { locale, t }] = await Promise.all([
    getCurrentSession(),
    getI18n(),
  ]);
  if (!session) {
    redirect(signInPath("/checkout", locale));
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link href="/menu" className={styles.backButton}>
          <ArrowLeft size={20} className="flipRtl" aria-hidden="true" />
          {t.checkout.back}
        </Link>

        <h1 className={styles.title}>{t.checkout.title}</h1>

        <div className={styles.grid}>
          <OrderSummary />
          <Form />
        </div>
      </div>
    </div>
  );
}

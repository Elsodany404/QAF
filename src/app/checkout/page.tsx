import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import Form from "@/components/Form/Form";
import OrderSummary from "@/components/OrderSummary/OrderSummary";
import TestBuildNotice from "@/components/TestBuildNotice/TestBuildNotice";
import { getCurrentSession } from "@/lib/adminAccess";
import { signInPath } from "@/lib/redirect";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Checkout",
};

export default async function Checkout() {
  const session = await getCurrentSession();
  if (!session) {
    redirect(signInPath("/checkout"));
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link href="/menu" className={styles.backButton}>
          <ArrowLeft size={20} aria-hidden="true" />
          Back to Shopping
        </Link>

        <TestBuildNotice>
          Ordering is turned off. You can fill in the whole checkout, but
          placing the order won&apos;t create it, charge you or send a courier.
        </TestBuildNotice>

        <h1 className={styles.title}>Checkout</h1>

        <div className={styles.grid}>
          <OrderSummary />
          <Form />
        </div>
      </div>
    </div>
  );
}

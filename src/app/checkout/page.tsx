import styles from "./page.module.css";
import { signInPath } from "@/lib/redirect";
import { ArrowLeft } from "lucide-react";
import OrderSummery from "@/components/OrderSummery/OrderSummery";
import Form from "@/components/Form/Form";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Checkout() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect(signInPath("/checkout"));
  }
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link href="/menu" className={styles.backButton}>
          <ArrowLeft className="w-5 h-5" />
          Back to Shopping
        </Link>

        <h1 className={styles.title}>Checkout</h1>

        <div className={styles.grid}>
          <OrderSummery />
          <Form />
        </div>
      </div>
    </div>
  );
}

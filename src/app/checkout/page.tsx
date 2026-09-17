import styles from "./page.module.css";
import { ArrowLeft } from "lucide-react";
import OrderSummery from "@/components/OrderSummery/OrderSummery";
import Form from "@/components/Form/Form";
import Link from "next/link";

export default function Checkout() {
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

"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CreditCard, X } from "lucide-react";

import { cancelOrder } from "@/actions/order/cancelOrder";
import { payOrder } from "@/actions/order/payOrder";
import { formatOrderNumber } from "@/lib/orderStatus";
import styles from "./OrdersList.module.css";

export function CancelOrderButton({ orderID }: { orderID: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleCancel() {
    if (!window.confirm(`Cancel order ${formatOrderNumber(orderID)}?`)) return;

    startTransition(async () => {
      const result = await cancelOrder(orderID);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(
        typeof result.data === "string" ? result.data : "Order cancelled",
      );
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      className={styles.cancelButton}
      onClick={handleCancel}
      disabled={isPending}
    >
      <X aria-hidden="true" />
      {isPending ? "Cancelling…" : "Cancel order"}
    </button>
  );
}

export function PayOrderButton({ orderID }: { orderID: number }) {
  const [isPending, startTransition] = useTransition();

  function handlePay() {
    startTransition(async () => {
      const result = await payOrder(orderID);
      if (!result.success || typeof result.data !== "string") {
        toast.error(result.success ? "Could not start payment" : result.error);
        return;
      }
      window.location.assign(result.data);
    });
  }

  return (
    <button
      type="button"
      className={styles.payButton}
      onClick={handlePay}
      disabled={isPending}
    >
      <CreditCard aria-hidden="true" />
      {isPending ? "Redirecting…" : "Complete payment"}
    </button>
  );
}

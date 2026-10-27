"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CreditCard, X } from "lucide-react";

import { cancelOrder } from "@/actions/order/cancelOrder";
import { payOrder } from "@/actions/order/payOrder";
import { format } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import { formatOrderNumber } from "@/lib/orderStatus";
import styles from "./OrdersList.module.css";

export function CancelOrderButton({ orderID }: { orderID: number }) {
  const router = useRouter();
  const { t } = useI18n();
  const text = t.orderActions;
  const [isPending, startTransition] = useTransition();

  function handleCancel() {
    const question = format(text.confirmCancel, {
      number: formatOrderNumber(orderID),
    });
    if (!window.confirm(question)) return;

    startTransition(async () => {
      const result = await cancelOrder(orderID);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(
        typeof result.data === "string" ? result.data : text.cancelled,
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
      {isPending ? text.cancelling : text.cancel}
    </button>
  );
}

export function PayOrderButton({ orderID }: { orderID: number }) {
  const { t } = useI18n();
  const text = t.orderActions;
  const [isPending, startTransition] = useTransition();

  function handlePay() {
    startTransition(async () => {
      const result = await payOrder(orderID);
      if (!result.success || typeof result.data !== "string") {
        toast.error(result.success ? text.paymentFailed : result.error);
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
      {isPending ? text.redirecting : text.pay}
    </button>
  );
}

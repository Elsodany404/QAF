"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CreditCard, RotateCcw, X } from "lucide-react";

import { cancelOrder } from "@/actions/order/cancelOrder";
import { payOrder } from "@/actions/order/payOrder";
import { requestReturn } from "@/actions/order/requestReturn";
import {
  formatOrderNumber,
  RETURN_REASON_MAX_LENGTH,
  RETURN_REASON_MIN_LENGTH,
} from "@/lib/orderStatus";
import styles from "./OrdersList.module.css";

export function CancelOrderButton({
  orderID,
  willRefund,
}: {
  orderID: number;
  willRefund: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleCancel() {
    const message = `Cancel order ${formatOrderNumber(orderID)}?${
      willRefund ? " Your payment will be refunded to the original method." : ""
    }`;
    if (!window.confirm(message)) return;

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

/** Asks for a return of a delivered order, with the customer's reason. */
export function RequestReturnButton({ orderID }: { orderID: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  if (!open) {
    return (
      <button
        type="button"
        className={styles.returnButton}
        onClick={() => setOpen(true)}
      >
        <RotateCcw aria-hidden="true" /> Request a return
      </button>
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (reason.trim().length < RETURN_REASON_MIN_LENGTH) {
      toast.error("Please tell us why you're returning the order");
      return;
    }

    startTransition(async () => {
      const result = await requestReturn(orderID, reason);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(
        typeof result.data === "string" ? result.data : "Return requested",
      );
      setOpen(false);
      router.refresh();
    });
  }

  const fieldID = `return-reason-${orderID}`;

  return (
    <form className={styles.returnForm} onSubmit={handleSubmit}>
      <label htmlFor={fieldID} className={styles.returnLabel}>
        Why are you returning order {formatOrderNumber(orderID)}?
      </label>
      <textarea
        id={fieldID}
        className={styles.returnReason}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        minLength={RETURN_REASON_MIN_LENGTH}
        maxLength={RETURN_REASON_MAX_LENGTH}
        rows={3}
        placeholder="e.g. The bag arrived torn"
        required
      />
      <p className={styles.returnHint}>
        Once we approve it, a Bosta courier collects the items from your address
        and refunds you in cash.
      </p>
      <div className={styles.returnFormActions}>
        <button type="submit" className={styles.payButton} disabled={isPending}>
          {isPending ? "Sending…" : "Send request"}
        </button>
        <button
          type="button"
          className={styles.returnButton}
          onClick={() => setOpen(false)}
          disabled={isPending}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

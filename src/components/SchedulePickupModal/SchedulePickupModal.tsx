"use client";

import { useState, useTransition } from "react";
import { AlertCircle, Calendar, CheckCircle2, Truck, X } from "lucide-react";
import { createPickup } from "@/actions/dashboard/createPickup";
import { useDialog } from "@/hooks/useDialog";
import { todayInEgypt } from "@/lib/egyptDate";
import styles from "./SchedulePickupModal.module.css";

interface Props {
  onClose: () => void;
}

export default function SchedulePickupModal({ onClose }: Props) {
  const dialogRef = useDialog<HTMLDivElement>(true, onClose);
  // Same calendar day the server checks against.
  const [date, setDate] = useState(() => todayInEgypt());
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
    pickupID?: string;
  } | null>(null);

  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);

    startTransition(async () => {
      const res = await createPickup(date);
      if (res.status === "success") {
        setResult({
          type: "success",
          message: res.message,
          pickupID: res.pickupID,
        });
      } else {
        setResult({ type: "error", message: res.message });
      }
    });
  }

  // Minimum date = today
  const todayISO = todayInEgypt();

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        ref={dialogRef}
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pickup-title"
        tabIndex={-1}
      >
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.icon}>
              <Truck aria-hidden="true" />
            </span>
            <h2 id="pickup-title" className={styles.title}>
              Schedule Pickup
            </h2>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <X aria-hidden="true" />
          </button>
        </div>

        {result ? (
          <div
            className={
              result.type === "success" ? styles.successBox : styles.errorBox
            }
          >
            {result.type === "success" ? (
              <CheckCircle2 className={styles.resultIcon} />
            ) : (
              <AlertCircle className={styles.resultIcon} />
            )}
            <div>
              <p className={styles.resultMsg}>{result.message}</p>
              {result.pickupID && (
                <p className={styles.resultMeta}>
                  Pickup ID: <code>{result.pickupID}</code>
                </p>
              )}
            </div>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.label} htmlFor="pickup-date">
              <Calendar className={styles.inputIcon} aria-hidden="true" />
              <span>Pickup date</span>
            </label>
            <input
              id="pickup-date"
              type="date"
              className={styles.dateInput}
              value={date}
              min={todayISO}
              onChange={(e) => setDate(e.target.value)}
              required
            />

            <p className={styles.hint}>
              Bosta will collect parcels from your warehouse on this date.
            </p>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={isPending}
              >
                {isPending ? "Scheduling…" : "Schedule Pickup"}
              </button>
            </div>
          </form>
        )}

        {result?.type === "success" && (
          <div className={styles.doneActions}>
            <button
              type="button"
              className={styles.closeBtn2}
              onClick={onClose}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

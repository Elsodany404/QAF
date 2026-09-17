"use client";

import { useState, useTransition } from "react";
import { X, Truck, Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import { createPickup } from "@/actions/createPickup";
import styles from "./SchedulePickupModal.module.css";

interface Props {
  onClose: () => void;
}

export default function SchedulePickupModal({ onClose }: Props) {
  const [date, setDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
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
  const todayISO = new Date().toISOString().split("T")[0];

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.icon}>
              <Truck />
            </span>
            <h2 className={styles.title}>Schedule Pickup</h2>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <X />
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
            <label className={styles.label}>
              <Calendar className={styles.inputIcon} />
              <span>Pickup date</span>
            </label>
            <input
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
            <button type="button" className={styles.closeBtn2} onClick={onClose}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


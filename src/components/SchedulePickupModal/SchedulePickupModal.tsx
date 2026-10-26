"use client";

import { useState, useTransition } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Calendar, CheckCircle2, Truck, X } from "lucide-react";
import { createPickup, getPickupDates } from "@/actions/dashboard/createPickup";
import { useDialog } from "@/hooks/useDialog";
import {
  formatISODate,
  todayInEgypt,
  weekdayOfISODate,
} from "@/lib/egyptDate";
import styles from "./SchedulePickupModal.module.css";

interface Props {
  onClose: () => void;
}

const FRIDAY = 5;

export default function SchedulePickupModal({ onClose }: Props) {
  const dialogRef = useDialog<HTMLDivElement>(true, onClose);
  // Same calendar day the server checks against.
  const today = todayInEgypt();

  // The days Bosta can come, so only a date it accepts can be picked.
  const {
    data: pickupDates,
    isPending: datesLoading,
    isError: datesFailed,
  } = useQuery({
    queryKey: ["pickup-dates"],
    queryFn: () => getPickupDates(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  const offered = pickupDates && pickupDates.length > 0 ? pickupDates : null;

  // Until the admin picks a day, the soonest one Bosta offers.
  const [pickedDate, setPickedDate] = useState<string | null>(null);
  // Without Bosta's calendar, a free date input.
  const [typedDate, setTypedDate] = useState(today);
  const date = offered
    ? pickedDate && offered.includes(pickedDate)
      ? pickedDate
      : offered[0]
    : typedDate;
  const isFriday = !offered && weekdayOfISODate(date) === FRIDAY;

  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
    pickupID?: string | null;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isFriday) return;
    setResult(null);

    startTransition(async () => {
      const res = await createPickup(date);
      setResult(
        res.status === "success"
          ? { type: "success", message: res.message, pickupID: res.pickupID }
          : { type: "error", message: res.message },
      );
    });
  }

  const done = result?.type === "success";

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

        {result && (
          <div
            className={
              result.type === "success" ? styles.successBox : styles.errorBox
            }
            role={result.type === "success" ? "status" : "alert"}
          >
            {result.type === "success" ? (
              <CheckCircle2 className={styles.resultIcon} aria-hidden="true" />
            ) : (
              <AlertCircle className={styles.resultIcon} aria-hidden="true" />
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
        )}

        {!done && (
          <form className={styles.form} onSubmit={handleSubmit}>
            {datesLoading ? (
              <p className={styles.hint} role="status">
                Checking which days Bosta can come…
              </p>
            ) : offered ? (
              <fieldset className={styles.dateFieldset}>
                <legend className={styles.label}>
                  <Calendar className={styles.inputIcon} aria-hidden="true" />
                  <span>Pickup date</span>
                </legend>
                <div className={styles.dateGrid}>
                  {offered.map((day) => (
                    <label key={day} className={styles.dateChoice}>
                      <input
                        type="radio"
                        name="pickup-date"
                        value={day}
                        checked={day === date}
                        onChange={() => setPickedDate(day)}
                      />
                      <span>
                        {formatISODate(day)}
                        {day === today && (
                          <small className={styles.dateNote}>Today</small>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : (
              <>
                <label className={styles.label} htmlFor="pickup-date">
                  <Calendar className={styles.inputIcon} aria-hidden="true" />
                  <span>Pickup date</span>
                </label>
                <input
                  id="pickup-date"
                  type="date"
                  className={styles.dateInput}
                  value={typedDate}
                  min={today}
                  onChange={(e) => setTypedDate(e.target.value)}
                  aria-invalid={isFriday}
                  aria-describedby="pickup-date-hint"
                  required
                />
                <p
                  id="pickup-date-hint"
                  className={isFriday ? styles.fieldError : styles.hint}
                >
                  {isFriday
                    ? "Bosta doesn't collect on Fridays. Choose another day."
                    : datesFailed
                      ? "Bosta's calendar couldn't be loaded. It doesn't collect on Fridays or public holidays."
                      : "Bosta has no pickup days available right now."}
                </p>
              </>
            )}

            <p className={styles.hint}>
              Bosta collects every order that is ready for the courier from
              your warehouse on this day.
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
                disabled={isPending || datesLoading || isFriday}
              >
                {isPending ? "Scheduling…" : "Schedule Pickup"}
              </button>
            </div>
          </form>
        )}

        {done && (
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

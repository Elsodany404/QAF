"use client";

import {
  AlertCircle,
  CheckCircle2,
  Info,
  LoaderCircle,
  X,
  type LucideIcon,
} from "lucide-react";
import toast, { resolveValue, ToastBar, type Toast } from "react-hot-toast";

import styles from "./Toast.module.css";

const TONES: Record<Toast["type"], { Icon: LucideIcon; tone: string }> = {
  success: { Icon: CheckCircle2, tone: styles.success },
  error: { Icon: AlertCircle, tone: styles.error },
  loading: { Icon: LoaderCircle, tone: styles.loading },
  blank: { Icon: Info, tone: styles.info },
  custom: { Icon: Info, tone: styles.info },
};

/**
 * One toast in the site's card style: a tinted icon tile for the tone, the
 * message, and a close button. ToastBar keeps the library's enter and exit
 * animation; its own box is reset so only this card shows.
 */
export default function ToastCard({ t }: { t: Toast }) {
  const { Icon, tone } = TONES[t.type];

  return (
    <ToastBar toast={t} style={{ ...t.style, ...BAR_RESET }}>
      {() => (
        <div className={`${styles.toast} ${tone}`}>
          <span className={styles.iconTile} aria-hidden="true">
            {t.icon ?? <Icon className={styles.icon} />}
          </span>
          <p className={styles.message}>{resolveValue(t.message, t)}</p>
          {t.type !== "loading" && (
            <button
              type="button"
              className={styles.close}
              onClick={() => toast.dismiss(t.id)}
              aria-label="Dismiss notification"
            >
              <X aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </ToastBar>
  );
}

const BAR_RESET: React.CSSProperties = {
  maxWidth: "none",
  padding: 0,
  background: "transparent",
  boxShadow: "none",
  borderRadius: 0,
};

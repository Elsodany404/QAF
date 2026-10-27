"use client";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { format } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import styles from "./error.module.css";

interface ErrorProps {
  error?: Error & { digest?: string };
  // Re-fetches the failed segment; reset() would only re-render it.
  retry?: () => void;
}

export default function ErrorPage({ error, retry }: ErrorProps) {
  const { t } = useI18n();
  const text = t.errorPage;

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.iconContainer}>
          <AlertCircle className={styles.icon} strokeWidth={1.5} />
        </div>

        <h1 className={styles.title}>{text.title}</h1>
        <p className={styles.description}>{text.text}</p>

        {/* Stack traces can leak internals; only show them in development.
            In production the digest lets you find the error in server logs. */}
        {error && process.env.NODE_ENV === "development" ? (
          <div className={styles.errorDetails}>
            <p className={styles.errorLabel}>{text.details}</p>
            <pre className={styles.errorMessage}>{error.name}</pre>
            <pre className={styles.errorMessage}>{error.message}</pre>
            <pre className={styles.errorMessage}>{error.stack}</pre>
          </div>
        ) : error?.digest ? (
          <p className={styles.errorLabel}>
            {format(text.reference, { digest: error.digest })}
          </p>
        ) : null}

        <div className={styles.actions}>
          {retry && (
            <button onClick={() => retry()} className={styles.btnPrimary}>
              <RefreshCcw size={18} />
              {text.tryAgain}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

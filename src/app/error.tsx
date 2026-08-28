"use client"
import { AlertCircle, RefreshCcw } from "lucide-react";
import styles from "./error.module.css";

interface ErrorProps {
  error?: Error;
  reset?: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.iconContainer}>
          <AlertCircle className={styles.icon} strokeWidth={1.5} />
        </div>

        <h1 className={styles.title}>Something went wrong</h1>
        <p className={styles.description}>
          We could not quite perfect this brew. Our servers encountered an
          unexpected issue while loading this page.
        </p>

        {error && (
          <div className={styles.errorDetails}>
            <p className={styles.errorLabel}>Error details:</p>
            <pre className={styles.errorMessage}>{error.name}</pre>
            <pre className={styles.errorMessage}>{error.message}</pre>
            <pre className={styles.errorMessage}>{error.stack}</pre>
          </div>
        )}

        <div className={styles.actions}>
          {reset && (
            <button onClick={reset} className={styles.btnPrimary}>
              <RefreshCcw size={18} />
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

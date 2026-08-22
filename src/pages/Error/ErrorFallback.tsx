import { AlertCircle, RefreshCcw, Home } from "lucide-react";
import styles from "./ErrorFallback.module.css";

interface ErrorFallbackProps {
  error?: Error;
  resetErrorBoundary?: () => void;
}

export default function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.iconContainer}>
          <AlertCircle className={styles.icon} strokeWidth={1.5} />
        </div>
        
        <h1 className={styles.title}>Something went wrong</h1>
        <p className={styles.description}>
          We couldn't quite perfect this brew. Our servers encountered an unexpected issue while loading this page.
        </p>

        {error && (
          <div className={styles.errorDetails}>
            <p className={styles.errorLabel}>Error details:</p>
            <pre className={styles.errorMessage}>{error.message}</pre>
          </div>
        )}

        <div className={styles.actions}>
          {resetErrorBoundary && (
            <button onClick={resetErrorBoundary} className={styles.btnPrimary}>
              <RefreshCcw size={18} />
              Try Again
            </button>
          )}
          <button 
            onClick={() => window.location.assign('/')} 
            className={styles.btnSecondary}
          >
            <Home size={18} />
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
}
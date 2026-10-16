import styles from "./Spinner.module.css";

type SpinnerProps = {
  variant?: "page" | "component";
  size?: "sm" | "md" | "lg";
  /** Announced to screen readers. */
  label?: string;
};

export default function Spinner({
  variant = "component",
  size = "md",
  label = "Loading",
}: SpinnerProps) {
  return (
    <div className={`${styles.container} ${styles[variant]}`}>
      <span
        className={`${styles.spinner} ${styles[size]}`}
        role="status"
        aria-label={label}
      />
    </div>
  );
}

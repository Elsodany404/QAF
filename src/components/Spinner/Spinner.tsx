import styles from "./Spinner.module.css";

type SpinnerProps = {
  variant?: "page" | "component";
  size?: "sm" | "md" | "lg";
  label?: string;
};

export default function Spinner({
  variant = "component",
  size = "md",
}: SpinnerProps) {
  return (
    <div className={`${styles.container} ${styles[variant]}`}>
      <span
        className={`${styles.spinner} ${styles[size]}`}
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}

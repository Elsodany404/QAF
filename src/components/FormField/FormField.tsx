import styles from "./FormField.module.css";
function FormField({
  label,
  id,
  children,
  error,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div>
      <label className={styles.label} htmlFor={`${id}`}>
        {label}
      </label>
      {children}
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
}

export default FormField;

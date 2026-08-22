import styles from "./Spinner.module.css";
function Spinner({ pagination }: { pagination: boolean }) {
  return (
    <div
      className={`${pagination ? styles.spinnerPagination : styles.spinnerComponent}`}
    >
      <span className={styles.spinner}></span>
    </div>
  );
}

export default Spinner;

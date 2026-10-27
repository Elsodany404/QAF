import { Coffee } from "lucide-react";
import styles from "../SignInForm/SignInForm.module.css";

/**
 * The wordmark above the auth forms. It stays English, left to right, on
 * Arabic pages.
 */
export default function AuthBrand() {
  return (
    <div className={styles.brand} lang="en" dir="ltr">
      <div className={styles.logoMark}>
        <div className={styles.logoMarkInner} />
        <div className={styles.logoIcon}>
          <Coffee size={22} />
        </div>
      </div>
      <div>
        <p className={styles.logoTitle}>Qaf</p>
        <p className={styles.logoSubtitle}>Coffee Co.</p>
      </div>
    </div>
  );
}

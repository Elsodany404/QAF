import { Coffee } from "lucide-react";
import styles from "../SignInForm/SignInForm.module.css";

export default function AuthBrand() {
  return (
    <div className={styles.brand}>
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

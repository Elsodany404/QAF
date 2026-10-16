import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import styles from "./forbidden.module.css";

export default function Forbidden() {
  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <div className={styles.status}>403</div>
        <div className={styles.iconWrap} aria-hidden="true">
          <LockKeyhole className={styles.icon} />
        </div>
        <p className={styles.eyebrow}>Access restricted</p>
        <h1 className={styles.title}>This space is reserved.</h1>
        <p className={styles.description}>
          You do not have permission to view this page. Sign in with an
          authorized account or return to the coffee menu.
        </p>
        <div className={styles.actions}>
          <Link className={styles.primaryAction} href="/">
            <ArrowLeft aria-hidden="true" />
            Return home
          </Link>
          <Link className={styles.secondaryAction} href="/sign-in">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <div className={styles.page}>
      <main className={styles.panel}>
        <div className={styles.iconWrap} aria-hidden="true">
          <Compass className={styles.icon} />
        </div>
        <p className={styles.eyebrow}>Page not found</p>
        <h1 className={styles.title}>That page has gone off the menu.</h1>
        <p className={styles.description}>
          The link may be outdated, or the page may have moved. Let us get you
          back to something worth opening.
        </p>
        <Link className={styles.action} href="/">
          <ArrowLeft aria-hidden="true" />
          Back to QAF Coffee
        </Link>
      </main>
    </div>
  );
}

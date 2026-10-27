import { ArrowLeft, LockKeyhole } from "lucide-react";
import Link from "@/i18n/Link";
import { getI18n } from "@/i18n/server";
import styles from "./forbidden.module.css";

export default async function Forbidden() {
  const { t } = await getI18n();
  const text = t.forbidden;

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <div className={styles.status}>403</div>
        <div className={styles.iconWrap} aria-hidden="true">
          <LockKeyhole className={styles.icon} />
        </div>
        <p className={styles.eyebrow}>{text.eyebrow}</p>
        <h1 className={styles.title}>{text.title}</h1>
        <p className={styles.description}>{text.text}</p>
        <div className={styles.actions}>
          <Link className={styles.primaryAction} href="/">
            <ArrowLeft className="flipRtl" aria-hidden="true" />
            {text.home}
          </Link>
          <Link className={styles.secondaryAction} href="/sign-in">
            {text.signIn}
          </Link>
        </div>
      </div>
    </div>
  );
}

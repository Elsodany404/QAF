import { ArrowLeft, Compass } from "lucide-react";
import Link from "@/i18n/Link";
import { getI18n } from "@/i18n/server";
import styles from "./not-found.module.css";

export default async function NotFound() {
  const { t } = await getI18n();
  const text = t.notFound;

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <div className={styles.iconWrap} aria-hidden="true">
          <Compass className={styles.icon} />
        </div>
        <p className={styles.eyebrow}>{text.eyebrow}</p>
        <h1 className={styles.title}>{text.title}</h1>
        <p className={styles.description}>{text.text}</p>
        <Link className={styles.action} href="/">
          <ArrowLeft className="flipRtl" aria-hidden="true" />
          {text.back}
        </Link>
      </div>
    </div>
  );
}

"use client";

import { Coffee } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import styles from "../SignInForm/SignInForm.module.css";

/** The wordmark above the auth forms, in the page's language. */
export default function AuthBrand() {
  const { t } = useI18n();
  return (
    <div className={styles.brand}>
      <div className={styles.logoMark}>
        <div className={styles.logoMarkInner} />
        <div className={styles.logoIcon}>
          <Coffee size={22} />
        </div>
      </div>
      <div>
        <p className={styles.logoTitle}>{t.common.logoTitle}</p>
        <p className={styles.logoSubtitle}>{t.common.logoSubtitle}</p>
      </div>
    </div>
  );
}

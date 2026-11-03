"use client";

import { FlaskConical } from "lucide-react";

import { useI18n } from "@/i18n/I18nProvider";
import { IS_TEST_BUILD, TEST_ACCOUNT } from "@/lib/testBuild";
import styles from "./TestBuildNotice.module.css";

type TestBuildNoticeProps = {
  /** "auth" shows the test account; "checkout" says orders are off. */
  variant: "auth" | "checkout";
  /** Fills the sign-in form with the test account. */
  onUseAccount?: () => void;
};

export default function TestBuildNotice({
  variant,
  onUseAccount,
}: TestBuildNoticeProps) {
  const { t } = useI18n();
  if (!IS_TEST_BUILD) return null;
  const text = t.testBuild;

  return (
    <div className={styles.notice} role="note">
      <div className={styles.header}>
        <FlaskConical size={18} aria-hidden="true" />
        <strong>{text.title}</strong>
      </div>
      <p className={styles.body}>
        {variant === "auth" ? text.authText : text.checkoutText}
      </p>

      {variant === "auth" && (
        <dl className={styles.credentials}>
          <div>
            <dt>{text.email}</dt>
            <dd dir="ltr">{TEST_ACCOUNT.email}</dd>
          </div>
          <div>
            <dt>{text.password}</dt>
            <dd dir="ltr">{TEST_ACCOUNT.password}</dd>
          </div>
        </dl>
      )}

      {variant === "auth" && onUseAccount && (
        <button type="button" className={styles.useButton} onClick={onUseAccount}>
          {text.useAccount}
        </button>
      )}
    </div>
  );
}

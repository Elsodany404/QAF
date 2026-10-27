"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { MailCheck, RefreshCw } from "lucide-react";

import { format } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import Link from "@/i18n/Link";
import { rich } from "@/i18n/rich";
import { readPendingEmail, resendVerificationEmail } from "@/lib/authActions";
import type { ActionState } from "@/types/customTypes";
import styles from "../SignInForm/SignInForm.module.css";
import AuthBrand from "../PasswordReset/AuthBrand";

const RESEND_COOLDOWN_SECONDS = 60;
const noopSubscribe = () => () => {};

export default function VerifyEmailNotice({
  linkFailed,
}: {
  linkFailed: boolean;
}) {
  const { locale, t } = useI18n();
  const text = t.auth.verify;
  // sessionStorage only exists in the browser; render without it on the server.
  const pendingEmail = useSyncExternalStore(
    noopSubscribe,
    readPendingEmail,
    () => null,
  );
  const [typedEmail, setTypedEmail] = useState("");
  const [result, setResult] = useState<ActionState | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const email = pendingEmail ?? typedEmail;

  function handleResend(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const response = await resendVerificationEmail(email, {
        locale,
        results: t.auth.results,
      });
      setResult(response);
      if (response.status === "success") {
        setCooldown(RESEND_COOLDOWN_SECONDS);
      }
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <AuthBrand />

        <div className={styles.verifyIcon} aria-hidden="true">
          <MailCheck size={30} />
        </div>

        <h1 className={styles.heading}>
          {linkFailed ? text.expiredHeading : text.checkHeading}
        </h1>
        <p className={styles.subheading}>
          {linkFailed
            ? text.expiredText
            : pendingEmail
              ? rich(text.sentTo, { email: <strong>{pendingEmail}</strong> })
              : text.sent}
        </p>

        {!linkFailed && <p className={styles.notice}>{text.spamNote}</p>}

        <form onSubmit={handleResend} className={styles.form} noValidate>
          {result && (
            <p
              className={`${styles.notice} ${
                result.status === "failed" ? styles.noticeError : ""
              }`}
              role={result.status === "failed" ? "alert" : "status"}
            >
              {result.message}
            </p>
          )}

          {!pendingEmail && (
            <div className={styles.field}>
              <label className={styles.label} htmlFor="email">
                {t.auth.emailLabel}
              </label>
              <input
                id="email"
                type="email"
                dir="ltr"
                autoComplete="email"
                placeholder="you@example.com"
                className={styles.input}
                value={typedEmail}
                onChange={(e) => setTypedEmail(e.target.value)}
                required
              />
            </div>
          )}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isPending || cooldown > 0 || !email}
          >
            {isPending ? (
              <span className={styles.spinner} />
            ) : (
              <RefreshCw size={18} />
            )}
            {isPending
              ? text.sending
              : cooldown > 0
                ? format(text.resendIn, { seconds: cooldown })
                : text.resend}
          </button>
        </form>

        <p className={styles.switchText}>
          {text.alreadyVerified}{" "}
          <Link href="/sign-in" className={styles.switchLink}>
            {text.signIn}
          </Link>
          {" · "}
          <Link href="/sign-up" className={styles.switchLink}>
            {text.differentEmail}
          </Link>
        </p>
      </div>
    </div>
  );
}

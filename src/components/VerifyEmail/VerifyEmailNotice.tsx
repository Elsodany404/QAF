"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import Link from "next/link";
import { MailCheck, RefreshCw } from "lucide-react";

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
      const response = await resendVerificationEmail(email);
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
          {linkFailed ? "This link has expired" : "Check your email"}
        </h1>
        <p className={styles.subheading}>
          {linkFailed ? (
            "Verification links are valid for a limited time. Send yourself a new one below."
          ) : pendingEmail ? (
            <>
              We sent a verification link to <strong>{pendingEmail}</strong>.
              Click it to activate your account — then you can sign in and
              order.
            </>
          ) : (
            "We sent you a verification link. Click it to activate your account — then you can sign in and order."
          )}
        </p>

        {!linkFailed && (
          <p className={styles.notice}>
            Can&apos;t find it? Check your spam or promotions folder. The email
            comes from Qaf Coffee.
          </p>
        )}

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
                Email address
              </label>
              <input
                id="email"
                type="email"
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
              ? "Sending…"
              : cooldown > 0
                ? `Resend available in ${cooldown}s`
                : "Resend verification email"}
          </button>
        </form>

        <p className={styles.switchText}>
          Already verified?{" "}
          <Link href="/sign-in" className={styles.switchLink}>
            Sign in
          </Link>
          {" · "}
          <Link href="/sign-up" className={styles.switchLink}>
            Use a different email
          </Link>
        </p>
      </div>
    </div>
  );
}

"use client";

import { useActionState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Mail } from "lucide-react";

import { useI18n } from "@/i18n/I18nProvider";
import Link from "@/i18n/Link";
import { requestPasswordResetAction } from "@/lib/authActions";
import type { ActionState } from "@/types/customTypes";
import styles from "../SignInForm/SignInForm.module.css";
import AuthBrand from "./AuthBrand";

const initialState: ActionState = { status: "idle", message: "" };

export default function ForgotPasswordForm() {
  const { locale, t } = useI18n();
  const text = t.auth;
  const [state, formAction, isPending] = useActionState(
    (previousState: ActionState, formData: FormData) =>
      requestPasswordResetAction(previousState, formData, {
        locale,
        results: text.results,
      }),
    initialState,
  );
  const [, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ email: string }>();

  function onValid({ email }: { email: string }) {
    const formData = new FormData();
    formData.append("email", email);
    startTransition(() => formAction(formData));
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <AuthBrand />

        <h1 className={styles.heading}>{text.forgot.heading}</h1>
        <p className={styles.subheading}>{text.forgot.subheading}</p>

        {state.status === "success" ? (
          <p className={styles.notice} role="status">
            {state.message}
          </p>
        ) : (
          <form
            onSubmit={handleSubmit(onValid)}
            className={styles.form}
            noValidate
          >
            {state.status === "failed" && (
              <p
                className={`${styles.notice} ${styles.noticeError}`}
                role="alert"
              >
                {state.message}
              </p>
            )}

            <div className={styles.field}>
              <label className={styles.label} htmlFor="email">
                {text.emailLabel}
              </label>
              <input
                id="email"
                type="email"
                dir="ltr"
                autoComplete="email"
                placeholder="you@example.com"
                className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
                {...register("email", {
                  required: text.emailRequired,
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: text.emailInvalid,
                  },
                })}
              />
              {errors.email && (
                <span className={styles.errorText}>{errors.email.message}</span>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className={styles.submitButton}
            >
              {isPending ? (
                <span className={styles.spinner} />
              ) : (
                <Mail size={18} />
              )}
              {isPending ? text.forgot.submitting : text.forgot.submit}
            </button>
          </form>
        )}

        <p className={styles.switchText}>
          {text.forgot.remembered}{" "}
          <Link href="/sign-in" className={styles.switchLink}>
            {text.forgot.back}
          </Link>
        </p>
      </div>
    </div>
  );
}

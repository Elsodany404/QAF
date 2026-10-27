"use client";

import { useActionState, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, KeyRound } from "lucide-react";

import { useI18n } from "@/i18n/I18nProvider";
import Link from "@/i18n/Link";
import { resetPasswordAction } from "@/lib/authActions";
import type { ActionState } from "@/types/customTypes";
import styles from "../SignInForm/SignInForm.module.css";
import AuthBrand from "./AuthBrand";

type ResetFields = { password: string; confirmPassword: string };

const initialState: ActionState = { status: "idle", message: "" };

export default function ResetPasswordForm({ token }: { token: string | null }) {
  const { locale, t } = useI18n();
  const text = t.auth;
  const [state, formAction, isPending] = useActionState(
    (previousState: ActionState, formData: FormData) =>
      resetPasswordAction(previousState, formData, {
        locale,
        results: text.results,
      }),
    initialState,
  );
  const [, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ResetFields>();

  function onValid({ password }: ResetFields) {
    if (!token) return;
    const formData = new FormData();
    formData.append("token", token);
    formData.append("password", password);
    startTransition(() => formAction(formData));
  }

  let content: React.ReactNode;

  if (!token) {
    content = (
      <p className={`${styles.notice} ${styles.noticeError}`} role="alert">
        {text.reset.invalidLink}{" "}
        <Link href="/forgot-password" className={styles.switchLink}>
          {text.reset.requestNew}
        </Link>
        .
      </p>
    );
  } else if (state.status === "success") {
    content = (
      <>
        <p className={styles.notice} role="status">
          {state.message}
        </p>
        <Link href="/sign-in" className={styles.submitButton}>
          {text.reset.goToSignIn}
        </Link>
      </>
    );
  } else {
    content = (
      <form onSubmit={handleSubmit(onValid)} className={styles.form} noValidate>
        {state.status === "failed" && (
          <p className={`${styles.notice} ${styles.noticeError}`} role="alert">
            {state.message}{" "}
            <Link href="/forgot-password" className={styles.switchLink}>
              {text.reset.requestNewLink}
            </Link>
          </p>
        )}

        <div className={styles.field}>
          <label className={styles.label} htmlFor="password">
            {text.reset.newPassword}
          </label>
          <div className={styles.passwordWrapper}>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              className={`${styles.input} ${errors.password ? styles.inputError : ""}`}
              {...register("password", {
                required: text.passwordRequired,
                minLength: {
                  value: 8,
                  message: text.passwordMin,
                },
                maxLength: {
                  value: 128,
                  message: text.passwordMax,
                },
              })}
            />
            <button
              type="button"
              className={styles.eyeButton}
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? text.hidePassword : text.showPassword}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <span className={styles.errorText}>{errors.password.message}</span>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="confirmPassword">
            {text.reset.confirmNewPassword}
          </label>
          <input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ""}`}
            {...register("confirmPassword", {
              required: text.confirmRequired,
              validate: (value) =>
                value === getValues("password") || text.passwordsDiffer,
            })}
          />
          {errors.confirmPassword && (
            <span className={styles.errorText}>
              {errors.confirmPassword.message}
            </span>
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
            <KeyRound size={18} />
          )}
          {isPending ? text.reset.submitting : text.reset.submit}
        </button>
      </form>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <AuthBrand />
        <h1 className={styles.heading}>{text.reset.heading}</h1>
        <p className={styles.subheading}>{text.reset.subheading}</p>
        {content}
      </div>
    </div>
  );
}

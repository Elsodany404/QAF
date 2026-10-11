"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, KeyRound } from "lucide-react";

import { resetPasswordAction } from "@/lib/authActions";
import type { ActionState } from "@/types/customTypes";
import styles from "../SignInForm/SignInForm.module.css";
import AuthBrand from "./AuthBrand";

type ResetFields = { password: string; confirmPassword: string };

const initialState: ActionState = { status: "idle", message: "" };

export default function ResetPasswordForm({ token }: { token: string | null }) {
  const [state, formAction, isPending] = useActionState(
    resetPasswordAction,
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
        This reset link is invalid or has expired.{" "}
        <Link href="/forgot-password" className={styles.switchLink}>
          Request a new one
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
          Go to sign in
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
              Request a new link
            </Link>
          </p>
        )}

        <div className={styles.field}>
          <label className={styles.label} htmlFor="password">
            New password
          </label>
          <div className={styles.passwordWrapper}>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              className={`${styles.input} ${errors.password ? styles.inputError : ""}`}
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Must be at least 8 characters",
                },
                maxLength: {
                  value: 128,
                  message: "Must be at most 128 characters",
                },
              })}
            />
            <button
              type="button"
              className={styles.eyeButton}
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
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
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ""}`}
            {...register("confirmPassword", {
              required: "Please confirm your password",
              validate: (value) =>
                value === getValues("password") || "Passwords do not match",
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
          {isPending ? "Saving…" : "Reset password"}
        </button>
      </form>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <AuthBrand />
        <h1 className={styles.heading}>Choose a new password</h1>
        <p className={styles.subheading}>
          You&apos;ll be signed out of every other device.
        </p>
        {content}
      </div>
    </div>
  );
}

"use client";

import { useActionState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Mail } from "lucide-react";

import { requestPasswordResetAction } from "@/lib/authActions";
import type { ActionState } from "@/types/customTypes";
import styles from "../SignInForm/SignInForm.module.css";
import AuthBrand from "./AuthBrand";

const initialState: ActionState = { status: "idle", message: "" };

export default function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    requestPasswordResetAction,
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

        <h1 className={styles.heading}>Forgot your password?</h1>
        <p className={styles.subheading}>
          Enter your email and we&apos;ll send you a link to choose a new one.
        </p>

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
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Enter a valid email address",
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
              {isPending ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <p className={styles.switchText}>
          Remembered it?{" "}
          <Link href="/sign-in" className={styles.switchLink}>
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

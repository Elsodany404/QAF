"use client";
import { useForm } from "react-hook-form";
import { useActionState, useEffect, useState, useTransition } from "react";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import styles from "./SignUpForm.module.css";
import AuthBrand from "@/components/PasswordReset/AuthBrand";
import { useI18n } from "@/i18n/I18nProvider";
import Link from "@/i18n/Link";
import {
  rememberPendingEmail,
  signUpAction,
  VERIFY_EMAIL_PATH,
} from "@/lib/authActions";
import { toast } from "react-hot-toast";
import { ActionState } from "@/types/customTypes";
import { useRouter } from "next/navigation";

type SignUpFields = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};
const initialState: ActionState = {
  status: "idle",
  message: "",
};
export default function SignUpForm() {
  const { locale, t, href } = useI18n();
  const text = t.auth;
  const [state, formAction, isPending] = useActionState(
    (previousState: ActionState, formData: FormData) =>
      signUpAction(previousState, formData, {
        locale,
        results: text.results,
      }),
    initialState,
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();
  const [, startTransition] = useTransition();

  const {
    register,
    getValues,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFields>();

  useEffect(() => {
    if (state.status === "success") {
      // Not signed in yet — send them to "check your email" instead of the shop.
      rememberPendingEmail(getValues("email"));
      router.push(href(VERIFY_EMAIL_PATH));
    } else if (state.status === "failed") {
      toast.error(state.message);
    }
    // state only changes reference when useActionState gets a new result,
    // so depending on the whole object here is intentional
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function onValid(data: SignUpFields) {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("email", data.email);
    formData.append("password", data.password);
    startTransition(() => formAction(formData));
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <AuthBrand />

        <h1 className={styles.heading}>{text.signUp.heading}</h1>
        <p className={styles.subheading}>{text.signUp.subheading}</p>

        <form
          onSubmit={handleSubmit(onValid)}
          className={styles.form}
          noValidate
        >
          {/* Name */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="name">
              {text.signUp.name}
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              maxLength={80}
              placeholder={text.signUp.namePlaceholder}
              className={`${styles.input} ${errors.name ? styles.inputError : ""}`}
              {...register("name", {
                required: text.signUp.nameRequired,
                minLength: {
                  value: 2,
                  message: text.signUp.nameTooShort,
                },
              })}
            />
            {errors.name && (
              <span className={styles.errorText}>{errors.name.message}</span>
            )}
          </div>

          {/* Email */}
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

          {/* Password */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              {text.passwordLabel}
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
              <span className={styles.errorText}>
                {errors.password.message}
              </span>
            )}
          </div>

          {/* Confirm Password */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="confirmPassword">
              {text.signUp.confirmPassword}
            </label>
            <div className={styles.passwordWrapper}>
              <input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ""}`}
                {...register("confirmPassword", {
                  required: text.confirmRequired,
                  validate: (val) =>
                    val === getValues("password") || text.passwordsDiffer,
                })}
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? text.hidePassword : text.showPassword}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
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
              <UserPlus size={18} />
            )}
            {isPending ? text.signUp.submitting : text.signUp.submit}
          </button>
        </form>

        <p className={styles.switchText}>
          {text.signUp.haveAccount}{" "}
          <Link href="/sign-in" className={styles.switchLink}>
            {text.signUp.signIn}
          </Link>
        </p>
      </div>
    </div>
  );
}

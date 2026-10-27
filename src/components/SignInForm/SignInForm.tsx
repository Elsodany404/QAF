"use client";
import { useForm } from "react-hook-form";
import { useActionState, useEffect, useState, useTransition } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import styles from "./SignInForm.module.css";
import AuthBrand from "@/components/PasswordReset/AuthBrand";
import { useI18n } from "@/i18n/I18nProvider";
import Link from "@/i18n/Link";
import {
  rememberPendingEmail,
  signInAction,
  VERIFY_EMAIL_PATH,
} from "@/lib/authActions";
import { toast } from "react-hot-toast";
import { ActionState } from "@/types/customTypes";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";

type SignInFields = {
  email: string;
  password: string;
};
const initialState: ActionState = {
  status: "idle",
  message: "",
};

export default function SignInForm({ redirectTo }: { redirectTo: string }) {
  const { locale, t, href } = useI18n();
  const text = t.auth;
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, isPending] = useActionState(
    (previousState: ActionState, formData: FormData) =>
      signInAction(previousState, formData, {
        locale,
        results: text.results,
      }),
    initialState,
  );
  const [, startTransition] = useTransition();
  const router = useRouter();
  const { refetch } = useSession();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<SignInFields>();

  // Only runs once RHF validation passes
  const onValid = (data: SignInFields) => {
    const formData = new FormData();
    formData.append("email", data.email);
    formData.append("password", data.password);
    startTransition(() => formAction(formData));
  };

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      refetch();
      router.push(redirectTo);
      router.refresh();
    } else if (state.code === "EMAIL_NOT_VERIFIED") {
      rememberPendingEmail(getValues("email"));
      router.push(href(VERIFY_EMAIL_PATH));
    } else if (state.status === "failed") {
      toast.error(state.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <AuthBrand />

        <h1 className={styles.heading}>{text.signIn.heading}</h1>
        <p className={styles.subheading}>{text.signIn.subheading}</p>

        <form
          onSubmit={handleSubmit(onValid)}
          className={styles.form}
          noValidate
        >
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

          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label className={styles.label} htmlFor="password">
                {text.passwordLabel}
              </label>
              <Link href="/forgot-password" className={styles.forgotLink}>
                {text.signIn.forgot}
              </Link>
            </div>
            <div className={styles.passwordWrapper}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                className={`${styles.input} ${errors.password ? styles.inputError : ""}`}
                {...register("password", {
                  required: text.passwordRequired,
                  minLength: {
                    value: 8,
                    message: text.passwordTooShort,
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

          <button
            type="submit"
            disabled={isPending}
            className={styles.submitButton}
          >
            {isPending ? (
              <span className={styles.spinner} />
            ) : (
              <LogIn size={18} />
            )}
            {isPending ? text.signIn.submitting : text.signIn.submit}
          </button>
        </form>

        <p className={styles.switchText}>
          {text.signIn.noAccount}{" "}
          <Link href="/sign-up" className={styles.switchLink}>
            {text.signIn.createOne}
          </Link>
        </p>
      </div>
    </div>
  );
}

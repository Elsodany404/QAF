"use client";
import { useForm } from "react-hook-form";
import { useActionState, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Coffee, Eye, EyeOff, UserPlus } from "lucide-react";
import styles from "./SignUpForm.module.css";
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
  const [state, formAction, isPending] = useActionState(
    signUpAction,
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
      router.push(VERIFY_EMAIL_PATH);
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
        {/* Brand header */}
        <div className={styles.brand}>
          <div className={styles.logoMark}>
            <div className={styles.logoMarkInner} />
            <div className={styles.logoIcon}>
              <Coffee size={22} />
            </div>
          </div>
          <div>
            <p className={styles.logoTitle}>Qaf</p>
            <p className={styles.logoSubtitle}>Coffee Co.</p>
          </div>
        </div>

        <h1 className={styles.heading}>Create an account</h1>
        <p className={styles.subheading}>Join us and enjoy premium coffee</p>

        <form
          onSubmit={handleSubmit(onValid)}
          className={styles.form}
          noValidate
        >
          {/* Name */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="name">
              Full name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              maxLength={80}
              placeholder="Ahmed Al-Rashid"
              className={`${styles.input} ${errors.name ? styles.inputError : ""}`}
              {...register("name", {
                required: "Name is required",
                minLength: {
                  value: 2,
                  message: "Name must be at least 2 characters",
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

          {/* Password */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              Password
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
              <span className={styles.errorText}>
                {errors.password.message}
              </span>
            )}
          </div>

          {/* Confirm Password */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="confirmPassword">
              Confirm password
            </label>
            <div className={styles.passwordWrapper}>
              <input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ""}`}
                {...register("confirmPassword", {
                  required: "Please confirm your password",
                  validate: (val) =>
                    val === getValues("password") || "Passwords do not match",
                })}
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
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
            {isPending ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className={styles.switchText}>
          Already have an account?{" "}
          <Link href="/sign-in" className={styles.switchLink}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

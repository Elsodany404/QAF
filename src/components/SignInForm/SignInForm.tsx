"use client";
import { useForm } from "react-hook-form";
import { useActionState, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Coffee, Eye, EyeOff, LogIn } from "lucide-react";
import styles from "./SignInForm.module.css";
import signIn from "@/actions/signIn";
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

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, isPending] = useActionState(signIn, initialState);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const { refetch } = useSession();

  const {
    register,
    handleSubmit,
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
      router.push("/dashboard");
      router.refresh();
    } else if (state.status === "failed") {
      toast.error(state.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
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

        <h1 className={styles.heading}>Welcome back</h1>
        <p className={styles.subheading}>Sign in to your account to continue</p>

        <form
          onSubmit={handleSubmit(onValid)}
          className={styles.form}
          noValidate
        >
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              type="email"
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

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              Password
            </label>
            <div className={styles.passwordWrapper}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className={`${styles.input} ${errors.password ? styles.inputError : ""}`}
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 8,
                    message: "Password must be at least 8 characters",
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
            {isPending ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className={styles.switchText}>
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className={styles.switchLink}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

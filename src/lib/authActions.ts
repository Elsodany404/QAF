"use client";

import { authClient } from "@/lib/auth-client";
import type { ActionState } from "@/types/customTypes";

/*
 * Auth form actions. These run in the browser and go through /api/auth so
 * Better Auth's rate limiter applies (server-side auth.api calls bypass it).
 * They match the useActionState signature, so forms use them like server
 * actions.
 */

export const MIN_PASSWORD_LENGTH = 8;
// Verification links return here; the page sends verified users on to /user.
export const VERIFY_EMAIL_PATH = "/verify-email";
const PENDING_EMAIL_KEY = "pendingVerificationEmail";

/*
 * The address waiting for verification is kept in sessionStorage (not the
 * URL) so it doesn't end up in server logs or shared links.
 */
export function rememberPendingEmail(email: string) {
  try {
    sessionStorage.setItem(PENDING_EMAIL_KEY, email);
  } catch {
    // Private mode / storage disabled: the page still works without it.
  }
}

export function readPendingEmail(): string | null {
  try {
    return sessionStorage.getItem(PENDING_EMAIL_KEY);
  } catch {
    return null;
  }
}
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_LIMITED =
  "Too many attempts. Please wait a few minutes and try again.";

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

const failed = (message: string): ActionState => ({
  status: "failed",
  message,
});
const succeeded = (message: string): ActionState => ({
  status: "success",
  message,
});

export async function signInAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = field(formData, "email").trim();
  const password = field(formData, "password");
  if (!EMAIL_PATTERN.test(email) || !password) {
    return failed("Enter your email and password");
  }

  const { error } = await authClient.signIn.email({
    email,
    password,
    // Used by the verification email Better Auth re-sends to unverified users.
    callbackURL: VERIFY_EMAIL_PATH,
  });
  if (!error) return succeeded("Signed in successfully");
  if (error.status === 429) return failed(RATE_LIMITED);
  if (error.status === 403) {
    return {
      ...failed(
        "Please verify your email address — we've sent you a new verification link.",
      ),
      code: "EMAIL_NOT_VERIFIED",
    };
  }
  // Same message for a wrong password and an unknown email, so the form
  // can't be used to discover which accounts exist.
  return failed("Invalid email or password");
}

export async function signUpAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = field(formData, "name").trim();
  const email = field(formData, "email").trim();
  const password = field(formData, "password");

  if (name.length < 2 || !EMAIL_PATTERN.test(email)) {
    return failed("Please enter your name and a valid email");
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return failed(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    );
  }

  const { error } = await authClient.signUp.email({
    name,
    email,
    password,
    callbackURL: VERIFY_EMAIL_PATH,
  });
  if (!error) {
    return succeeded(
      "Almost there! We sent a verification link to your email.",
    );
  }
  if (error.status === 429) return failed(RATE_LIMITED);
  return failed(error.message || "Unable to create your account");
}

export async function requestPasswordResetAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = field(formData, "email").trim();
  if (!EMAIL_PATTERN.test(email)) {
    return failed("Enter a valid email address");
  }

  const { error } = await authClient.requestPasswordReset({
    email,
    redirectTo: "/reset-password",
  });
  if (error?.status === 429) return failed(RATE_LIMITED);

  // Same answer whether or not the account exists.
  return succeeded(
    "If an account exists for that email, we've sent a link to reset your password.",
  );
}

export async function resetPasswordAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = field(formData, "token");
  const newPassword = field(formData, "password");

  if (!token) {
    return failed("This reset link is invalid. Please request a new one.");
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return failed(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    );
  }

  const { error } = await authClient.resetPassword({ newPassword, token });
  if (!error) {
    return succeeded("Your password has been reset. You can sign in now.");
  }
  if (error.status === 429) return failed(RATE_LIMITED);
  return failed(
    "This reset link is invalid or has expired. Please request a new one.",
  );
}

export async function resendVerificationEmail(
  email: string,
): Promise<ActionState> {
  if (!EMAIL_PATTERN.test(email.trim())) {
    return failed("Enter a valid email address");
  }

  const { error } = await authClient.sendVerificationEmail({
    email: email.trim(),
    callbackURL: VERIFY_EMAIL_PATH,
  });
  if (error?.status === 429) return failed(RATE_LIMITED);
  if (error) return failed("We couldn't send the email. Please try again.");
  return succeeded("A new verification link is on its way.");
}

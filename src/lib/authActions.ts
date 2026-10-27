"use client";

import { localizePath, type Locale } from "@/i18n/config";
import { format } from "@/i18n/format";
import type { ClientMessages } from "@/i18n/messages";
import { authClient } from "@/lib/auth-client";
import type { ActionState } from "@/types/customTypes";

/*
 * Auth form actions. These run in the browser and go through /api/auth so
 * Better Auth's rate limiter applies (server-side auth.api calls bypass it).
 * After useActionState's (previousState, formData), they take the page's
 * language and text, which the forms pass in.
 */

export type AuthText = {
  locale: Locale;
  results: ClientMessages["auth"]["results"];
};

export const MIN_PASSWORD_LENGTH = 8;
// Verification links return here; the page sends verified users on to /user.
// Localize it for the page's language with localizePath().
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
  { locale, results }: AuthText,
): Promise<ActionState> {
  const email = field(formData, "email").trim();
  const password = field(formData, "password");
  if (!EMAIL_PATTERN.test(email) || !password) {
    return failed(results.enterEmailAndPassword);
  }

  const { error } = await authClient.signIn.email({
    email,
    password,
    // Used by the verification email Better Auth re-sends to unverified users.
    // Its language follows this address (see src/lib/auth.ts).
    callbackURL: localizePath(locale, VERIFY_EMAIL_PATH),
  });
  if (!error) return succeeded(results.signedIn);
  if (error.status === 429) return failed(results.rateLimited);
  if (error.status === 403) {
    return {
      ...failed(results.verifyEmail),
      code: "EMAIL_NOT_VERIFIED",
    };
  }
  // Same message for a wrong password and an unknown email, so the form
  // can't be used to discover which accounts exist.
  return failed(results.invalidCredentials);
}

export async function signUpAction(
  _previousState: ActionState,
  formData: FormData,
  { locale, results }: AuthText,
): Promise<ActionState> {
  const name = field(formData, "name").trim();
  const email = field(formData, "email").trim();
  const password = field(formData, "password");

  if (name.length < 2 || !EMAIL_PATTERN.test(email)) {
    return failed(results.nameAndEmail);
  }
  // Same limit as editing the name on the account page.
  if (name.length > 80) {
    return failed(results.nameTooLong);
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return failed(
      format(results.passwordTooShort, { min: MIN_PASSWORD_LENGTH }),
    );
  }

  const { error } = await authClient.signUp.email({
    name,
    email,
    password,
    callbackURL: localizePath(locale, VERIFY_EMAIL_PATH),
  });
  if (!error) {
    return succeeded(results.signUpSent);
  }
  if (error.status === 429) return failed(results.rateLimited);
  // Better Auth explains the problem in English only.
  return failed(
    (locale === "en" && error.message) || results.signUpFailed,
  );
}

export async function requestPasswordResetAction(
  _previousState: ActionState,
  formData: FormData,
  { locale, results }: AuthText,
): Promise<ActionState> {
  const email = field(formData, "email").trim();
  if (!EMAIL_PATTERN.test(email)) {
    return failed(results.emailInvalid);
  }

  const { error } = await authClient.requestPasswordReset({
    email,
    // The email's language follows this address (see src/lib/auth.ts).
    redirectTo: localizePath(locale, "/reset-password"),
  });
  if (error?.status === 429) return failed(results.rateLimited);

  // Same answer whether or not the account exists.
  return succeeded(results.resetLinkSent);
}

export async function resetPasswordAction(
  _previousState: ActionState,
  formData: FormData,
  { results }: AuthText,
): Promise<ActionState> {
  const token = field(formData, "token");
  const newPassword = field(formData, "password");

  if (!token) {
    return failed(results.resetLinkInvalid);
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return failed(
      format(results.passwordTooShort, { min: MIN_PASSWORD_LENGTH }),
    );
  }

  const { error } = await authClient.resetPassword({ newPassword, token });
  if (!error) {
    return succeeded(results.passwordReset);
  }
  if (error.status === 429) return failed(results.rateLimited);
  return failed(results.resetLinkExpired);
}

export async function resendVerificationEmail(
  email: string,
  { locale, results }: AuthText,
): Promise<ActionState> {
  if (!EMAIL_PATTERN.test(email.trim())) {
    return failed(results.emailInvalid);
  }

  const { error } = await authClient.sendVerificationEmail({
    email: email.trim(),
    callbackURL: localizePath(locale, VERIFY_EMAIL_PATH),
  });
  if (error?.status === 429) return failed(results.rateLimited);
  if (error) return failed(results.emailNotSent);
  return succeeded(results.verificationSent);
}

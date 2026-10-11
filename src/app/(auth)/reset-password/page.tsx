import type { Metadata } from "next";
import ResetPasswordForm from "@/components/PasswordReset/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password",
};

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string | string[]; error?: string }>;
};

// Better Auth verifies the emailed link and redirects here with either
// ?token=... or ?error=INVALID_TOKEN.
export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { token, error } = await searchParams;
  const value = Array.isArray(token) ? token[0] : token;

  return <ResetPasswordForm token={!error && value ? value : null} />;
}

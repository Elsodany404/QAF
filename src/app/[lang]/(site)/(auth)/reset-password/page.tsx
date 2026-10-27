import type { Metadata } from "next";
import ResetPasswordForm from "@/components/PasswordReset/ResetPasswordForm";
import { getI18n } from "@/i18n/server";
import { firstParam } from "@/lib/searchParams";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.auth.reset.metaTitle };
}

type ResetPasswordPageProps = {
  searchParams: Promise<{
    token?: string | string[];
    error?: string | string[];
  }>;
};

// Better Auth verifies the emailed link and redirects here with either
// ?token=... or ?error=INVALID_TOKEN.
export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { token, error } = await searchParams;
  const value = firstParam(token);

  return <ResetPasswordForm token={!error && value ? value : null} />;
}

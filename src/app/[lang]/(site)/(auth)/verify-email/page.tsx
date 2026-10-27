import type { Metadata } from "next";
import { redirect } from "next/navigation";
import VerifyEmailNotice from "@/components/VerifyEmail/VerifyEmailNotice";
import { localizePath } from "@/i18n/config";
import { getI18n, getLocale } from "@/i18n/server";
import { getCurrentSession } from "@/lib/adminAccess";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.auth.verify.metaTitle };
}

type VerifyEmailPageProps = {
  searchParams: Promise<{ error?: string | string[] }>;
};

/*
 * Shown right after sign-up, and the landing page for verification links.
 * Better Auth signs the user in after a successful verification and redirects
 * here; a bad or expired link arrives with ?error=...
 */
export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const [{ error }, session, locale] = await Promise.all([
    searchParams,
    getCurrentSession(),
    getLocale(),
  ]);

  if (session?.user.emailVerified) {
    redirect(localizePath(locale, "/user"));
  }

  return <VerifyEmailNotice linkFailed={Boolean(error)} />;
}

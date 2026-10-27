import type { Metadata } from "next";
import { redirect } from "next/navigation";
import SignInForm from "@/components/SignInForm/SignInForm";
import { localizePath } from "@/i18n/config";
import { getI18n, getLocale } from "@/i18n/server";
import { getCurrentSession } from "@/lib/adminAccess";
import { safeRedirectPath } from "@/lib/redirect";
import { firstParam } from "@/lib/searchParams";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.auth.signIn.metaTitle };
}

type SignInPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const [{ next }, session, locale] = await Promise.all([
    searchParams,
    getCurrentSession(),
    getLocale(),
  ]);
  const redirectTo = safeRedirectPath(
    firstParam(next),
    localizePath(locale, "/user"),
  );

  // Already signed in — go straight to where they were heading.
  if (session) {
    redirect(redirectTo);
  }

  return <SignInForm redirectTo={redirectTo} />;
}

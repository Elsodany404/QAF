import type { Metadata } from "next";
import { redirect } from "next/navigation";
import SignUpForm from "@/components/SignUpForm/SignUpForm";
import { localizePath } from "@/i18n/config";
import { getI18n, getLocale } from "@/i18n/server";
import { getCurrentSession } from "@/lib/adminAccess";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.auth.signUp.metaTitle };
}

export default async function SignUpPage() {
  // Already signed in — there's nothing to sign up for.
  if (await getCurrentSession()) {
    redirect(localizePath(await getLocale(), "/user"));
  }

  return <SignUpForm />;
}

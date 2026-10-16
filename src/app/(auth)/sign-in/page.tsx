import type { Metadata } from "next";
import { redirect } from "next/navigation";
import SignInForm from "@/components/SignInForm/SignInForm";
import { getCurrentSession } from "@/lib/adminAccess";
import { safeRedirectPath } from "@/lib/redirect";
import { firstParam } from "@/lib/searchParams";

export const metadata: Metadata = {
  title: "Sign In",
};

type SignInPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const [{ next }, session] = await Promise.all([
    searchParams,
    getCurrentSession(),
  ]);
  const redirectTo = safeRedirectPath(firstParam(next));

  // Already signed in — go straight to where they were heading.
  if (session) {
    redirect(redirectTo);
  }

  return <SignInForm redirectTo={redirectTo} />;
}

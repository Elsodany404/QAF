import type { Metadata } from "next";
import { redirect } from "next/navigation";
import VerifyEmailNotice from "@/components/VerifyEmail/VerifyEmailNotice";
import { getCurrentSession } from "@/lib/adminAccess";

export const metadata: Metadata = {
  title: "Verify Your Email",
};

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
  const [{ error }, session] = await Promise.all([
    searchParams,
    getCurrentSession(),
  ]);

  if (session?.user.emailVerified) {
    redirect("/user");
  }

  return <VerifyEmailNotice linkFailed={Boolean(error)} />;
}

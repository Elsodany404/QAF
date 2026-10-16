import type { Metadata } from "next";
import { redirect } from "next/navigation";
import SignUpForm from "@/components/SignUpForm/SignUpForm";
import { getCurrentSession } from "@/lib/adminAccess";

export const metadata: Metadata = {
  title: "Create Account",
};

export default async function SignUpPage() {
  // Already signed in — there's nothing to sign up for.
  if (await getCurrentSession()) {
    redirect("/user");
  }

  return <SignUpForm />;
}

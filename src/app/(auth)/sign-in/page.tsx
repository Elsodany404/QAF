import type { Metadata } from "next";
import SignInForm from "@/components/SignInForm/SignInForm";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function SignInPage() {
  return <SignInForm />;
}

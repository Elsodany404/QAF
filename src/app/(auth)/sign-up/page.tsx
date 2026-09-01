import type { Metadata } from "next";
import SignUpForm from "@/components/SignUpForm/SignUpForm";

export const metadata: Metadata = {
  title: "Create Account",
};

export default function SignUpPage() {
  return <SignUpForm />;
}

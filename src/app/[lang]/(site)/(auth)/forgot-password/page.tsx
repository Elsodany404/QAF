import type { Metadata } from "next";
import ForgotPasswordForm from "@/components/PasswordReset/ForgotPasswordForm";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.auth.forgot.metaTitle };
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}

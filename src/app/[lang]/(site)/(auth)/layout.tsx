import type { Metadata } from "next";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: {
      default: t.auth.metaTitle,
      template: t.metadata.titleTemplate,
    },
  };
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { signInPath } from "@/lib/redirect";
import UserPage from "@/components/UserPage/UserPage";
import { getI18n, getLocale } from "@/i18n/server";
import { getCurrentSession } from "@/lib/adminAccess";
import { getOrdersByCustomerID } from "@/services/Order";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.account.metaTitle };
}

export default async function User() {
  const [session, locale] = await Promise.all([
    getCurrentSession(),
    getLocale(),
  ]);

  // Authentication
  if (!session) {
    redirect(signInPath("/user", locale));
  }

  const orders = await getOrdersByCustomerID(session.user.id);

  return <UserPage user={session.user} orders={orders} />;
}

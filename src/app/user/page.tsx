import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { signInPath } from "@/lib/redirect";
import UserPage from "@/components/UserPage/UserPage";
import { getCurrentSession } from "@/lib/adminAccess";
import { getOrdersByCustomerID } from "@/services/Order";

export const metadata: Metadata = {
  title: "My Account",
};

export default async function User() {
  const session = await getCurrentSession();

  // Authentication
  if (!session) {
    redirect(signInPath("/user"));
  }

  const orders = await getOrdersByCustomerID(session.user.id);

  return <UserPage user={session.user} orders={orders} />;
}

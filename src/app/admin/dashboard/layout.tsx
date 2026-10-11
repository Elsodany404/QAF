import { auth } from "@/lib/auth";
import { signInPath } from "@/lib/redirect";
import { headers } from "next/headers";
import { forbidden, redirect } from "next/navigation";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect(signInPath("/admin/dashboard"));
  }

  if (session.user.role !== "admin") {
    forbidden();
  }

  return children;
}

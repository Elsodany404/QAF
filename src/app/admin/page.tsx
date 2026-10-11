import { auth } from "@/lib/auth";
import { signInPath } from "@/lib/redirect";
import { headers } from "next/headers";
import { redirect, forbidden } from "next/navigation";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Authentication

  if (!session) {
    redirect(signInPath("/admin/dashboard"));
  }

  // Authorization
  if (session.user.role !== "admin") {
    forbidden();
  }
  redirect("/admin/dashboard");
}

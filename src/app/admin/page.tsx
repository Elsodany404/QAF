import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, forbidden } from "next/navigation";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Authentication
  if (!session) {
    redirect("/login");
  }

  // Authorization
  if (session.user.role !== "admin") {
    forbidden();
  }

  return <div>Admin page</div>;
}

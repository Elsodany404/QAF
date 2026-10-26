import "server-only";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function getCurrentSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function isAdminUser(): Promise<boolean> {
  const session = await getCurrentSession();
  return session?.user.role === "admin";
}

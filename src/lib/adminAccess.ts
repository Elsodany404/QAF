import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function getCurrentSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function isAdminUser(): Promise<boolean> {
  const session = await getCurrentSession();
  return session?.user.role === "admin";
}

export function isValidOrderID(orderID: unknown): orderID is number {
  return (
    typeof orderID === "number" && Number.isSafeInteger(orderID) && orderID > 0
  );
}

export function errorMessage(error: unknown, fallback = "Unexpected error") {
  return error instanceof Error ? error.message : fallback;
}

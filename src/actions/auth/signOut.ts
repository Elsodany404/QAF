"use server";
import { getRequestMessages } from "@/i18n/request";
import { auth } from "@/lib/auth";
import { ActionState } from "@/types/customTypes";
import { headers } from "next/headers";

export default async function signOut(): Promise<ActionState> {
  const { locale, m } = await getRequestMessages();
  try {
    await auth.api.signOut({ headers: await headers() });
    return { status: "success", message: m.signedOut };
  } catch (err) {
    return {
      status: "failed",
      // Better Auth's errors are in English.
      message:
        locale === "en" && err instanceof Error ? err.message : m.unexpected,
    };
  }
}

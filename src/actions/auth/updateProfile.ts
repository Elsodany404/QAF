"use server";

import { getRequestMessages } from "@/i18n/request";
import { revalidateEveryLanguage } from "@/i18n/revalidate";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export type UpdateProfileResult =
  { success: true } | { success: false; error: string };

export async function updateProfile(
  name: string,
): Promise<UpdateProfileResult> {
  const { m } = await getRequestMessages();
  // Server actions can be called with anything, not just what the form sends.
  const normalizedName = typeof name === "string" ? name.trim() : "";
  if (normalizedName.length < 2 || normalizedName.length > 80) {
    return {
      success: false,
      error: m.nameLength,
    };
  }

  try {
    await auth.api.updateUser({
      body: { name: normalizedName },
      headers: await headers(),
    });
    revalidateEveryLanguage("/user");
    return { success: true };
  } catch {
    return { success: false, error: m.profileNotUpdated };
  }
}

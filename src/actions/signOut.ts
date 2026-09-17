"use server";
import { auth } from "@/lib/auth";
import { ActionState } from "@/types/customTypes";
import { headers } from "next/headers";

export default async function signOut(): Promise<ActionState> {
  try {
    await auth.api.signOut({ headers: await headers() });
    return { status: "success", message: "Signed out successfully" };
  } catch (err) {
    return {
      status: "failed",
      message: err instanceof Error ? err.message : "Unexpected error happened",
    };
  }
}

"use server";
import { auth } from "@/lib/auth";
import { ActionState } from "@/types/customTypes";

export default async function signUp(
  previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return { status: "failed", message: "form payload error" };
    }

    await auth.api.signUpEmail({
      body: {
        name, // required, The name of the user.
        email, // required, The email address of the user.
        password, // required, The password of the user. It should be at least 8 characters long and max 128 by default.
      },
    });
    return {
      status: "success",
      message: "we sent verification link to your email",
    };
  } catch (err) {
    console.error("Sign up error:", err);

    return {
      status: "failed",
      message: "Unable to create your account",
    };
  }
}
// 200 OK, 201 Created, 204 No Content
// 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found
//500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable

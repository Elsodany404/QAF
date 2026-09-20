"use server";

import { Resend } from "resend";
import type { ActionState } from "@/types/customTypes";

const recipient = "sales@qafcoffee.store";

export default async function sendContactMessage(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = formData.get("name");
  const email = formData.get("email");
  const subject = formData.get("subject");
  const message = formData.get("message");

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof subject !== "string" ||
    typeof message !== "string" ||
    !name.trim() ||
    !email.trim() ||
    !subject.trim() ||
    !message.trim()
  ) {
    return { status: "failed", message: "Please complete all fields." };
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return { status: "failed", message: "Please enter a valid email address." };
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not configured");
    return { status: "failed", message: "Email service is not configured." };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: recipient,
      replyTo: email.trim(),
      subject: `[Website contact] ${subject.trim()}`,
      text: [
        `Name: ${name.trim()}`,
        `Email: ${email.trim()}`,
        `Subject: ${subject.trim()}`,
        "",
        message.trim(),
      ].join("\n"),
    });

    if (error) {
      console.error("Contact email error:", {
        name: error.name,
        message: error.message,
        recipient,
      });
      return { status: "failed", message: "Unable to send your message." };
    }

    return {
      status: "success",
      message: "Thanks. Your message has been sent.",
    };
  } catch (error) {
    console.error("Contact email error:", error);
    return { status: "failed", message: "Unable to send your message." };
  }
}

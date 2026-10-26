import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ActionState } from "@/types/customTypes";

const mocks = vi.hoisted(() => ({
  allowRequest: vi.fn(),
  sendEmail: vi.fn(),
  updateUser: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/email", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/email")>()),
  sendEmail: mocks.sendEmail,
}));
vi.mock("@/lib/rateLimit", () => ({ allowRequest: mocks.allowRequest }));
vi.mock("@/lib/auth", () => ({
  auth: { api: { updateUser: mocks.updateUser } },
}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

const { default: sendContactMessage } = await import("./sendContactMessage");
const { updateProfile } = await import("./auth/updateProfile");
const { HONEYPOT_FIELD } = await import("@/lib/honeypot");
const { SHOP_EMAIL } = await import("@/lib/email");

const idle: ActionState = { status: "idle", message: "" };

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.append(key, value);
  return data;
}

beforeEach(() => {
  mocks.allowRequest.mockReset().mockResolvedValue(true);
  mocks.sendEmail.mockReset().mockResolvedValue(true);
  mocks.updateUser.mockReset().mockResolvedValue({});
  mocks.revalidatePath.mockReset();
});

describe("sendContactMessage", () => {
  const message = {
    name: " Sara ",
    email: " sara@example.com ",
    subject: "Wholesale\r\nBcc: everyone@example.com",
    message: " Do you sell 5kg bags? ",
  };

  it("emails the shop with the customer as the reply address", async () => {
    expect(await sendContactMessage(idle, form(message))).toEqual({
      status: "success",
      message: "Thanks. Your message has been sent.",
    });
    expect(mocks.sendEmail).toHaveBeenCalledWith({
      to: SHOP_EMAIL,
      replyTo: "sara@example.com",
      // Line breaks can't sneak extra headers into the subject.
      subject: "[Website contact] Wholesale Bcc: everyone@example.com",
      text: [
        "Name: Sara",
        "Email: sara@example.com",
        "Subject: Wholesale\r\nBcc: everyone@example.com",
        "",
        "Do you sell 5kg bags?",
      ].join("\n"),
    });
  });

  it("delivers to SHOP_INBOX_EMAIL when the shop's own mailbox is elsewhere", async () => {
    vi.stubEnv("SHOP_INBOX_EMAIL", " qaf.orders@gmail.com ");
    try {
      await sendContactMessage(idle, form(message));
    } finally {
      vi.unstubAllEnvs();
    }
    expect(mocks.sendEmail.mock.calls[0][0].to).toBe("qaf.orders@gmail.com");
  });

  it("stops a visitor flooding the shop's inbox", async () => {
    mocks.allowRequest.mockResolvedValue(false);

    expect(await sendContactMessage(idle, form(message))).toEqual({
      status: "failed",
      message:
        "You've sent several messages in a row. Please wait a few minutes and try again.",
    });
    expect(mocks.allowRequest).toHaveBeenCalledWith("contact", {
      max: 5,
      windowMs: 10 * 60 * 1000,
    });
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("quietly drops bot submissions", async () => {
    expect(
      await sendContactMessage(
        idle,
        form({ ...message, [HONEYPOT_FIELD]: "https://spam.example" }),
      ),
    ).toMatchObject({ status: "success" });
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it.each([
    ["a blank field", { name: "  " }],
    ["an invalid email", { email: "sara at example" }],
    ["a name over 100 characters", { name: "x".repeat(101) }],
    ["a subject over 200 characters", { subject: "x".repeat(201) }],
    ["a message over 5000 characters", { message: "x".repeat(5001) }],
  ])("rejects %s", async (_, overrides) => {
    expect(
      await sendContactMessage(idle, form({ ...message, ...overrides })),
    ).toMatchObject({ status: "failed" });
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("rejects a form with fields missing", async () => {
    expect(
      await sendContactMessage(idle, form({ name: "Sara" })),
    ).toMatchObject({
      status: "failed",
      message: "Please complete all fields.",
    });
  });

  it("tells the customer when the email couldn't be sent", async () => {
    mocks.sendEmail.mockResolvedValue(false);
    expect(await sendContactMessage(idle, form(message))).toEqual({
      status: "failed",
      message: "Unable to send your message.",
    });
  });
});

describe("updateProfile", () => {
  it("saves the trimmed name", async () => {
    expect(await updateProfile("  Sara Ahmed  ")).toEqual({ success: true });
    expect(mocks.updateUser).toHaveBeenCalledWith(
      expect.objectContaining({ body: { name: "Sara Ahmed" } }),
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/user");
  });

  it.each(["S", "   ", "x".repeat(81)])("rejects the name %j", async (name) => {
    expect(await updateProfile(name)).toEqual({
      success: false,
      error: "Name must be between 2 and 80 characters",
    });
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it("rejects input that isn't text instead of crashing", async () => {
    for (const name of [undefined, null, 42, { name: "Sara" }]) {
      expect(await updateProfile(name as never)).toMatchObject({
        success: false,
      });
    }
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it("reports a failed update", async () => {
    mocks.updateUser.mockRejectedValue(new Error("unauthorized"));
    expect(await updateProfile("Sara")).toEqual({
      success: false,
      error: "Could not update your profile",
    });
  });
});

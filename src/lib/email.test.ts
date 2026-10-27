import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createTransport: vi.fn(),
  sendMail: vi.fn(),
  resendSend: vi.fn(),
  resendKeys: [] as string[],
}));

vi.mock("nodemailer", () => ({
  default: { createTransport: mocks.createTransport },
}));
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mocks.resendSend };
    constructor(key: string) {
      mocks.resendKeys.push(key);
    }
  },
}));

const { emailButton, emailLayout, linkEmail, linkLocale, sendEmail } =
  await import("./email");

const message = {
  to: "customer@example.com",
  subject: "Verify your email address",
  text: "Click the link",
  html: "<p>Click the link</p>",
};

function useSmtp(overrides: Record<string, string> = {}) {
  const env = {
    SMTP_HOST: "smtp.gmail.com",
    SMTP_PORT: "465",
    SMTP_USER: "qaf.test@gmail.com",
    SMTP_PASS: "app-password",
    SMTP_FROM: "",
    ...overrides,
  };
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
}

function useResend() {
  vi.stubEnv("RESEND_API_KEY", "re_test");
  vi.stubEnv("RESEND_FROM_EMAIL", "Qaf Coffee <orders@qafcoffee.store>");
}

beforeEach(() => {
  mocks.sendMail.mockReset().mockResolvedValue({ messageId: "1" });
  mocks.createTransport.mockReset().mockReturnValue({
    sendMail: mocks.sendMail,
  });
  mocks.resendSend
    .mockReset()
    .mockResolvedValue({ data: { id: "1" }, error: null });
  // Nothing configured unless a test says so.
  for (const key of [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "SMTP_FROM",
    "RESEND_API_KEY",
    "RESEND_FROM_EMAIL",
    "SHOP_INBOX_EMAIL",
  ]) {
    vi.stubEnv(key, "");
  }
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("sendEmail over SMTP", () => {
  it("sends through the configured mailbox, as that mailbox", async () => {
    useSmtp();

    expect(await sendEmail({ ...message, replyTo: "shop@example.com" })).toBe(
      true,
    );

    expect(mocks.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user: "qaf.test@gmail.com", pass: "app-password" },
      }),
    );
    expect(mocks.sendMail).toHaveBeenCalledWith({
      from: "qaf.test@gmail.com",
      ...message,
      replyTo: "shop@example.com",
    });
  });

  it("uses SMTP_FROM as the sender when set", async () => {
    useSmtp({ SMTP_FROM: "Qaf Coffee <qaf.test@gmail.com>" });

    await sendEmail(message);

    expect(mocks.sendMail.mock.calls[0][0].from).toBe(
      "Qaf Coffee <qaf.test@gmail.com>",
    );
  });

  it("upgrades with STARTTLS on port 587", async () => {
    useSmtp({ SMTP_PORT: "587" });
    await sendEmail(message);
    expect(mocks.createTransport.mock.calls[0][0]).toMatchObject({
      port: 587,
      secure: false,
    });
  });

  it("defaults to port 465", async () => {
    useSmtp({ SMTP_PORT: "" });
    await sendEmail(message);
    expect(mocks.createTransport.mock.calls[0][0]).toMatchObject({
      port: 465,
      secure: true,
    });
  });

  it("gives up on a slow mail server instead of hanging checkout", async () => {
    useSmtp();
    await sendEmail(message);

    const options = mocks.createTransport.mock.calls[0][0];
    expect(options.connectionTimeout).toBeLessThanOrEqual(10_000);
    expect(options.socketTimeout).toBeLessThanOrEqual(30_000);
  });

  it("wins over Resend when both are configured", async () => {
    useSmtp();
    useResend();

    await sendEmail(message);

    expect(mocks.sendMail).toHaveBeenCalled();
    expect(mocks.resendSend).not.toHaveBeenCalled();
  });

  it("reports a failed send instead of throwing", async () => {
    useSmtp();
    mocks.sendMail.mockRejectedValue(new Error("Invalid login: 535"));

    expect(await sendEmail(message)).toBe(false);
    expect(console.error).toHaveBeenCalledWith(
      'Email "Verify your email address" failed:',
      "Invalid login: 535",
    );
  });

  it.each(["SMTP_HOST", "SMTP_USER", "SMTP_PASS"])(
    "is skipped without %s",
    async (missing) => {
      useSmtp({ [missing]: "" });
      useResend();

      expect(await sendEmail(message)).toBe(true);
      expect(mocks.createTransport).not.toHaveBeenCalled();
      expect(mocks.resendSend).toHaveBeenCalled();
    },
  );
});

describe("sendEmail over Resend", () => {
  it("sends from the configured address", async () => {
    useResend();

    expect(await sendEmail(message)).toBe(true);
    expect(mocks.resendSend).toHaveBeenCalledWith({
      from: "Qaf Coffee <orders@qafcoffee.store>",
      ...message,
      replyTo: "sales@qafcoffee.store",
    });
    expect(mocks.resendKeys).toContain("re_test");
  });

  it("reports Resend's refusal, e.g. an unverified domain", async () => {
    useResend();
    mocks.resendSend.mockResolvedValue({
      data: null,
      error: {
        message: "You can only send testing emails to your own address",
      },
    });

    expect(await sendEmail(message)).toBe(false);
    expect(console.error).toHaveBeenCalledWith(
      'Email "Verify your email address" failed:',
      "You can only send testing emails to your own address",
    );
  });

  it("reports a network failure instead of throwing", async () => {
    useResend();
    mocks.resendSend.mockRejectedValue(new Error("fetch failed"));
    expect(await sendEmail(message)).toBe(false);
  });
});

describe("reply address", () => {
  it("sends customers' replies to the shop, not to a no-reply sender", async () => {
    useSmtp();
    await sendEmail(message);
    expect(mocks.sendMail.mock.calls[0][0].replyTo).toBe(
      "sales@qafcoffee.store",
    );
  });

  it("uses SHOP_INBOX_EMAIL when it's set", async () => {
    useSmtp();
    vi.stubEnv("SHOP_INBOX_EMAIL", "qaf.orders@gmail.com");
    await sendEmail(message);
    expect(mocks.sendMail.mock.calls[0][0].replyTo).toBe(
      "qaf.orders@gmail.com",
    );
  });

  it("keeps a reply address the sender chose", async () => {
    useSmtp();
    await sendEmail({ ...message, replyTo: "sara@example.com" });
    expect(mocks.sendMail.mock.calls[0][0].replyTo).toBe("sara@example.com");
  });

  it("adds none to a message for the shop itself", async () => {
    useSmtp();
    await sendEmail({ ...message, to: "sales@qafcoffee.store" });
    expect(mocks.sendMail.mock.calls[0][0]).not.toHaveProperty("replyTo");
  });
});

it("doesn't send, and says why, when no sender is configured", async () => {
  expect(await sendEmail(message)).toBe(false);
  expect(console.error).toHaveBeenCalledWith(
    expect.stringContaining("SMTP_HOST"),
  );
  expect(mocks.createTransport).not.toHaveBeenCalled();
  expect(mocks.resendSend).not.toHaveBeenCalled();
});

describe("linkEmail", () => {
  it("puts the link in the text and escapes the HTML", async () => {
    useSmtp();

    await linkEmail({
      to: "customer@example.com",
      subject: "Reset your password",
      intro: "Hi <Sara>, reset it here.",
      url: "https://shop.test/reset?token=a&b=1",
      action: "Choose a new password",
      outro: "Ignore this if it wasn't you.",
    });

    const sent = mocks.sendMail.mock.calls[0][0];
    expect(sent.text).toBe(
      "Hi <Sara>, reset it here.\n\nhttps://shop.test/reset?token=a&b=1\n\nIgnore this if it wasn't you.",
    );
    expect(sent.html).toContain("Hi &lt;Sara&gt;, reset it here.");
    expect(sent.html).toContain(
      'href="https://shop.test/reset?token=a&amp;b=1"',
    );
    expect(sent.html).not.toContain("<Sara>");
  });
});

describe("linkLocale", () => {
  it("reads the language of the page the link returns to", () => {
    expect(
      linkLocale(
        "https://shop.test/api/auth/verify-email?token=t&callbackURL=%2Fen%2Fverify-email",
      ),
    ).toBe("en");
    expect(
      linkLocale(
        "https://shop.test/api/auth/reset-password/abc?callbackURL=%2Fen%2Freset-password",
      ),
    ).toBe("en");
    expect(
      linkLocale(
        "https://shop.test/api/auth/verify-email?token=t&callbackURL=%2Fverify-email",
      ),
    ).toBe("ar");
  });

  it("falls back to Arabic, the default", () => {
    expect(linkLocale("https://shop.test/api/auth/verify-email?token=t")).toBe(
      "ar",
    );
    expect(linkLocale("not a url")).toBe("ar");
    expect(
      linkLocale("https://shop.test/x?callbackURL=%2Fenglish%2Fverify-email"),
    ).toBe("ar");
  });
});

describe("emailLayout", () => {
  it("lays Arabic emails out right to left", () => {
    const html = emailLayout("عنوان", "<p>نص</p>", "ar");
    expect(html).toContain('<html lang="ar" dir="rtl">');
    expect(html).toContain("text-align:right");
    expect(html).toContain("قهوة قاف");
    expect(html).toContain(
      "لديك سؤال؟ ردّ على هذه الرسالة أو راسلنا على sales@qafcoffee.store.",
    );
  });

  it("keeps English emails as they were", () => {
    const html = emailLayout("Title", "<p>Body</p>");
    expect(html).toContain('<html lang="en" dir="ltr">');
    expect(html).toContain("Qaf Coffee");
    expect(html).toContain(
      "Questions? Reply to this email or write to sales@qafcoffee.store.",
    );
  });
});

it("escapes attribute-breaking characters in buttons", () => {
  expect(emailButton('x" onclick="alert(1)', "Go")).not.toContain(
    '" onclick="',
  );
});

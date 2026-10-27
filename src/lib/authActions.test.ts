import { beforeEach, describe, expect, it, vi } from "vitest";

import ar from "@/i18n/messages/ar";
import en from "@/i18n/messages/en";
import type { ActionState } from "@/types/customTypes";

const mocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
  sendVerificationEmail: vi.fn(),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: { email: mocks.signIn },
    signUp: { email: mocks.signUp },
    requestPasswordReset: mocks.requestPasswordReset,
    resetPassword: mocks.resetPassword,
    sendVerificationEmail: mocks.sendVerificationEmail,
  },
}));

const {
  requestPasswordResetAction,
  resendVerificationEmail,
  resetPasswordAction,
  signInAction,
  signUpAction,
} = await import("./authActions");

const idle: ActionState = { status: "idle", message: "" };
const english = { locale: "en" as const, results: en.auth.results };
const arabic = { locale: "ar" as const, results: ar.auth.results };

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.append(key, value);
  return data;
}

const signUpForm = form({
  name: "Sara Ahmed",
  email: "sara@example.com",
  password: "long-enough",
});

beforeEach(() => {
  for (const mock of Object.values(mocks)) {
    mock.mockReset().mockResolvedValue({ error: null });
  }
});

describe("auth actions", () => {
  it("ask for verification links back to a page in the form's language", async () => {
    await signUpAction(idle, signUpForm, arabic);
    await signInAction(
      idle,
      form({ email: "sara@example.com", password: "x" }),
      arabic,
    );
    await resendVerificationEmail("sara@example.com", arabic);
    await requestPasswordResetAction(
      idle,
      form({ email: "sara@example.com" }),
      arabic,
    );

    // The emails' language follows these addresses (src/lib/auth.ts).
    expect(mocks.signUp.mock.calls[0][0].callbackURL).toBe("/ar/verify-email");
    expect(mocks.signIn.mock.calls[0][0].callbackURL).toBe("/ar/verify-email");
    expect(mocks.sendVerificationEmail.mock.calls[0][0].callbackURL).toBe(
      "/ar/verify-email",
    );
    expect(mocks.requestPasswordReset.mock.calls[0][0].redirectTo).toBe(
      "/ar/reset-password",
    );

    await signUpAction(idle, signUpForm, english);
    expect(mocks.signUp.mock.calls[1][0].callbackURL).toBe("/verify-email");
  });

  it("report back in the form's language", async () => {
    expect(await signUpAction(idle, signUpForm, arabic)).toEqual({
      status: "success",
      message: "اقتربت! أرسلنا رابط تأكيد إلى بريدك الإلكتروني.",
    });
    expect(
      await signUpAction(
        idle,
        form({ name: "Sara", email: "sara@example.com", password: "short" }),
        arabic,
      ),
    ).toEqual({
      status: "failed",
      message: "يجب ألا تقل كلمة المرور عن 8 أحرف",
    });
    expect(
      await resetPasswordAction(idle, form({ password: "long-enough" }), arabic),
    ).toEqual({
      status: "failed",
      message: "رابط إعادة التعيين غير صالح. يُرجى طلب رابط جديد.",
    });
  });

  it("keep the unverified-email code whatever the language", async () => {
    mocks.signIn.mockResolvedValue({ error: { status: 403 } });

    expect(
      await signInAction(
        idle,
        form({ email: "sara@example.com", password: "x" }),
        arabic,
      ),
    ).toEqual({
      status: "failed",
      message: ar.auth.results.verifyEmail,
      code: "EMAIL_NOT_VERIFIED",
    });
  });

  it("only pass Better Auth's own (English) explanation on in English", async () => {
    mocks.signUp.mockResolvedValue({
      error: { status: 422, message: "Password too long" },
    });

    expect(await signUpAction(idle, signUpForm, english)).toMatchObject({
      message: "Password too long",
    });
    expect(await signUpAction(idle, signUpForm, arabic)).toMatchObject({
      message: "تعذّر إنشاء حسابك",
    });
  });

  it("say when they're rate limited", async () => {
    mocks.requestPasswordReset.mockResolvedValue({ error: { status: 429 } });

    expect(
      await requestPasswordResetAction(
        idle,
        form({ email: "sara@example.com" }),
        english,
      ),
    ).toEqual({
      status: "failed",
      message: "Too many attempts. Please wait a few minutes and try again.",
    });
  });
});

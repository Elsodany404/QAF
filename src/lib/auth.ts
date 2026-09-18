import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { Pool } from "pg";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const database = new Pool({
  connectionString: process.env.SUPABASE_CONNECTION_STRING,
});

export const auth = betterAuth({
  database,
  baseURL: process.env.NEXT_PUBLIC_SITE_URL,
  plugins: [
    nextCookies(), // Automatically synchronizes Better Auth cookies in Server Actions
  ],

  emailVerification: {
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url, token }, request) => {
      void resend.emails.send({
        from: "onboarding@resend.dev",
        to: user.email,
        subject: "Verify your email address",
        text: `Click the link to verify your email: ${url}`,
      });
    },
  },
  emailAndPassword: {
    requireEmailVerification: true,
    enabled: true,
    autoSignIn: false,
    onExistingUserSignUp: async ({ user }, request) => {
      void resend.emails.send({
        from: "onboarding@resend.dev",
        to: user.email,
        subject: "Sign-up attempt with your email",
        text: "Someone tried to create an account using your email address. If this was you, try signing in instead. If not, you can safely ignore this email.",
      });
    },
  },
});

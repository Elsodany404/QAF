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
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false,
        returned: true,
      },
    },
  },
  session: {
    // Maximum session lifetime: 30 days
    expiresIn: 60 * 60 * 24 * 30,

    // Refresh the session expiration when the user is active.
    // This prevents an active user from unexpectedly getting logged out.
    updateAge: 60 * 60 * 24,
  },

  plugins: [nextCookies()],

  emailVerification: {
    autoSignInAfterVerification: true,

    sendVerificationEmail: async ({ user, url }) => {
      void resend.emails.send({
        from: "onboarding@resend.dev",
        to: user.email,
        subject: "Verify your email address",
        text: `Click the link to verify your email: ${url}`,
      });
    },
  },

  emailAndPassword: {
    enabled: true,

    // User must verify email before being considered authenticated.
    requireEmailVerification: true,

    // Don't automatically log them in immediately after password signup.
    autoSignIn: false,

    onExistingUserSignUp: async ({ user }) => {
      void resend.emails.send({
        from: "onboarding@resend.dev",
        to: user.email,
        subject: "Sign-up attempt with your email",
        text: "Someone tried to create an account using your email address. If this was you, try signing in instead. If not, you can safely ignore this email.",
      });
    },
  },
});

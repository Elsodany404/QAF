import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";

// No baseURL: in the browser the client calls /api/auth on whatever origin
// the page was loaded from, so localhost, the dev tunnel and production all
// work with the same build.
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});

export const { useSession } = authClient;

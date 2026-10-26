import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // Next.js lets server code import it; plain Node (the tests) would throw.
      "server-only": fileURLToPath(
        new URL("./node_modules/server-only/empty.js", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Tests must never reach real services.
    env: {
      NEXT_PUBLIC_SITE_URL: "https://shop.test",
      NEXT_PUBLIC_SUPABASE_URL: "https://supabase.test",
      SUPABASE_SECRET_KEY: "test-secret",
      PAYMOB_SECRET_KEY: "paymob-secret",
      PAYMOB_HMAC_KEY: "paymob-hmac",
      NEXT_PUBLIC_PAYMOB_PUBLIC_KEY: "paymob-public",
      PAYMOB_CARD_INTEGRATION_ID: "111",
      PAYMOB_MOBILE_WALLET_INTEGRATION_ID: "222",
      BOSTA_API_KEY: "bosta-key",
      BOSTA_SECRET_KEY: "bosta-webhook-secret",
      BOSTA_BUSINESS_LOCATION_ID: "loc-1",
    },
  },
});

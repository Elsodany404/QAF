"use client";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CartProvider } from "@/context/CartContext";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  // One client per browser tab. A module-level client would be shared by
  // every request rendered on the server.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 3000,
          style: {
            background: "white",
            color: "var(--charcoal-900)",
            border: "1px solid var(--cream-200)",
            fontFamily: "var(--font-body)",
          },
          success: {
            iconTheme: {
              primary: "var(--success-600)",
              secondary: "white",
            },
          },
          error: {
            iconTheme: {
              primary: "var(--danger-500)",
              secondary: "white",
            },
          },
        }}
      />
      <CartProvider>{children}</CartProvider>
    </QueryClientProvider>
  );
}

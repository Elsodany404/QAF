"use client";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ToastCard from "@/components/Toast/Toast";
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
        gutter={10}
        // Below the fixed navbar, so a toast never hides the cart or menu.
        containerStyle={{ top: "calc(var(--nav-height) + 0.75rem)" }}
        toastOptions={{
          duration: 3000,
          // Errors and notices take longer to read.
          error: {
            duration: 5000,
            ariaProps: { role: "alert", "aria-live": "assertive" },
          },
          blank: { duration: 5000 },
        }}
      >
        {(t) => <ToastCard t={t} />}
      </Toaster>
      <CartProvider>{children}</CartProvider>
    </QueryClientProvider>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const INTERVAL_MS = 3000;
// About a minute. Paymob's webhook normally lands within seconds.
const MAX_REFRESHES = 20;

/**
 * Re-renders the page every few seconds while the payment is still being
 * confirmed. Once the webhook has updated the order, the page renders the
 * confirmed (or failed) state and this component unmounts.
 */
export default function RefreshWhilePending() {
  const router = useRouter();

  useEffect(() => {
    let refreshes = 0;
    const timer = setInterval(() => {
      refreshes += 1;
      router.refresh();
      if (refreshes >= MAX_REFRESHES) clearInterval(timer);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [router]);

  return null;
}

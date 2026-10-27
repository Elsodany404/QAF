import { useCallback, useEffect, useState } from "react";
import type { PaymentMethod } from "@/types/customTypes";

type UseShippingFeesProps = {
  paymentMethod: PaymentMethod;
  cartPrice: number;
  cityName: string | null;
  /** Shown when Bosta couldn't price the city. */
  errorMessage: string;
};

type Quote = { key: string; fees: number | null; failed: boolean };

/**
 * Live Bosta shipping quote for the checkout. `shippingFees` stays null until
 * a real price is known, so the UI never shows (or charges against) a made-up
 * zero: no city yet, a request in flight, or a failed lookup all look
 * different from "free shipping".
 */
export default function useShippingFees({
  cityName,
  cartPrice,
  paymentMethod,
  errorMessage,
}: UseShippingFeesProps) {
  // Bosta prices cash-on-delivery shipments by the amount collected, so the
  // cart total only matters for COD.
  const cod = paymentMethod === "cash_on_delivery" ? cartPrice : 0;
  const [attempt, setAttempt] = useState(0);
  const [quote, setQuote] = useState<Quote | null>(null);

  const key = cityName ? `${cityName}|${cod}|${attempt}` : null;

  useEffect(() => {
    if (!key || !cityName) return;
    const controller = new AbortController();

    fetch(
      `/api/payment-fees?dropOffCity=${encodeURIComponent(cityName)}&cod=${cod}`,
      { signal: controller.signal, cache: "no-store" },
    )
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        const fees = Number(data?.shippingFees);
        if (!response.ok || !data?.success || !Number.isFinite(fees) || fees < 0) {
          throw new Error(
            typeof data?.error === "string" ? data.error : `HTTP ${response.status}`,
          );
        }
        setQuote({ key, fees, failed: false });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.error("Shipping fee request failed:", error);
        setQuote({ key, fees: null, failed: true });
      });

    return () => controller.abort();
  }, [key, cityName, cod]);

  const retryShippingFees = useCallback(() => setAttempt((n) => n + 1), []);

  // A quote only counts for the city/amount it was fetched for.
  const current = quote && quote.key === key ? quote : null;

  return {
    shippingFees: current?.fees ?? null,
    shippingFeesLoading: key !== null && current === null,
    shippingFeesError: current?.failed ? errorMessage : null,
    retryShippingFees,
  };
}

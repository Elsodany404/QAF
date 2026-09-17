import { PaymentMethod } from "@/types/customTypes";
import { useEffect, useState } from "react";

type UseShippingFeesProps = {
  paymentMethod: PaymentMethod;
  cartPrice: number;
  cityName: string | null;
};

export default function useShippingFees({
  cityName,
  cartPrice,
  paymentMethod,
}: UseShippingFeesProps) {
  const [shippingFees, setShippingFees] = useState(0);
  const [taxOnCod, setTaxOnCod] = useState(0);
  const [shippingFeesLoading, setShippingFeesLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchShippingFees() {
      if (!cityName) {
        setShippingFees(0);
        setTaxOnCod(0);
        setShippingFeesLoading(false);
        return;
      }

      setShippingFeesLoading(true);

      try {
        const cod =
          paymentMethod === "cash_on_delivery" ? Number(cartPrice) : 0;

        const response = await fetch(
          `/api/payment-fees?dropOffCity=${cityName}&cod=${cod}`,
          {
            signal: controller.signal,
            cache: "no-store",
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error ||
              `Payment fees API returned status ${response.status}`,
          );
        }

        if (!data?.success) {
          throw new Error(data?.error || "Failed to determine shipping fees");
        }

        const fees = Number(data.shippingFees);

        if (!Number.isFinite(fees) || fees < 0) {
          throw new Error("Invalid shipping fees returned by API");
        }

        setShippingFees(fees);

        // Your current Bosta API response doesn't expose a COD tax.
        setTaxOnCod(0);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        console.error("Shipping fee request failed:", error);

        setShippingFees(0);
        setTaxOnCod(0);
      } finally {
        if (!controller.signal.aborted) {
          setShippingFeesLoading(false);
        }
      }
    }

    fetchShippingFees();

    return () => {
      controller.abort();
    };
  }, [cityName, paymentMethod, cartPrice]);

  return {
    shippingFees,
    shippingFeesLoading,
    taxOnCod,
  };
}

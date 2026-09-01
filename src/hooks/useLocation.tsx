import { useState } from "react";
import { UseFormSetValue } from "react-hook-form";
import { toast } from "react-hot-toast"; // Adjust based on your toast library
import useGeolocation from "./useGeolocation";
import { FormValues } from "../types/customTypes";

export function useLocationHandler(setValue: UseFormSetValue<FormValues>) {
  const [isLoading, setIsLoading] = useState(false);
  const { getCurrentLocation, reverseGeocode } = useGeolocation();

  const handleGetAddress = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const coords = await getCurrentLocation();
      const data = await reverseGeocode(coords.latitude, coords.longitude);
      const { road, suburb, city, state, country } = data.address;

      const streetAddress = road || suburb || "";
      if (streetAddress) {
        setValue("streetAddress", streetAddress);
      }

      const formattedAddress = [road, suburb, city, state, country]
        .filter(Boolean)
        .join(", ");
      const finalAddress = formattedAddress || data.display_name;
      setValue("details", finalAddress);

      toast.success("Location identified successfully!");
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error(
          "An unexpected error occurred while fetching your location.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { handleGetAddress, isLoading };
}

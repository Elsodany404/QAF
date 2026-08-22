import { useState } from "react";

export interface ReverseGeocodeResult {
  display_name: string;
  address: {
    road?: string;
    neighbourhood?: string;
    quarter?: string;
    suburb?: string;
    city_district?: string;
    state_district?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

export default function useGeolocation() {
  const [loading, setLoading] = useState(false);

  const LOCATIONIQ_API_KEY = "pk.e9207a39050a602620d00872fe07f624";

  async function reverseGeocode(latitude: number, longitude: number) {
    const response = await fetch(
      `https://us1.locationiq.com/v1/reverse?key=${LOCATIONIQ_API_KEY}&lat=${latitude}&lon=${longitude}&format=json&accept-language=en`,
    );

    if (!response.ok) {
      throw new Error("Failed to reverse geocode location.");
    }

    const data = await response.json();
    return {
      display_name: data.display_name,
      address: {
        road:
          data.address.road ||
          data.address.pedestrian ||
          data.address.neighborhood,
        suburb:
          data.address.suburb ||
          data.address.residential ||
          data.address.city_district,
        city: data.address.city || data.address.town || data.address.county,
        state: data.address.state,
        country: data.address.country,
        postcode: data.address.postcode,
      },
    };
  }

  function getCurrentLocation(): Promise<GeolocationCoordinates> {
    setLoading(true);

    if (!navigator.geolocation) {
      setLoading(false);
      return Promise.reject(
        new Error("Geolocation is not supported by your browser."),
      );
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          setLoading(false);
          resolve(coords);
        },
        (error) => {
          setLoading(false);
          let errorMessage = "Unable to retrieve your location.";
          if (error.code === error.PERMISSION_DENIED) {
            errorMessage =
              "Location access denied. Please allow permission in your browser.";
          } else if (error.code === error.TIMEOUT) {
            errorMessage = "Location request timed out. Try again.";
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true, // Forces hardware/GPS sensor over IP estimation
          timeout: 10000, // 10-second request timeout
          maximumAge: 0, // Prevents returning cached stale location
        },
      );
    });
  }

  return {
    loading,
    getCurrentLocation,
    reverseGeocode,
  };
}

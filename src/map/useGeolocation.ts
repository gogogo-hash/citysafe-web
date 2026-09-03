import { useEffect, useState } from "react";

interface Coordinates {
  lat: number;
  lng: number;
}

type GeolocationState =
  | { status: "loading"; position: null }
  | { status: "success"; position: Coordinates }
  | { status: "error"; position: null };

export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    status: "loading",
    position: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ status: "error", position: null });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (result) => {
        setState({
          status: "success",
          position: {
            lat: result.coords.latitude,
            lng: result.coords.longitude,
          },
        });
      },
      () => {
        setState({ status: "error", position: null });
      }
    );
  }, []);

  return state;
}

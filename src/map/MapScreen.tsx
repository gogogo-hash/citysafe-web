import { useCallback, useEffect, useState } from "react";
import {
  APIProvider,
  AdvancedMarker,
  Map,
  type MapEvent,
  type MapMouseEvent,
} from "@vis.gl/react-google-maps";
import { useNavigate, useOutletContext } from "react-router-dom";

import type { RootLayoutContext } from "@/app/RootLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ReportMarker } from "@/map/ReportMarker";
import { SearchBar } from "@/map/SearchBar";
import { useGeolocation } from "@/map/useGeolocation";
import { useReportsInBounds } from "@/map/useReportsInBounds";
import type { Bounds } from "@/services/reportsService";

const LOCATION_ERROR_DISPLAY_MS = 5000;

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Centered on Japan — used only when geolocation is denied/unavailable, so
// the map still shows something useful rather than centering on the ocean
// at (0, 0).
const FALLBACK_CENTER = { lat: 36.2048, lng: 138.2529 };
const FALLBACK_ZOOM = 5;
const LOCATED_ZOOM = 15;

export default function MapScreen() {
  const navigate = useNavigate();
  const { mapView, setMapView } = useOutletContext<RootLayoutContext>();
  const geolocation = useGeolocation();
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [showLocationError, setShowLocationError] = useState(false);

  const { data: reports } = useReportsInBounds(bounds);

  useEffect(() => {
    if (geolocation.status !== "error") return;

    setShowLocationError(true);
    const timeout = setTimeout(() => setShowLocationError(false), LOCATION_ERROR_DISPLAY_MS);
    return () => clearTimeout(timeout);
  }, [geolocation.status]);

  const handleIdle = useCallback(
    (event: MapEvent) => {
      const mapBounds = event.map.getBounds();
      if (mapBounds) {
        const northEast = mapBounds.getNorthEast();
        const southWest = mapBounds.getSouthWest();
        setBounds({
          north: northEast.lat(),
          east: northEast.lng(),
          south: southWest.lat(),
          west: southWest.lng(),
        });
      }

      const mapCenter = event.map.getCenter();
      const mapZoom = event.map.getZoom();
      if (mapCenter && mapZoom !== undefined) {
        setMapView({ center: { lat: mapCenter.lat(), lng: mapCenter.lng() }, zoom: mapZoom });
      }
    },
    [setMapView]
  );

  const handleMapClick = useCallback((event: MapMouseEvent) => {
    if (event.detail.latLng) {
      setPin(event.detail.latLng);
    }
  }, []);

  // A remembered view (e.g. returning from submitting a report) always wins
  // over geolocation, so we skip re-locating the user entirely in that case.
  if (!mapView && geolocation.status === "loading") {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Finding your location…</p>
      </div>
    );
  }

  const center = mapView?.center ?? geolocation.position ?? FALLBACK_CENTER;
  const zoom = mapView?.zoom ?? (geolocation.position ? LOCATED_ZOOM : FALLBACK_ZOOM);

  return (
    <div className="relative h-full w-full">
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
        <Map
          className="h-full w-full"
          mapId="DEMO_MAP_ID"
          mapTypeId="roadmap"
          defaultCenter={center}
          defaultZoom={zoom}
          disableDefaultUI
          gestureHandling="greedy"
          onClick={handleMapClick}
          onIdle={handleIdle}
        >
          {reports?.map((report) => <ReportMarker key={report.id} report={report} />)}
          {pin && <AdvancedMarker position={pin} />}
        </Map>

        <SearchBar onPlaceSelected={setPin} />
      </APIProvider>

      {!mapView && geolocation.status === "error" && (
        <div
          className={cn(
            "absolute inset-x-4 top-20 z-10 mx-auto max-w-sm rounded-lg bg-background/95 p-3 text-center text-sm shadow-lg transition-opacity duration-700",
            showLocationError ? "opacity-100" : "pointer-events-none opacity-0"
          )}
        >
          Couldn't get your location — search above or tap the map to drop a pin.
        </div>
      )}

      {pin && (
        <div className="absolute inset-x-4 bottom-8 z-10 flex justify-center">
          <Button
            className="shadow-lg"
            onClick={() => navigate("/add", { state: { lat: pin.lat, lng: pin.lng } })}
          >
            Report Incident Here
          </Button>
        </div>
      )}
    </div>
  );
}

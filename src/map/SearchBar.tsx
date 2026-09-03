import { useEffect, useRef, useState } from "react";
import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";

interface SearchBarProps {
  onPlaceSelected: (location: { lat: number; lng: number }) => void;
}

export function SearchBar({ onPlaceSelected }: SearchBarProps) {
  const map = useMap();
  const placesLibrary = useMapsLibrary("places");
  const containerRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!placesLibrary || !expanded || !containerRef.current) return;

    const container = containerRef.current;
    const autocomplete = new placesLibrary.PlaceAutocompleteElement();
    autocomplete.style.height = "32px";
    container.appendChild(autocomplete);

    const handleSelect = async (event: google.maps.places.PlacePredictionSelectEvent) => {
      const { place } = await event.placePrediction.toPlace().fetchFields({
        fields: ["location"],
      });

      if (place.location) {
        onPlaceSelected({ lat: place.location.lat(), lng: place.location.lng() });
        map?.panTo(place.location);
        map?.setZoom(15);
      }

      setExpanded(false);
    };

    autocomplete.addEventListener("gmp-select", handleSelect);

    return () => {
      autocomplete.removeEventListener("gmp-select", handleSelect);
      container.removeChild(autocomplete);
    };
  }, [placesLibrary, expanded, map, onPlaceSelected]);

  return (
    <div className="absolute inset-x-4 top-4 z-10 mx-auto max-w-sm">
      {expanded ? (
        <div className="flex items-center gap-1 rounded-lg bg-background p-1 shadow-lg">
          <div ref={containerRef} className="min-w-0 flex-1" />
          <Button
            size="icon-sm"
            onClick={() => setExpanded(false)}
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button variant="secondary" className="shadow-lg" onClick={() => setExpanded(true)}>
          <Search className="h-4 w-4" />
          Search for a location
        </Button>
      )}
    </div>
  );
}

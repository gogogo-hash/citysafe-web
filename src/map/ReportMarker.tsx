import { useState } from "react";
import { AdvancedMarker, InfoWindow, useAdvancedMarkerRef } from "@vis.gl/react-google-maps";

import { categoryIcons } from "@/map/categoryIcons";
import type { Report } from "@/types/report";

export function ReportMarker({ report }: { report: Report }) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [open, setOpen] = useState(false);

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: report.lat, lng: report.lng }}
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <img
          src={categoryIcons[report.category]}
          alt={report.category}
          className="h-8 w-8"
        />
      </AdvancedMarker>

      {open && marker && (
        <InfoWindow anchor={marker} onCloseClick={() => setOpen(false)}>
          <div className="max-w-56 space-y-1 p-1">
            <p className="font-medium">{report.category}</p>
            <p className="text-sm text-muted-foreground">{report.description}</p>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

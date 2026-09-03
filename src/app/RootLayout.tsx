import { useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "@/auth/AuthContext";

export interface MapView {
  center: { lat: number; lng: number };
  zoom: number;
}

export interface RootLayoutContext {
  mapView: MapView | null;
  setMapView: (view: MapView) => void;
}

export default function RootLayout() {
  const { user, loading } = useAuth();
  const [mapView, setMapView] = useState<MapView | null>(null);

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  return (
    <div className="h-dvh overflow-auto">
      <Outlet context={{ mapView, setMapView } satisfies RootLayoutContext} />
    </div>
  );
}

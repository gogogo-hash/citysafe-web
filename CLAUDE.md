# CitySafe (Web)

CitySafe is a community-powered neighborhood safety app. Residents report suspicious activity, vandalism, theft, and other safety concerns as pins on a live, shared map, and see what neighbors nearby have reported in real time.

This is a **from-scratch React + TypeScript rewrite** of a prior Flutter app. It targets **web only** — no Android or iOS. It reuses the **existing Firebase project and Firestore data** (same collection, same schema, same live data) — this is a new frontend on an existing backend, not a new product.

Read this whole file before writing code. It is the source of truth for scope, data shape, and conventions — don't infer them from scratch or from general React/Firebase habits.

## Tech stack (fixed — do not substitute)

- **Build tool**: Vite, `react-ts` template
- **Language**: TypeScript, strict mode. No `any` without a `// TODO` comment explaining why.
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui (Radix primitives under the hood). Use shadcn components for dropdowns, form fields, buttons, and dialogs rather than hand-rolling them. Icons for UI chrome (not map markers) come from `lucide-react`, shadcn's default icon set.
- **Data fetching/caching**: TanStack Query (`@tanstack/react-query`) wrapping a typed service layer — never call Firestore directly from a component.
- **Routing**: React Router
- **Maps**: `@vis.gl/react-google-maps` — this is Google's own maintained React library for the Maps JavaScript API, not a third-party wrapper. Do not use `@react-google-maps/api` or `google-maps-react`.
- **Places search**: the current `google.maps.places.PlaceAutocompleteElement` (the "new" Place Autocomplete widget). Do **not** use `google.maps.places.Autocomplete` — that legacy widget is deprecated for new customers as of March 2025.
- **Auth/DB**: Firebase JS SDK, modular v9+ API (`import { getAuth } from "firebase/auth"`, not the namespaced/compat SDK).
- **Testing**: Vitest + React Testing Library for units/components; Playwright for e2e (added once core screens exist).

## Data model — Firestore `reports` collection (already live, do not redesign)

This schema exists today in the production Firestore project. Match it exactly — field names, types, and the collection name — so the new app reads and writes data compatible with what's already there.

```ts
interface Report {
  id: string;             // Firestore document ID
  lat: number;
  lng: number;
  category: IncidentCategory;
  description: string;
  createdBy: string;      // display name, or "anonymous"
  createdAt: string;      // ISO 8601 string (not a Firestore Timestamp)
}

type IncidentCategory =
  | "Suspicious Person"
  | "Vandalism"
  | "Theft"
  | "Noise Complaint";
```

Note `createdAt` is stored as an ISO string, not a Firestore `Timestamp` — the old app wrote it that way and existing documents are in that format, so keep writing/reading it as a string.

### Category → marker icon mapping

Each category has a fixed marker icon (assets provided separately, place under `src/assets/icons/`):

| Category | Icon file |
|---|---|
| Suspicious Person | `suspiciousperson.png` |
| Vandalism | `vandalism.png` |
| Theft | `theft.png` |
| Noise Complaint | `noisecomplaint.png` |

## V1 scope (feature parity — nothing more)

Build exactly these, and no further-out roadmap features yet:

1. **Auth**: sign in with Google, or continue anonymously (Firebase Auth). An auth gate shows the sign-in screen when signed out and the main app when signed in.
2. **Map screen**: full-screen Google Map (roadmap view for now — switched from hybrid to rule out satellite-tile weight while diagnosing slow tile loading on a slow connection; revisit hybrid once that's resolved). On load, center on the user's current location (browser Geolocation API, with a sensible fallback/error state if permission is denied). Tapping the map drops a temporary pin. A collapsible search bar (Place Autocomplete) can also recenter the map. Markers for existing reports load for the current visible bounds and reload when the camera stops moving (pan/zoom idle) — this is a bounding-box query against Firestore (`lat`/`lng` between the visible region's SW/NE corners), not a full-collection fetch. Each marker shows its category and description in an info window/popup.
3. **Add Incident screen**: a form with a category dropdown (the 4 fixed categories) and a description field, pre-filled with the location pinned on the map screen. Submitting writes a new `reports` document to Firestore and returns to the map.
4. **Firestore service layer**: a typed `reportsService` (get-in-bounds, create) that all components go through — this was explicitly missing in the old app and should be done right from the start here, not retrofitted.
5. **Nav**: a bottom nav bar with a single Map tab (this is a mobile-first web app, used mostly on phones in-browser). Add Incident is not a persistent tab — it's reached only via the "Report Incident Here" button that appears on the map after dropping a pin.

### Explicitly out of scope for v1 (don't build yet, don't design around them either)

- Sign in with Apple — never actually set up in the old Flutter app either, and requires a $99/yr Apple Developer Program membership. Not worth it for this project; revisit only if that changes.
- Photo attachments on reports
- Incident detail/edit view
- Offline support
- Any native mobile shell (no Capacitor/PWA wrapper, etc.) — plain responsive web

## Project conventions

```
src/
  app/                  # routes, layout, nav shell
  auth/                 # AuthContext, sign-in page, auth gate
  map/                  # map screen, marker rendering, bounds-based query hook
  incidents/            # add-incident form
  components/ui/        # shadcn-generated components live here
  services/
    firebase.ts         # SDK init (reads from env)
    reportsService.ts   # typed Firestore access for `reports`
    authService.ts
  types/
    report.ts           # Report / IncidentCategory types above
  assets/
    icons/               # category marker PNGs
```

- Components go through hooks (e.g. `useReportsInBounds(bounds)`, `useCreateReport()`) built on TanStack Query wrapping the service layer — never call `firebase/firestore` functions directly inside a component.
- Auth state is exposed via a `useAuth()` hook backed by a Context provider that subscribes to `onAuthStateChanged` once, at the app root.
- Keep files small and colocated by feature (the folders above), not by type (no global `components/`, `hooks/`, `utils/` dumping grounds beyond `components/ui/` for shadcn).

## Environment variables

Create a `.env.example` (committed) documenting these; real values go in a gitignored `.env`:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_GOOGLE_MAPS_API_KEY=
```

Real values come from the Firebase console (same project the old Flutter app uses) and the existing Google Maps API key — never invent placeholder values that look like real keys.

## Non-goals

- No Android/iOS build targets.
- No new Firebase project — this app reads/writes the same `reports` collection the Flutter app used.
- No state management library beyond React Context + TanStack Query at this size (no Redux/Zustand) unless a future feature genuinely needs it.
- No Next.js / SSR — this is a client-only SPA deployed as static files to Firebase Hosting.

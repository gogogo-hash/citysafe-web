

Claude · MD
# CitySafe (Web)
 
CitySafe is a civic safety app for Miyagi Prefecture. It visualizes official crime data — a weighted heatmap of theft incidents — and lets users request an AI-generated summary of crime patterns for a radius around any point on the map.
 
This is a **from-scratch React + TypeScript rewrite** of a prior Flutter app, targeting **web only**. The app originally set out as a crowdsourced "residents report incidents" tool reusing the Flutter app's Firebase/Firestore backend — the `civic-data-ai-layer` milestone (https://github.com/gogogo-hash/citysafe-web/milestone/1) replaced that model entirely. Crowdsourced reporting is removed (not deprioritized), and crime data now comes from **official Miyagi Prefectural Police open data**, stored in **Postgres/PostGIS on Supabase**, not Firestore.
 
Read this whole file before writing code. It is the source of truth for scope, data shape, and conventions — don't infer them from scratch, from general React/Firebase habits, or from memory of this app's earlier crowdsourced-reporting design.
 
## Tech stack (fixed — do not substitute)
 
- **Build tool**: Vite, `react-ts` template
- **Language**: TypeScript, strict mode. No `any` without a `// TODO` comment explaining why.
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui (Radix primitives). Icons for UI chrome come from `lucide-react`.
- **Data fetching/caching**: TanStack Query (`@tanstack/react-query`) wrapping typed service layers — never call Firebase, Supabase, or the crime-data backend directly from a component.
- **Routing**: React Router. GitHub Pages serves no server-side rewrites, so routing runs as `HashRouter` (or the `404.html` SPA-redirect trick) rather than `BrowserRouter` history mode — see Open Decisions, final call not yet made.
- **Maps**: `@vis.gl/react-google-maps`, plus its `visualization` sub-library (`useMapsLibrary('visualization')`) for `google.maps.visualization.HeatmapLayer`. Do not use `@react-google-maps/api` or `google-maps-react`.
- **Places search**: `google.maps.places.PlaceAutocompleteElement` if/when reintroduced. Never the legacy `Autocomplete` widget (deprecated for new customers since March 2025).
- **Auth**: Firebase Auth (JS SDK, modular v9+) — Google, Apple, and anonymous sign-in. Unaffected by the data-layer changes below.
- **Crime data storage**: Postgres + PostGIS on **Supabase** (chosen over Cloud SQL for free-tier cost — 500MB DB / 50K MAU comfortably covers current scale). Any client-side reads go through `@supabase/supabase-js` with the anon key, gated by Row Level Security. The service-role key is never shipped to the browser — it lives only in Cloud Run deploy secrets.
- **Crime-data backend**: two small services on **Google Cloud Run** — `crime-data-api` (radius/aggregation queries) and `generateAreaSummary` (the AI-summary service). See "Backend services" below.
- **Hosting**: **GitHub Pages** via GitHub Actions (not Firebase Hosting — see Non-goals). Repo is public, so this runs on the free tier.
- **Testing**: Vitest + React Testing Library for units/components; Playwright for e2e.
## Data model
 
### `crime_incidents` (Postgres/PostGIS on Supabase — source of truth for crime data)
 
```sql
crime_incidents
  id            bigint / uuid primary key
  category      text        -- one of 7 Miyagi theft categories (see below)
  occurred_on   date
  year          integer     -- derived from occurred_on, used for weight decay
  municipality  text
  town_chome    text
  geog          geography(Point, 4326)   -- spatial index required
  weight        numeric     -- set by the ingestion pipeline (year-decay, ~0.85/year, most recent year = 1.0)
  source        text        -- data traceability
```
 
Categories (Miyagi Police theft data): snatching, vehicle theft, parts theft, vending-machine theft, car theft, motorcycle theft, bicycle theft.
 
**Hard rule: victim demographics (age, occupation, etc.) are excluded at ingestion and must never appear in this table, in API responses, or in AI-summary prompts.** Raw incident rows also never leave the `crime-data-api` service — every consumer (heatmap, AI summary) works from aggregates or a pre-built static file, never row-level queries from the client.
 
Writes to `crime_incidents` come only from the ingestion pipeline (server-side, service-role key). The client never writes to this table.
 
### Heatmap static file
 
The ingestion pipeline emits a static GeoJSON `FeatureCollection` of weighted points as a build artifact, fetched once per session by `useHeatmapData()` — not a live query. Exact filename/path and how it's bundled into the GitHub Pages build are decided alongside the ingestion pipeline and deploy workflow.
 
### Firestore `reports` (legacy — do not use)
 
The original Firebase project's `reports` collection (the crowdsourced-incident schema this app used to read/write) is **abandoned in place**: not migrated, not deleted, not read, not written. It's documented here only so nobody reintroduces it by habit. Firebase Auth (a separate product from Firestore) is still in active use.
 
## V1 scope for this phase (`civic-data-ai-layer` milestone)
 
1. **Auth**: unchanged — Google / Apple / anonymous sign-in via Firebase Auth, gating the app.
2. **Map screen — heatmap**: full-screen Google Map rendering a weighted heatmap of `crime_incidents` (via the static GeoJSON file, not a live query), binned into grid cells when zoomed out and finer/individual points when zoomed in. A chōme-level choropleth is an open alternative worth evaluating, not yet decided (see Open Decisions).
3. **Pin-drop + radius-select**: click the map to drop a pin (same interaction pattern as the old, now-removed Add Incident flow), pick a radius from presets (500m / 1km / 2km — exact default TBD), then a single trigger button requests an AI summary for that area. UI shell only — it never creates a record.
4. **AI area summary**: the trigger calls `crime-data-api` for aggregated, radius-windowed counts by category (plus the prior period, for trend), which `generateAreaSummary` turns into an LLM-written summary. Loading and error states are required. The summary must:
   - be built only from aggregated counts/trends — never raw incident rows, never demographic data
   - use a neutral tone with no speculation
   - explicitly state its scope (radius, time window)
   - include a category breakdown
   - read unambiguously as **CitySafe's** output, never implied to be produced by Miyagi Police
5. **Data attribution (hard requirement, not polish)**: wherever police-derived data or its derivatives are shown (heatmap, AI summaries), display **"宮城県警察ウェブサイト"** (Miyagi Prefectural Police website) plus the source URL (https://www.police.pref.miyagi.jp/seian/opendata.html), and a note that CitySafe has processed/edited the data. Full license terms: https://www.police.pref.miyagi.jp/seian/pdf/riyoukiyaku.pdf.
6. **Nav**: bottom nav bar. The Add Incident tab is gone. A persistent affordance for the AI-summary flow is deferred until the flow actually needs one — it's currently triggered contextually from the map, not from nav.
### Explicitly out of scope
 
- Crowdsourced incident reporting / Add Incident — **removed entirely, not deprioritized.** The Firestore `reports` collection is abandoned in place (see Data model).
- Photo attachments, incident detail/edit view, offline support, any native mobile shell — unchanged from before.
- Raw incident rows or victim demographics ever reaching the client, or appearing in an LLM prompt.
- Live bounds-based crime queries against Postgres — the heatmap uses a static per-session file at current (Miyagi-only) scale. Bounds-based `onCameraIdle` queries against PostGIS are a documented future-scaling path, not v1.
- Caching/memoization of AI summaries — explicitly deferred past v1.
## Backend services (Cloud Run)
 
Two services, both calling Supabase Postgres with the **service-role key, server-side only**:
 
- **`crime-data-api`**: given a lat/lng and radius, returns aggregated counts by category and time window (PostGIS `ST_DWithin` + `GROUP BY`/`COUNT`), including the prior period of the same length for trend comparison. Never returns raw rows.
- **`generateAreaSummary`**: calls `crime-data-api`, builds an LLM prompt from the aggregates only, and returns the summary text described above. LLM provider/model, exact hosting (Cloud Run vs. Cloud Function), client-invocation shape, required secrets, and caching are **not yet decided** — see Open Decisions.
Whether these services live in this repo (e.g. a `/services/` directory) or a separate backend repo is also undecided — don't assume a location until it's settled.
 
## Project conventions
 
```
src/
  app/                  # routes, layout, nav shell
  auth/                 # AuthContext, sign-in page, auth gate (unchanged)
  map/
    HeatmapLayer.tsx          # renders google.maps.visualization.HeatmapLayer
    useHeatmapData.ts         # fetches + caches the static GeoJSON file, once per session
    PinDropRadiusSelect.tsx   # pin-drop + radius-preset picker + trigger button
  ai-summary/
    useAreaSummary.ts     # TanStack Query hook wrapping the generateAreaSummary endpoint
    SummaryPanel.tsx       # loading/error/result display, with CitySafe + police attribution
  attribution/
    DataAttribution.tsx    # shared "宮城県警察ウェブサイト" + processing-disclaimer component
  components/ui/         # shadcn-generated components
  services/
    firebase.ts            # Firebase init — exports `auth` only (Firestore no longer used)
    supabase.ts             # Supabase client init (anon key, RLS-gated), if/when the client reads directly
    crimeDataApi.ts          # typed fetch wrapper for the crime-data-api Cloud Run service
    aiSummaryApi.ts           # typed fetch wrapper for generateAreaSummary
  types/
    crimeIncident.ts         # crime_incidents row shape, category union
```
 
Removed from the old structure (deleted when Add Incident was removed, superseded by the heatmap): `src/incidents/`, `src/map/useReportsInBounds.ts`, `src/map/ReportMarker.tsx`, `src/map/categoryIcons.ts`, the four category marker PNGs under `src/assets/icons/`, and `reportsService.ts`'s Firestore read/write paths.
 
- Components go through hooks (`useHeatmapData()`, `useAreaSummary(...)`) built on TanStack Query wrapping the service layer — never call Supabase, Firebase, or `fetch` directly inside a component.
- Auth state still goes through `useAuth()` backed by a Context provider at the app root — unchanged.
- Keep files small and colocated by feature; no global `hooks/`/`utils/` dumping grounds beyond `components/ui/` for shadcn.
## Environment variables
 
`.env.example` (committed; real values in a gitignored `.env`):
 
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_GOOGLE_MAPS_API_KEY=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```
 
Never invent placeholder values that look like real keys. Once the crime-data backend lands, this file also needs base URLs for the two Cloud Run services (e.g. `VITE_CRIME_API_BASE_URL`, `VITE_AI_SUMMARY_API_BASE_URL` — exact names TBD). The Supabase **service-role** key never appears here or anywhere client-side — it's a Cloud Run deploy secret only.
 
**Security note**: once deployed to GitHub Pages, `VITE_GOOGLE_MAPS_API_KEY` is publicly visible in the built bundle — it must have HTTP referrer restrictions set in Google Cloud Console. The Supabase anon key doesn't need equivalent protection as long as Row Level Security is correctly configured.
 
## Open decisions
 
Flagged, not resolved — don't silently pick one while implementing an unrelated piece of work:
 
- **SPA routing on GitHub Pages**: `HashRouter` vs. the `404.html` redirect trick. `HashRouter` is the simpler default; final call TBD.
- **Backend repo layout**: Cloud Run services in this repo vs. a separate backend repo.
- **`generateAreaSummary` internals**: LLM provider/model, Cloud Run vs. Cloud Function hosting, client-invocation shape, required secrets.
- **Radius-picker default** among the 500m/1km/2km presets.
- **Heatmap vs. chōme-level choropleth** as the primary crime-density visualization.
## Non-goals
 
- No Android/iOS build targets.
- No new Firebase project, and no further reads/writes to the Firestore `reports` collection — abandoned in place, not migrated.
- No Firebase Hosting — this app deploys to GitHub Pages.
- No raw `crime_incidents` rows or victim demographic data reaching the client or an LLM prompt — aggregates only, enforced at the `crime-data-api` boundary.
- No state management library beyond React Context + TanStack Query at this size (no Redux/Zustand) unless a future feature genuinely needs it.
- No Next.js / SSR — this is a client-only SPA deployed as static files.
 


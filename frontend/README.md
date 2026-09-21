# OCEAN-X — frontend

React + Vite + CesiumJS ocean-data visualization platform, talking to the
existing Node/Express + PostgreSQL/PostGIS service. This build carries the
full application (Login, Learn pages, Dashboard, Data ingestion, Ship
tracking) and a redesigned Explore screen.

## Run

```bash
cd WEB/frontend
npm install
npm run dev
```

The app expects the ocean API on `http://localhost:5001` (see `src/App.jsx`
/ existing fetch calls — unchanged from before this redesign).

## Explore screen architecture

```
src/
  App.jsx                          auth / routing shell (unchanged apart from
                                    the Explore branch, which now renders
                                    ExploreScreen)
  components/
    CesiumGlobe.jsx                the single Cesium viewer: click/area
                                    handling, camera flight, ship entities,
                                    and the four data layers below
    TemperatureCanvasLayer.jsx     scalar renderer (palette + domain override
                                    added; visibility/opacity split from the
                                    build effect so a fade never rebuilds
                                    the canvas)
    SalinityCanvasLayer.jsx        same treatment as Temperature
    CurrentFlowLayer.jsx           animated vector renderer (unchanged
                                    rendering; ref-write moved out of render)
    SeaHeightTerrainLayer.jsx      terrain-relief renderer (ReferenceError
                                    fixed; now wired into CesiumGlobe)
    LocationMarker.jsx             selected-point marker (unchanged)
    ShipTracker.jsx                floating tracking toggle (unchanged)
    DataUploadModal.jsx            dataset upload modal (unchanged)
  explore/
    ExploreScreen.jsx              all Explore state: selection, layers,
                                    cross-fade animation, command routing
    ExploreCommandBar.jsx          the floating command bar + dropdown menus
    explore.css                    every Explore-scoped style
    panels/
      ContextPanel.jsx             shared floating/collapsible panel shell
      LocationContextPanel.jsx     point / area / exact-coordinates
      LayerContextPanel.jsx        per-layer controls + real range
      ColorContextPanel.jsx        palette + domain, wired to the renderers
      DepthContextPanel.jsx        honest single-level depth readout
      AnalysisContextPanel.jsx     real point + raster statistics only
      IsoLayerContextPanel.jsx     disabled, future-ready isosurface UI
      BottomDataDock.jsx           legend, dataset time, globe navigation
    ui/
      Primitives.jsx               disclosure, toggle, slider, stepper, states
      Icons.jsx                    inline SVG icon set
      LayerErrorBoundary.jsx       isolates a failing layer from the rest
    lib/
      api.js                       backend client (the only place fetch()
                                    is called for Explore)
      layers.js                    layer registry, palettes, legend ranges
      format.js                    coordinate/value formatting
  legacy/                          the original react-globe.gl + three.js
                                    renderer (GlobeView, SeaSurfaceTowers,
                                    CurrentFlow, TemperatureLayer) — kept for
                                    reference, not imported anywhere, excluded
                                    from lint
```

## Command bar

Location → Layers → Color → Depth → Analysis → IsoLayer. Opening a command
shows a small dropdown; choosing an option opens (or closes) the matching
floating panel. Nothing is on screen by default except the globe, the
command bar and the bottom dock. Every panel collapses to a small rail and
closes entirely with the × in its header.

## Backend contract (read-only; unchanged)

```
GET /api/ocean-data?latitude&longitude
  -> { hasOceanData, message, time, latitude, longitude, depth,
       bottomt, mlotst, so, thetao, uo, vo, zos, siconc, sithick, usi, vsi }

GET /api/ocean-layer?variable=temperature|salinity|seaHeight|currents
  scalar   -> { width, height, minLatitude, minLongitude, latStep, lonStep,
                min, max, count, oceanCount, values, oceanMask }
  currents -> { width, height, minLatitude, minLongitude, latStep, lonStep,
                minSpeed, maxSpeed, count, uValues, vValues }
```

## Honest limitations

- **Depth** shows the real depth of the selected grid cell (plus mixed-layer
  thickness and sea-floor temperature where present). There is no
  depth-resolved query in the backend, so there is no slider — a slider that
  changed nothing would be worse than an honest single reading.
- **IsoLayer** controls are laid out and wired to local state but disabled:
  isosurface extraction needs values at multiple depths per cell, which the
  dataset does not have.
- **Area selection** is a real interaction — drag a box on the globe, see the
  extent and its area in km² — but no area-aggregate statistics are shown,
  because no area endpoint exists. The panel says so rather than estimating.
- **Colour domain override** only applies to Temperature and Salinity
  (canvas-based scalar renderers). Currents keeps its own speed-based ramp,
  because that ramp lives inside a GLSL material, not a canvas.

## Local setup

Use a current Node.js LTS release (Node 20.19+ or Node 22.12+). Do not copy `node_modules` between machines.

```bash
npm install
npm run dev
```

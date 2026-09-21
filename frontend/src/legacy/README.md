# Legacy renderer (react-globe.gl + three.js)

These files are OCEAN_VANSH's earlier globe implementation. They are not
imported anywhere in the running app and are excluded from ESLint.

| File | What it was |
| --- | --- |
| `GlobeView.jsx` | react-globe.gl host + a shared layer-transition controller |
| `SeaSurfaceTowers.jsx` | Temperature/salinity point-cloud renderer |
| `CurrentFlow.jsx` | Particle-based current animation |
| `TemperatureLayer.jsx` | An earlier temperature renderer, superseded by `components/TemperatureCanvasLayer.jsx` |

The live app renders through `src/components/CesiumGlobe.jsx`, which uses
`TemperatureCanvasLayer`, `SalinityCanvasLayer`, `CurrentFlowLayer`,
`SeaHeightTerrainLayer` and `LocationMarker` instead. Those are the same
scientific rendering OCEAN_VANSH already had — this redesign added
palette/domain overrides and split the opacity/visibility updates out of the
canvas-build effect so a cross-fade never rebuilds a multi-megabyte canvas,
but did not rewrite the underlying maths.

This folder is kept only as a reference. Delete it whenever you're ready.

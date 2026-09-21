/* ==========================================================================
   OCEAN-X — layer registry, palettes, legend

   The registry feeds the command bar, contextual panels, bottom dock and
   renderer. `status: "live"` means the backend really serves that layer today;
   `status: "planned"` is frontend-only and must not trigger a backend request.
   ========================================================================== */

/* --------------------------------------------------------------------------
   PALETTES

   Stops are [position, [r, g, b]] with channels in 0..1, which is the exact
   format the existing canvas layers already interpolate. "Thermal" and
   "Salinity" are the ramps those layers shipped with, lifted verbatim so the
   default appearance of the globe is unchanged.
   -------------------------------------------------------------------------- */

export const THERMAL_STOPS = [
    [0.0, [0.015, 0.055, 0.28]],
    [0.1, [0.015, 0.16, 0.58]],
    [0.22, [0.0, 0.42, 0.88]],
    [0.35, [0.0, 0.78, 1.0]],
    [0.48, [0.02, 0.92, 0.82]],
    [0.6, [0.25, 0.95, 0.48]],
    [0.72, [0.72, 0.94, 0.18]],
    [0.83, [1.0, 0.72, 0.06]],
    [0.92, [1.0, 0.32, 0.025]],
    [1.0, [0.82, 0.015, 0.035]],
];

export const SALINITY_STOPS = [
    [0.0, [0.015, 0.06, 0.35]],
    [0.12, [0.0, 0.18, 0.75]],
    [0.25, [0.0, 0.55, 1.0]],
    [0.38, [0.0, 0.95, 1.0]],
    [0.5, [0.05, 1.0, 0.72]],
    [0.62, [0.35, 1.0, 0.35]],
    [0.74, [0.85, 1.0, 0.05]],
    [0.84, [1.0, 0.72, 0.0]],
    [0.92, [1.0, 0.3, 0.0]],
    [1.0, [0.95, 0.02, 0.02]],
];

const OCEAN_STOPS = [
    [0.0, [0.02, 0.08, 0.3]],
    [0.25, [0.02, 0.35, 0.72]],
    [0.5, [0.05, 0.68, 0.85]],
    [0.75, [0.3, 0.87, 0.8]],
    [1.0, [0.85, 0.96, 0.98]],
];

const GRAYSCALE_STOPS = [
    [0.0, [0.05, 0.07, 0.1]],
    [0.5, [0.45, 0.5, 0.55]],
    [1.0, [0.96, 0.98, 1.0]],
];

export const PALETTES = {
    thermal: { id: "thermal", label: "Thermal", stops: THERMAL_STOPS },
    salinity: { id: "salinity", label: "Salinity", stops: SALINITY_STOPS },
    ocean: { id: "ocean", label: "Ocean", stops: OCEAN_STOPS },
    grayscale: { id: "grayscale", label: "Grayscale", stops: GRAYSCALE_STOPS },
};

export function getPalette(id) {
    return PALETTES[id] ?? PALETTES.thermal;
}

/** CSS gradient for legends and swatches. Stops are 0..1 floats. */
export function stopsGradient(stops) {
    if (!Array.isArray(stops) || stops.length < 2) {
        return "linear-gradient(90deg, #0b3c8c, #20c7b3, #f53f2f)";
    }

    const steps = stops
        .map(
            ([position, [r, g, b]]) =>
                `rgb(${Math.round(r * 255)} ${Math.round(g * 255)} ${Math.round(
                    b * 255,
                )}) ${(position * 100).toFixed(1)}%`,
        )
        .join(", ");

    return `linear-gradient(90deg, ${steps})`;
}

export function paletteGradient(id) {
    return stopsGradient(getPalette(id).stops);
}

/* --------------------------------------------------------------------------
   LAYERS
   -------------------------------------------------------------------------- */

export const LAYERS = [
    {
        id: "temperature",
        label: "Temperature",
        short: "Temp",
        description: "Sea water potential temperature",
        unit: "°C",
        field: "thetao",
        kind: "scalar",
        status: "live",
        defaultPalette: "thermal",
        baseOpacity: 0.6,
        decimals: 1,
        accent: "#ff9a52",
    },
    {
        id: "salinity",
        label: "Salinity",
        short: "Sal",
        description: "Dissolved salt concentration",
        unit: "PSU",
        field: "so",
        kind: "scalar",
        status: "live",
        defaultPalette: "salinity",
        baseOpacity: 0.7,
        decimals: 2,
        accent: "#4fe0c8",
    },
    {
        id: "currents",
        label: "Currents",
        short: "Flow",
        description: "Horizontal velocity field",
        unit: "m/s",
        field: null,
        kind: "vector",
        status: "live",
        defaultPalette: null,
        baseOpacity: 0.9,
        decimals: 2,
        accent: "#7fb4ff",
    },
    {
        id: "chlorophyll",
        label: "Chlorophyll",
        short: "Chl",
        description: "Surface chlorophyll concentration",
        unit: "mg/m³",
        field: "chl",
        kind: "scalar",
        status: "planned",
        defaultPalette: "ocean",
        baseOpacity: 0.7,
        decimals: 2,
        accent: "#71d66b",
    },
];

/* The four Explore layer buttons we want exposed today. Additional layers can
   be promoted to `status: "live"` when their backend endpoint is ready. */
export const EXPLORE_LAYER_IDS = [
    "temperature",
    "salinity",
    "currents",
    "chlorophyll",
];

/* Frontend-only placeholders for the future "More layers" menu. They are
   deliberately not part of the live LAYERS registry yet, so the backend is
   never queried for them. Add real entries here as their APIs are implemented. */
export const FUTURE_LAYER_OPTIONS = [
    {
        id: "dissolvedOxygen",
        label: "Dissolved Oxygen",
        short: "O₂",
        description: "Dissolved oxygen concentration",
        unit: "mmol/m³",
        kind: "scalar",
        status: "planned",
    },
    {
        id: "mixedLayerDepth",
        label: "Mixed Layer Depth",
        short: "MLD",
        description: "Mixed layer depth",
        unit: "m",
        kind: "scalar",
        status: "planned",
    },
    {
        id: "seaIce",
        label: "Sea Ice",
        short: "Ice",
        description: "Sea-ice concentration",
        unit: "%",
        kind: "scalar",
        status: "planned",
    },
];

export const LAYER_IDS = LAYERS.map((layer) => layer.id);

export function getLayer(id) {
    return (
        LAYERS.find((layer) => layer.id === id) ??
        FUTURE_LAYER_OPTIONS.find((layer) => layer.id === id) ??
        null
    );
}

/* --------------------------------------------------------------------------
   COMMAND BAR

   Defined here rather than in the command bar component so that file can
   export components only, which is what keeps fast refresh working.
   -------------------------------------------------------------------------- */

export const COMMAND_IDS = [
    "location",
    "layers",
    "color",
    "depth",
    "analysis",
    "isolayer",
];

/* --------------------------------------------------------------------------
   LEGEND

   Prefers the real range the backend returned for the loaded raster; falls
   back to nothing rather than inventing a plausible-looking scale.
   -------------------------------------------------------------------------- */

export function getLegendRange(layer, raster) {
    if (!layer || !raster) return null;

    if (layer.kind === "vector") {
        const max = Number(raster.maxSpeed);
        const min = Number(raster.minSpeed);

        if (!Number.isFinite(max) || max <= 0) return null;

        return { min: Number.isFinite(min) ? min : 0, max };
    }

    const min = Number(raster.min);
    const max = Number(raster.max);

    if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
        return null;
    }

    return { min, max };
}

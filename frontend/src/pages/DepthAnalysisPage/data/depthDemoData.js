export const DEPTH_LIMIT = 1200;

export const PARAMETER_CONFIG = {
  temperature: {
    label: "Temperature",
    shortLabel: "TEMP",
    unit: "°C",
    icon: "◉",
    description: "Potential temperature through the water column.",
    accentClass: "is-temperature",
    range: [-2, 30],
    decimals: 1,
    sample: [
      [0, 27.8], [25, 27.2], [50, 26.1], [75, 25.2], [100, 24.4],
      [150, 22.8], [200, 20.7], [300, 17.9], [400, 15.8], [500, 13.9],
      [650, 11.7], [800, 9.8], [1000, 7.8], [1200, 6.7],
    ],
  },
  salinity: {
    label: "Salinity",
    shortLabel: "SALT",
    unit: "PSU",
    icon: "≈",
    description: "Practical salinity through the water column.",
    accentClass: "is-salinity",
    range: [33, 36.5],
    decimals: 2,
    sample: [
      [0, 34.55], [25, 34.57], [50, 34.62], [75, 34.69], [100, 34.76],
      [150, 34.88], [200, 35.01], [300, 35.15], [400, 35.24], [500, 35.30],
      [650, 35.34], [800, 35.37], [1000, 35.39], [1200, 35.40],
    ],
  },
  currents: {
    label: "Current speed",
    shortLabel: "FLOW",
    unit: "m/s",
    icon: "↗",
    description: "Current speed profile through the selected water column.",
    accentClass: "is-currents",
    range: [0, 2],
    decimals: 2,
    sample: [
      [0, 0.42], [25, 0.51], [50, 0.58], [75, 0.64], [100, 0.71],
      [150, 0.82], [200, 0.96], [300, 1.18], [400, 1.31], [500, 1.17],
      [650, 0.92], [800, 0.73], [1000, 0.51], [1200, 0.38],
    ],
  },
  chlorophyll: {
    label: "Chlorophyll-a",
    shortLabel: "CHL-A",
    unit: "mg/m³",
    icon: "✦",
    description: "Chlorophyll-a concentration through depth.",
    accentClass: "is-chlorophyll",
    range: [0, 2.5],
    decimals: 2,
    sample: [
      [0, 0.18], [25, 0.21], [50, 0.34], [75, 0.61], [100, 1.12],
      [150, 1.86], [200, 1.52], [300, 0.74], [400, 0.38], [500, 0.20],
      [650, 0.12], [800, 0.08], [1000, 0.05], [1200, 0.03],
    ],
  },
};

export const DEFAULT_LOCATION = {
  latitude: 12.42,
  longitude: 74.82,
  label: "Arabian Sea · reference station",
};

export const DEPTH_LAYERS = [
  { start: 0, end: 50, label: "Surface", note: "Solar-heated upper ocean" },
  { start: 50, end: 200, label: "Mixed layer", note: "Wind and wave mixing" },
  { start: 200, end: 500, label: "Thermocline", note: "Rapid temperature transition" },
  { start: 500, end: 1000, label: "Deep ocean", note: "Reduced surface influence" },
  { start: 1000, end: 1200, label: "Abyssal transition", note: "Cold, stable water" },
];

export const getInterpolatedValue = (parameterKey, depth) => {
  const points = PARAMETER_CONFIG[parameterKey]?.sample ?? [];
  if (!points.length) return 0;

  if (depth <= points[0][0]) return points[0][1];
  if (depth >= points[points.length - 1][0]) return points[points.length - 1][1];

  for (let i = 1; i < points.length; i += 1) {
    const [d1, v1] = points[i - 1];
    const [d2, v2] = points[i];

    if (depth <= d2) {
      const t = (depth - d1) / (d2 - d1);
      return v1 + (v2 - v1) * t;
    }
  }

  return points[points.length - 1][1];
};

export const getLayerAtDepth = (depth) =>
  DEPTH_LAYERS.find((layer) => depth >= layer.start && depth <= layer.end) ??
  DEPTH_LAYERS[DEPTH_LAYERS.length - 1];

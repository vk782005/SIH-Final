/* ==========================================================================
   OCEAN-X — client-side polygon analysis

   MVP bridge until the area-analysis endpoint is moved to the backend/PostGIS
   layer. Uses real raster responses already returned by /api/ocean-layer.
   ========================================================================== */

import { deriveCurrent } from "./format.js";

const EARTH_RADIUS_KM = 6371.0088;

function toRadians(degrees) {
    return (Number(degrees) * Math.PI) / 180;
}

function normalizeLongitude(longitude) {
    let value = Number(longitude);
    while (value > 180) value -= 360;
    while (value < -180) value += 360;
    return value;
}

export function unwrapPolygon(points) {
    if (!Array.isArray(points) || points.length === 0) return [];

    const firstLongitude = normalizeLongitude(points[0].longitude);
    const result = [
        { ...points[0], longitude: firstLongitude },
    ];
    let previous = firstLongitude;

    for (let index = 1; index < points.length; index += 1) {
        let longitude = normalizeLongitude(points[index].longitude);

        while (longitude - previous > 180) longitude -= 360;
        while (longitude - previous < -180) longitude += 360;

        result.push({ ...points[index], longitude });
        previous = longitude;
    }

    return result;
}

function longitudeNear(reference, longitude) {
    let value = normalizeLongitude(longitude);

    while (value - reference > 180) value -= 360;
    while (value - reference < -180) value += 360;

    return value;
}

/** Ray-casting point-in-polygon test in unwrapped lat/lon space. */
export function pointInPolygon(latitude, longitude, polygon) {
    if (!Array.isArray(polygon) || polygon.length < 3) return false;

    const x = longitudeNear(polygon[0].longitude, longitude);
    const y = Number(latitude);
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].longitude;
        const yi = polygon[i].latitude;
        const xj = polygon[j].longitude;
        const yj = polygon[j].latitude;

        const intersects =
            yi > y !== yj > y &&
            x < ((xj - xi) * (y - yi)) / (yj - yi || Number.EPSILON) + xi;

        if (intersects) inside = !inside;
    }

    return inside;
}

/** Spherical polygon area in km². */
export function polygonAreaKm2(points) {
    if (!Array.isArray(points) || points.length < 3) return 0;

    const polygon = unwrapPolygon(points);
    let accumulator = 0;

    for (let i = 0; i < polygon.length; i += 1) {
        const current = polygon[i];
        const next = polygon[(i + 1) % polygon.length];

        accumulator +=
            toRadians(current.longitude) *
            (Math.sin(toRadians(next.latitude)) -
                Math.sin(toRadians(current.latitude)));
    }

    return Math.abs((EARTH_RADIUS_KM ** 2 * accumulator) / 2);
}

/**
 * Return the grid-cell indices whose centers fall inside the polygon.
 * Temperature's oceanMask is preferred as the common ocean/land mask.
 */
export function collectPolygonCellIndices(polygonPoints, raster) {
    if (!Array.isArray(polygonPoints) || polygonPoints.length < 3 || !raster) {
        return [];
    }

    const polygon = unwrapPolygon(polygonPoints);
    const width = Number(raster.width);
    const height = Number(raster.height);
    const minLatitude = Number(raster.minLatitude);
    const minLongitude = Number(raster.minLongitude);
    const latStep = Number(raster.latStep);
    const lonStep = Number(raster.lonStep);

    if (
        !Number.isFinite(width) ||
        !Number.isFinite(height) ||
        width < 1 ||
        height < 1 ||
        !Number.isFinite(minLatitude) ||
        !Number.isFinite(minLongitude) ||
        !Number.isFinite(latStep) ||
        !Number.isFinite(lonStep)
    ) {
        return [];
    }

    const latitudes = polygon.map((point) => Number(point.latitude));
    const longitudes = polygon.map((point) => Number(point.longitude));
    const minPolygonLat = Math.min(...latitudes);
    const maxPolygonLat = Math.max(...latitudes);
    const minPolygonLon = Math.min(...longitudes);
    const maxPolygonLon = Math.max(...longitudes);
    const oceanMask = raster.oceanMask;
    const indices = [];

    for (let row = 0; row < height; row += 1) {
        const latitude = minLatitude + row * latStep;
        if (latitude < minPolygonLat || latitude > maxPolygonLat) continue;

        for (let column = 0; column < width; column += 1) {
            const index = row * width + column;
            if (oceanMask && !oceanMask[index]) continue;

            const longitude = minLongitude + column * lonStep;
            const adjustedLongitude = longitudeNear(
                polygon[0].longitude,
                longitude,
            );

            if (
                adjustedLongitude < minPolygonLon - Math.abs(lonStep) ||
                adjustedLongitude > maxPolygonLon + Math.abs(lonStep)
            ) {
                continue;
            }

            if (pointInPolygon(latitude, adjustedLongitude, polygon)) {
                indices.push(index);
            }
        }
    }

    return indices;
}

function summarizeScalar(raster, indices) {
    if (!raster?.values) return null;

    let sum = 0;
    let count = 0;

    for (const index of indices) {
        const value = Number(raster.values[index]);
        if (!Number.isFinite(value)) continue;
        sum += value;
        count += 1;
    }

    return count ? { mean: sum / count, count } : null;
}

function summarizeCurrents(raster, indices) {
    if (!raster?.uValues || !raster?.vValues) return null;

    let uSum = 0;
    let vSum = 0;
    let count = 0;

    for (const index of indices) {
        const u = Number(raster.uValues[index]);
        const v = Number(raster.vValues[index]);
        if (!Number.isFinite(u) || !Number.isFinite(v)) continue;

        uSum += u;
        vSum += v;
        count += 1;
    }

    if (!count) return null;

    const u = uSum / count;
    const v = vSum / count;
    const current = deriveCurrent(u, v);

    return {
        u,
        v,
        speed: current?.speed ?? Math.hypot(u, v),
        bearing: current?.bearing ?? null,
        compass: current?.compass ?? null,
        count,
    };
}

export function analyzeAreaRasters(polygonPoints, rasters) {
    if (!Array.isArray(polygonPoints) || polygonPoints.length < 3) {
        return null;
    }

    const referenceRaster =
        rasters?.temperature ??
        Object.values(rasters ?? {}).find(Boolean) ??
        null;

    if (!referenceRaster) return null;

    const indices = collectPolygonCellIndices(
        polygonPoints,
        referenceRaster,
    );

    const metrics = {
        temperature: summarizeScalar(rasters?.temperature, indices),
        salinity: summarizeScalar(rasters?.salinity, indices),
        currents: summarizeCurrents(rasters?.currents, indices),
        seaHeight: summarizeScalar(rasters?.seaHeight, indices),
        chlorophyll: summarizeScalar(rasters?.chlorophyll, indices),
    };

    const sources = [
        ["temperature", metrics.temperature],
        ["salinity", metrics.salinity],
        ["currents", metrics.currents],
        ["seaHeight", metrics.seaHeight],
        ["chlorophyll", metrics.chlorophyll],
    ];

    return {
        areaKm2: polygonAreaKm2(polygonPoints),
        vertices: polygonPoints.length,
        cellsAnalyzed: indices.length,
        metrics,
        missing: sources
            .filter(([, metric]) => !metric)
            .map(([variable]) => variable),
    };
}

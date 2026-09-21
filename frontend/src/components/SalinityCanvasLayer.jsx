import { useEffect, useRef } from "react";
import * as Cesium from "cesium";

// ============================================================
// OCEAN-X
// Liquid Crystal Salinity Canvas Imagery
// Vivid Temperature-Style Gradient
// ============================================================

const SALINITY_COLORS = [
    [0.00, [0.015, 0.06, 0.35]],  // Deep ocean blue
    [0.12, [0.00, 0.18, 0.75]],  // Electric blue
    [0.25, [0.00, 0.55, 1.00]],  // Bright blue
    [0.38, [0.00, 0.95, 1.00]],  // Cyan
    [0.50, [0.05, 1.00, 0.72]],  // Aqua
    [0.62, [0.35, 1.00, 0.35]],  // Green
    [0.74, [0.85, 1.00, 0.05]],  // Lime yellow
    [0.84, [1.00, 0.72, 0.00]],  // Yellow orange
    [0.92, [1.00, 0.30, 0.00]],  // Orange
    [1.00, [0.95, 0.02, 0.02]],  // Hot red
];

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function smoothstep(t) {
    return t * t * (3 - 2 * t);
}

function interpolateColor(normalized, stops) {
    const t = clamp(normalized, 0, 1);

    for (let i = 0; i < stops.length - 1; i++) {
        const [stopA, colorA] = stops[i];
        const [stopB, colorB] = stops[i + 1];

        if (t >= stopA && t <= stopB) {
            const localT =
                (t - stopA) /
                (stopB - stopA);

            const eased = smoothstep(localT);

            return [
                colorA[0] +
                    (colorB[0] - colorA[0]) * eased,

                colorA[1] +
                    (colorB[1] - colorA[1]) * eased,

                colorA[2] +
                    (colorB[2] - colorA[2]) * eased,
            ];
        }
    }

    return stops[
        stops.length - 1
    ][1];
}

// ============================================================
// Build Salinity Canvas
// ============================================================

function buildSalinityCanvas(raster, palette, domain) {
    const stops = Array.isArray(palette) && palette.length > 1
        ? palette
        : SALINITY_COLORS;

    const width = Number(raster.width);
    const height = Number(raster.height);

    const values = raster.values;
    const oceanMask = raster.oceanMask;

    // A domain supplied by the Colour panel overrides the raster's own
    // range. This changes the colour mapping only; the values the
    // backend returned are never touched.
    const hasDomain =
        domain &&
        Number.isFinite(Number(domain.min)) &&
        Number.isFinite(Number(domain.max)) &&
        Number(domain.max) > Number(domain.min);

    const min = hasDomain ? Number(domain.min) : Number(raster.min);
    const max = hasDomain ? Number(domain.max) : Number(raster.max);

    if (
        !Number.isFinite(width) ||
        !Number.isFinite(height) ||
        width <= 0 ||
        height <= 0
    ) {
        console.error(
            "OCEAN-X: Invalid salinity raster dimensions."
        );

        return null;
    }

    if (
        !Array.isArray(values) ||
        values.length < width * height
    ) {
        console.error(
            "OCEAN-X: Invalid salinity raster values."
        );

        return null;
    }

    const range = max - min;

    if (
        !Number.isFinite(range) ||
        range <= 0
    ) {
        console.error(
            "OCEAN-X: Invalid salinity range.",
            {
                min,
                max,
            }
        );

        return null;
    }

    // ========================================================
    // Supersampling
    // ========================================================

    const SCALE = 2;

    const canvas =
        document.createElement("canvas");

    canvas.width = width * SCALE;
    canvas.height = height * SCALE;

    const ctx =
        canvas.getContext("2d", {
            alpha: true,
        });

    if (!ctx) {
        return null;
    }

    const imageData =
        ctx.createImageData(
            canvas.width,
            canvas.height
        );

    const pixels =
        imageData.data;

    // ========================================================
    // Generate RGBA Texture
    // ========================================================

    for (
        let y = 0;
        y < canvas.height;
        y++
    ) {
        /*
         * Backend raster:
         *
         * SOUTH → NORTH
         *
         * Canvas:
         *
         * TOP → BOTTOM
         *
         * Therefore flip Y.
         */

        const sourceY =
            (1 -
                y /
                    (canvas.height - 1)) *
            (height - 1);

        const y0 =
            Math.floor(sourceY);

        const y1 =
            Math.min(
                y0 + 1,
                height - 1
            );

        const fy =
            sourceY - y0;

        for (
            let x = 0;
            x < canvas.width;
            x++
        ) {
            const sourceX =
                (x /
                    (canvas.width - 1)) *
                (width - 1);

            const x0 =
                Math.floor(sourceX);

            const x1 =
                Math.min(
                    x0 + 1,
                    width - 1
                );

            const fx =
                sourceX - x0;

            const i00 =
                y0 * width + x0;

            const i10 =
                y0 * width + x1;

            const i01 =
                y1 * width + x0;

            const i11 =
                y1 * width + x1;

            const valid00 =
                oceanMask?.[i00] === 1 &&
                Number.isFinite(
                    Number(values[i00])
                );

            const valid10 =
                oceanMask?.[i10] === 1 &&
                Number.isFinite(
                    Number(values[i10])
                );

            const valid01 =
                oceanMask?.[i01] === 1 &&
                Number.isFinite(
                    Number(values[i01])
                );

            const valid11 =
                oceanMask?.[i11] === 1 &&
                Number.isFinite(
                    Number(values[i11])
                );

            // No valid ocean data nearby
            if (
                !valid00 &&
                !valid10 &&
                !valid01 &&
                !valid11
            ) {
                continue;
            }

            // =================================================
            // Mask-aware bilinear interpolation
            // =================================================

            const w00 =
                (1 - fx) * (1 - fy);

            const w10 =
                fx * (1 - fy);

            const w01 =
                (1 - fx) * fy;

            const w11 =
                fx * fy;

            let salinity = 0;
            let weight = 0;

            if (valid00) {
                salinity +=
                    Number(values[i00]) *
                    w00;

                weight += w00;
            }

            if (valid10) {
                salinity +=
                    Number(values[i10]) *
                    w10;

                weight += w10;
            }

            if (valid01) {
                salinity +=
                    Number(values[i01]) *
                    w01;

                weight += w01;
            }

            if (valid11) {
                salinity +=
                    Number(values[i11]) *
                    w11;

                weight += w11;
            }

            if (weight <= 0) {
                continue;
            }

            salinity /= weight;

            // =================================================
            // Normalize
            // =================================================

            const normalized =
                clamp(
                    (salinity - min) /
                        range,
                    0,
                    1
                );

            let [r, g, b] =
                interpolateColor(
                    normalized,
                    stops
                );

            // =================================================
            // Liquid Crystal Lighting
            // =================================================

            /*
             * Stronger center illumination makes the
             * gradient feel luminous rather than flat.
             */

            const crystalLight =
                0.96 +
                0.10 *
                    Math.sin(
                        normalized *
                            Math.PI
                    );

            r *= crystalLight;
            g *= crystalLight;
            b *= crystalLight;

            // =================================================
            // Slight saturation boost
            // =================================================

            const luminance =
                0.2126 * r +
                0.7152 * g +
                0.0722 * b;

            const saturationBoost = 1.08;

            r =
                luminance +
                (r - luminance) *
                    saturationBoost;

            g =
                luminance +
                (g - luminance) *
                    saturationBoost;

            b =
                luminance +
                (b - luminance) *
                    saturationBoost;

            // =================================================
            // Stronger Ocean Presence
            // =================================================

            const alpha =
                215 *
                clamp(
                    weight,
                    0,
                    1
                );

            const pixelIndex =
                (y * canvas.width + x) *
                4;

            pixels[pixelIndex] =
                Math.round(
                    clamp(r, 0, 1) *
                        255
                );

            pixels[pixelIndex + 1] =
                Math.round(
                    clamp(g, 0, 1) *
                        255
                );

            pixels[pixelIndex + 2] =
                Math.round(
                    clamp(b, 0, 1) *
                        255
                );

            pixels[pixelIndex + 3] =
                Math.round(alpha);
        }
    }

    ctx.putImageData(
        imageData,
        0,
        0
    );

    return canvas;
}

// ============================================================
// Cesium Salinity Layer
// ============================================================

export default function SalinityCanvasLayer({
    viewer,
    raster,
    palette,
    domain,
    visible = true,
    opacity = 0.62,
}) {
    const imageryLayerRef =
        useRef(null);

    useEffect(() => {
        if (
            !viewer ||
            viewer.isDestroyed()
        ) {
            return;
        }

        // ====================================================
        // Remove previous salinity layer
        // ====================================================

        if (
            imageryLayerRef.current
        ) {
            viewer.imageryLayers.remove(
                imageryLayerRef.current,
                true
            );

            imageryLayerRef.current =
                null;
        }

        // ====================================================
        // Nothing to render
        // ====================================================

        if (
            !raster
        ) {
            viewer.scene.requestRender();
            return;
        }

        // ====================================================
        // Build Canvas
        // ====================================================

        const canvas =
            buildSalinityCanvas(
                raster,
                palette,
                domain
            );

        if (!canvas) {
            return;
        }

        // ====================================================
        // Geographic Bounds
        // ====================================================

        const minLongitude =
            Number(
                raster.minLongitude
            );

        const minLatitude =
            Number(
                raster.minLatitude
            );

        const lonStep =
            Number(
                raster.lonStep
            );

        const latStep =
            Number(
                raster.latStep
            );

        const width =
            Number(raster.width);

        const height =
            Number(raster.height);

        const maxLongitude =
            minLongitude +
            lonStep *
                (width - 1);

        const maxLatitude =
            minLatitude +
            latStep *
                (height - 1);

        const rectangle =
            Cesium.Rectangle.fromDegrees(
                minLongitude,
                minLatitude,
                maxLongitude,
                maxLatitude
            );

        // ====================================================
        // Canvas → PNG
        // ====================================================

        const imageUrl =
            canvas.toDataURL(
                "image/png"
            );

        // ====================================================
        // Cesium Single Tile Imagery
        // ====================================================

        const provider =
            new Cesium.SingleTileImageryProvider({
                url: imageUrl,

                rectangle,

                // IMPORTANT:
                // Cesium requires these.
                tileWidth:
                    canvas.width,

                tileHeight:
                    canvas.height,
            });

        // ====================================================
        // Add Imagery
        // ====================================================

        const imageryLayer =
            viewer.imageryLayers.addImageryProvider(
                provider
            );

        // ====================================================
        // Vivid Liquid Crystal Appearance
        // ====================================================

        /*
         * Seed visibility and alpha from the current props. Both are then
         * maintained by the cheap effects below, so a fade never rebuilds
         * the canvas.
         */

        imageryLayer.show = visible;

        imageryLayer.alpha =
            clamp(
                Number(opacity),
                0,
                1
            );

        // Slightly brighter
        imageryLayer.brightness =
            1.06;

        // Stronger separation between
        // low / medium / high salinity
        imageryLayer.contrast =
            0.86;

        // Prevent washed-out colours
        imageryLayer.saturation =
            1.12;

        imageryLayerRef.current =
            imageryLayer;

        viewer.scene.requestRender();

        console.log(
            "🧂 OCEAN-X Vivid Liquid Crystal Salinity Layer",
            {
                rasterWidth: width,
                rasterHeight: height,

                canvasWidth:
                    canvas.width,

                canvasHeight:
                    canvas.height,

                validPoints:
                    raster.count,

                salinityMin:
                    raster.min,

                salinityMax:
                    raster.max,
            }
        );

        // ====================================================
        // Cleanup
        // ====================================================

        return () => {
            if (
                !viewer ||
                viewer.isDestroyed()
            ) {
                return;
            }

            if (
                imageryLayerRef.current
            ) {
                viewer.imageryLayers.remove(
                    imageryLayerRef.current,
                    true
                );

                imageryLayerRef.current =
                    null;
            }

            viewer.scene.requestRender();
        };
        /*
         * visible and opacity are read above but deliberately excluded from
         * the dependency list: rebuilding a multi-megabyte canvas on every
         * frame of a cross-fade would be ruinous. They are applied by the
         * two effects below instead.
         */

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        viewer,
        raster,
        palette,
        domain,
    ]);

    // ========================================================
    // VISIBILITY - cheap flag flip, no rebuild.
    // ========================================================

    useEffect(() => {
        if (!viewer || viewer.isDestroyed()) {
            return;
        }

        if (imageryLayerRef.current) {
            imageryLayerRef.current.show = visible;
        }

        viewer.scene.requestRender();
    }, [visible, viewer]);

    // ========================================================
    // OPACITY - cheap alpha update, no rebuild. This is what
    // makes the cross-fade between layers possible.
    // ========================================================

    useEffect(() => {
        if (!viewer || viewer.isDestroyed()) {
            return;
        }

        if (imageryLayerRef.current) {
            imageryLayerRef.current.alpha = clamp(Number(opacity), 0, 1);
        }

        viewer.scene.requestRender();
    }, [opacity, viewer]);

    return null;
}
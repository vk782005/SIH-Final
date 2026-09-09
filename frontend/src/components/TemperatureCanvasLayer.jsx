import { useEffect, useRef } from "react";
import * as Cesium from "cesium";

// ============================================================
// OCEAN-X
// Smooth Canvas Imagery Temperature Layer
// ============================================================

const TEMPERATURE_COLORS = [
    [0.00, [0.015, 0.055, 0.28]],
    [0.10, [0.015, 0.16, 0.58]],
    [0.22, [0.00, 0.42, 0.88]],
    [0.35, [0.00, 0.78, 1.00]],
    [0.48, [0.02, 0.92, 0.82]],
    [0.60, [0.25, 0.95, 0.48]],
    [0.72, [0.72, 0.94, 0.18]],
    [0.83, [1.00, 0.72, 0.06]],
    [0.92, [1.00, 0.32, 0.025]],
    [1.00, [0.82, 0.015, 0.035]],
];

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function smoothstep(t) {
    return t * t * (3 - 2 * t);
}

function interpolateColor(normalized) {
    const t = clamp(normalized, 0, 1);

    for (
        let i = 0;
        i < TEMPERATURE_COLORS.length - 1;
        i++
    ) {
        const [stopA, colorA] =
            TEMPERATURE_COLORS[i];

        const [stopB, colorB] =
            TEMPERATURE_COLORS[i + 1];

        if (t >= stopA && t <= stopB) {
            const localT =
                (t - stopA) /
                (stopB - stopA);

            const eased =
                smoothstep(localT);

            return [
                colorA[0] +
                    (colorB[0] - colorA[0]) *
                        eased,

                colorA[1] +
                    (colorB[1] - colorA[1]) *
                        eased,

                colorA[2] +
                    (colorB[2] - colorA[2]) *
                        eased,
            ];
        }
    }

    return TEMPERATURE_COLORS[
        TEMPERATURE_COLORS.length - 1
    ][1];
}


// ============================================================
// Build temperature canvas
// ============================================================

function buildTemperatureCanvas(raster) {
    const width = Number(raster.width);
    const height = Number(raster.height);

    const values = raster.values;
    const oceanMask = raster.oceanMask;

    const min = Number(raster.min);
    const max = Number(raster.max);

    if (
        !Number.isFinite(width) ||
        !Number.isFinite(height) ||
        width <= 0 ||
        height <= 0
    ) {
        console.error(
            "OCEAN-X: Invalid raster dimensions.",
            {
                width,
                height,
            }
        );

        return null;
    }

    if (
        !Array.isArray(values) ||
        values.length < width * height
    ) {
        console.error(
            "OCEAN-X: Invalid temperature values.",
            {
                expected: width * height,
                received: values?.length,
            }
        );

        return null;
    }

    const range = max - min;

    if (
        !Number.isFinite(range) ||
        range <= 0
    ) {
        console.error(
            "OCEAN-X: Invalid temperature range.",
            {
                min,
                max,
            }
        );

        return null;
    }

    // --------------------------------------------------------
    // 2x supersampling
    // --------------------------------------------------------

    const SCALE = 2;

    const canvas = document.createElement(
        "canvas"
    );

    canvas.width = width * SCALE;
    canvas.height = height * SCALE;

    const ctx = canvas.getContext(
        "2d",
        {
            alpha: true,
        }
    );

    if (!ctx) {
        console.error(
            "OCEAN-X: Could not create canvas context."
        );

        return null;
    }

    const imageData =
        ctx.createImageData(
            canvas.width,
            canvas.height
        );

    const pixels = imageData.data;

    // --------------------------------------------------------
    // Generate RGBA texture
    // --------------------------------------------------------

    for (
        let y = 0;
        y < canvas.height;
        y++
    ) {
        /*
         * IMPORTANT:
         *
         * Backend raster is latitude ascending:
         *
         * south → north
         *
         * Image textures are:
         *
         * top → bottom
         *
         * Therefore flip Y here.
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

            /*
             * Completely invalid region.
             */
            if (
                !valid00 &&
                !valid10 &&
                !valid01 &&
                !valid11
            ) {
                continue;
            }

            // ------------------------------------------------
            // Mask-aware bilinear interpolation
            // ------------------------------------------------

            const w00 =
                (1 - fx) * (1 - fy);

            const w10 =
                fx * (1 - fy);

            const w01 =
                (1 - fx) * fy;

            const w11 =
                fx * fy;

            let temperature = 0;
            let weight = 0;

            if (valid00) {
                temperature +=
                    Number(values[i00]) *
                    w00;

                weight += w00;
            }

            if (valid10) {
                temperature +=
                    Number(values[i10]) *
                    w10;

                weight += w10;
            }

            if (valid01) {
                temperature +=
                    Number(values[i01]) *
                    w01;

                weight += w01;
            }

            if (valid11) {
                temperature +=
                    Number(values[i11]) *
                    w11;

                weight += w11;
            }

            if (weight <= 0) {
                continue;
            }

            temperature /=
                weight;

            // ------------------------------------------------
            // Normalize
            // ------------------------------------------------

            const normalized =
                clamp(
                    (temperature - min) /
                        range,
                    0,
                    1
                );

            let [r, g, b] =
                interpolateColor(
                    normalized
                );

            // ------------------------------------------------
            // Liquid-crystal boost
            // ------------------------------------------------

            const crystalBoost =
                1 +
                0.10 *
                    Math.sin(
                        normalized *
                            Math.PI
                    );

            r = clamp(
                r * crystalBoost,
                0,
                1
            );

            g = clamp(
                g * crystalBoost,
                0,
                1
            );

            b = clamp(
                b * crystalBoost,
                0,
                1
            );

            /*
             * Slight transparency around interpolated
             * boundaries gives the layer a cleaner
             * liquid appearance.
             */

            const alpha =
                225 *
                clamp(
                    weight,
                    0,
                    1
                );

            const pixel =
                (y * canvas.width + x) *
                4;

            pixels[pixel] =
                Math.round(r * 255);

            pixels[pixel + 1] =
                Math.round(g * 255);

            pixels[pixel + 2] =
                Math.round(b * 255);

            pixels[pixel + 3] =
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
// React Component
// ============================================================

export default function TemperatureCanvasLayer({
    viewer,
    raster,
    visible = true,
    opacity = 0.82,
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

        // ----------------------------------------------------
        // Remove previous temperature imagery
        // ----------------------------------------------------

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

        // ----------------------------------------------------
        // Nothing to render
        // ----------------------------------------------------

        if (
            !visible ||
            !raster
        ) {
            viewer.scene.requestRender();
            return;
        }

        // ----------------------------------------------------
        // Build canvas
        // ----------------------------------------------------

        const canvas =
            buildTemperatureCanvas(
                raster
            );

        if (!canvas) {
            console.error(
                "OCEAN-X: Temperature canvas creation failed."
            );

            return;
        }

        // ----------------------------------------------------
        // Geographic extent
        // ----------------------------------------------------

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

        // ----------------------------------------------------
        // Convert canvas → data URL
        // ----------------------------------------------------

        const imageUrl =
            canvas.toDataURL(
                "image/png"
            );

        // ----------------------------------------------------
        // Cesium Single Tile Provider
        //
        // IMPORTANT:
        // tileWidth + tileHeight are explicitly supplied.
        // ----------------------------------------------------

        const provider =
            new Cesium.SingleTileImageryProvider(
                {
                    url: imageUrl,

                    rectangle,

                    tileWidth:
                        canvas.width,

                    tileHeight:
                        canvas.height,
                }
            );

        // ----------------------------------------------------
        // Add imagery
        // ----------------------------------------------------

        const imageryLayer =
            viewer.imageryLayers.addImageryProvider(
                provider
            );

        // ----------------------------------------------------
        // Futuristic appearance
        // ----------------------------------------------------

        imageryLayer.alpha =
            clamp(
                Number(opacity),
                0,
                1
            );

        imageryLayer.brightness =
            1.08;

        imageryLayer.contrast =
            1.10;

        imageryLayer.saturation =
            1.15;

        imageryLayerRef.current =
            imageryLayer;

        viewer.scene.requestRender();

        console.log(
            "🌊 OCEAN-X Canvas Imagery Loaded",
            {
                rasterWidth: width,
                rasterHeight: height,
                canvasWidth:
                    canvas.width,
                canvasHeight:
                    canvas.height,
                temperatureMin:
                    raster.min,
                temperatureMax:
                    raster.max,
                validPoints:
                    raster.count,
            }
        );

        // ----------------------------------------------------
        // Cleanup
        // ----------------------------------------------------

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
    }, [
        viewer,
        raster,
        visible,
        opacity,
    ]);

    return null;
}
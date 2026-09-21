import { useEffect, useRef } from "react";
import * as Cesium from "cesium";

// =========================================================
// OCEAN-X LIQUID CRYSTAL TEMPERATURE COLOR RAMP
// =========================================================

const TEMPERATURE_COLORS = [
    [0.00, [0.025, 0.10, 0.42]],  // Deep blue
    [0.15, [0.02, 0.32, 0.78]],   // Electric blue
    [0.30, [0.00, 0.72, 0.92]],   // Cyan
    [0.45, [0.08, 0.92, 0.78]],   // Aqua
    [0.60, [0.38, 0.88, 0.55]],   // Emerald
    [0.72, [0.78, 0.88, 0.28]],   // Lime
    [0.84, [1.00, 0.70, 0.12]],   // Gold
    [0.93, [1.00, 0.34, 0.06]],   // Orange
    [1.00, [0.92, 0.08, 0.05]],   // Hot red
];

// =========================================================
// TEMPERATURE → LIQUID CRYSTAL COLOR
// =========================================================

function getTemperatureColor(normalized) {

    normalized = Math.max(
        0,
        Math.min(1, normalized)
    );

    for (
        let i = 0;
        i < TEMPERATURE_COLORS.length - 1;
        i++
    ) {

        const [stop1, color1] =
            TEMPERATURE_COLORS[i];

        const [stop2, color2] =
            TEMPERATURE_COLORS[i + 1];

        if (
            normalized >= stop1 &&
            normalized <= stop2
        ) {

            const t =
                (normalized - stop1) /
                (stop2 - stop1);

            return new Cesium.Color(
                color1[0] +
                    (color2[0] - color1[0]) * t,

                color1[1] +
                    (color2[1] - color1[1]) * t,

                color1[2] +
                    (color2[2] - color1[2]) * t,

                0.92
            );
        }
    }

    const last =
        TEMPERATURE_COLORS[
            TEMPERATURE_COLORS.length - 1
        ][1];

    return new Cesium.Color(
        last[0],
        last[1],
        last[2],
        0.92
    );
}

// =========================================================
// TEMPERATURE LAYER
// =========================================================

export default function TemperatureLayer({
    viewer,
    raster,
    visible = true,
}) {

    const pointsRef = useRef(null);

    useEffect(() => {

        // =====================================================
        // VALIDATE VIEWER
        // =====================================================

        if (
            !viewer ||
            viewer.isDestroyed()
        ) {
            return;
        }

        // =====================================================
        // REMOVE PREVIOUS TEMPERATURE POINTS
        // =====================================================

        if (pointsRef.current) {

            viewer.scene.primitives.remove(
                pointsRef.current
            );

            pointsRef.current = null;
        }

        // =====================================================
        // DON'T RENDER IF HIDDEN
        // =====================================================

        if (!visible || !raster) {
            return;
        }

        // =====================================================
        // READ RASTER
        // =====================================================

        const {
            width,
            height,
            minLatitude,
            minLongitude,
            latStep,
            lonStep,
            min,
            max,
            values,
            oceanMask,
        } = raster;

        // =====================================================
        // VALIDATE RASTER
        // =====================================================

        if (
            !width ||
            !height ||
            !values ||
            !Number.isFinite(minLatitude) ||
            !Number.isFinite(minLongitude) ||
            !Number.isFinite(latStep) ||
            !Number.isFinite(lonStep) ||
            !Number.isFinite(min) ||
            !Number.isFinite(max)
        ) {

            console.warn(
                "Invalid temperature raster:",
                raster
            );

            return;
        }

        // =====================================================
        // TEMPERATURE RANGE
        // =====================================================

        const range = max - min;

        if (range <= 0) {
            console.warn(
                "Invalid temperature range:",
                min,
                max
            );

            return;
        }

        // =====================================================
        // GPU POINT COLLECTION
        // =====================================================

        const pointCollection =
            new Cesium.PointPrimitiveCollection();

        viewer.scene.primitives.add(
            pointCollection
        );

        pointsRef.current =
            pointCollection;

        // =====================================================
        // POINT SIZE
        // =====================================================

        const POINT_SIZE = 7;

        // =====================================================
        // CREATE TEMPERATURE POINTS
        // =====================================================

        let pointCount = 0;

        for (
            let latIndex = 0;
            latIndex < height;
            latIndex++
        ) {

            // -------------------------------------------------
            // GRID LATITUDE
            // -------------------------------------------------

            const latitude =
                minLatitude +
                latIndex * latStep;

            // -------------------------------------------------
            // CESIUM LATITUDE SAFETY
            // -------------------------------------------------

            if (
                latitude < -90 ||
                latitude > 90
            ) {
                continue;
            }

            for (
                let lonIndex = 0;
                lonIndex < width;
                lonIndex++
            ) {

                // -------------------------------------------------
                // FLATTENED ARRAY INDEX
                // -------------------------------------------------

                const index =
                    latIndex * width +
                    lonIndex;

                // -------------------------------------------------
                // OCEAN MASK
                // -------------------------------------------------

                if (
                    oceanMask &&
                    oceanMask[index] !== 1
                ) {
                    continue;
                }

                // -------------------------------------------------
                // TEMPERATURE VALUE
                // -------------------------------------------------

                const value =
                    values[index];

                if (
                    value === null ||
                    value === undefined ||
                    !Number.isFinite(
                        Number(value)
                    )
                ) {
                    continue;
                }

                const temperature =
                    Number(value);

                // -------------------------------------------------
                // NORMALIZE TEMPERATURE
                // -------------------------------------------------

                let normalized =
                    (temperature - min) /
                    range;

                normalized =
                    Math.max(
                        0,
                        Math.min(
                            1,
                            normalized
                        )
                    );

                // -------------------------------------------------
                // GRID LONGITUDE
                // -------------------------------------------------

                const longitude =
                    minLongitude +
                    lonIndex * lonStep;

                if (
                    longitude < -180 ||
                    longitude > 180
                ) {
                    continue;
                }

                // -------------------------------------------------
                // LIQUID CRYSTAL COLOR
                // -------------------------------------------------

                const color =
                    getTemperatureColor(
                        normalized
                    );

                // -------------------------------------------------
                // GLOBE POSITION
                //
                // No altitude offset.
                // Point sits directly on the ellipsoid.
                // -------------------------------------------------

                const position =
                    Cesium.Cartesian3.fromDegrees(
                        longitude,
                        latitude
                    );

                // -------------------------------------------------
                // GPU POINT
                // -------------------------------------------------

                pointCollection.add({

                    position,

                    pixelSize:
                        POINT_SIZE,

                    color,

                    // IMPORTANT:
                    // Allow Cesium's depth buffer to hide
                    // points on the opposite side of Earth.
                    disableDepthTestDistance: 0,

                });

                pointCount++;
            }
        }

        // =====================================================
        // DEBUG
        // =====================================================

        console.log(
            "🌡️ OCEAN-X Temperature GPU layer",
            {
                points: pointCount,
                grid: `${width} × ${height}`,
                range: `${min} → ${max}`,
            }
        );

        // =====================================================
        // CLEANUP
        // =====================================================

        return () => {

            if (
                !viewer ||
                viewer.isDestroyed()
            ) {
                return;
            }

            if (pointsRef.current) {

                viewer.scene.primitives.remove(
                    pointsRef.current
                );

                pointsRef.current = null;
            }
        };

    }, [
        viewer,
        raster,
        visible,
    ]);

    return null;
}
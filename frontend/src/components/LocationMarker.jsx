import { useEffect, useRef } from "react";
import * as Cesium from "cesium";

const MARKER_ALTITUDE = 1500;

const CORE_SIZE = 11;
const GLOW_SIZE = 28;

const RING_RADIUS = 2500;

const RIPPLE_DURATION = 1600;

// Screen-space ripple size
const RIPPLE_START_PIXELS = 24;
const RIPPLE_END_PIXELS = 110;

export default function LocationMarker({
    viewer,
    location,
}) {
    const entityIdsRef = useRef([]);

    useEffect(() => {
        if (!viewer || viewer.isDestroyed()) {
            return;
        }

        // ====================================================
        // Remove previous marker
        // ====================================================

        entityIdsRef.current.forEach((id) => {
            viewer.entities.removeById(id);
        });

        entityIdsRef.current = [];

        // ====================================================
        // No location
        // ====================================================

        if (!location) {
            return;
        }

        const latitude = Number(
            location.latitude
        );

        const longitude = Number(
            location.longitude
        );

        if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude)
        ) {
            return;
        }

        // ====================================================
        // Entity IDs
        // ====================================================

        const coreId =
            "ocean-x-marker-core";

        const glowId =
            "ocean-x-marker-glow";

        const ringId =
            "ocean-x-marker-ring";

        const rippleId =
            "ocean-x-marker-ripple";

        // ====================================================
        // Geographic position
        // ====================================================

        const position =
            Cesium.Cartesian3.fromDegrees(
                longitude,
                latitude,
                MARKER_ALTITUDE
            );

        // ====================================================
        // CORE
        // ====================================================

        viewer.entities.add({
            id: coreId,

            position,

            point: {
                pixelSize: CORE_SIZE,

                color:
                    Cesium.Color.CYAN,

                outlineColor:
                    Cesium.Color.WHITE,

                outlineWidth: 2,

                disableDepthTestDistance:
                    Number.POSITIVE_INFINITY,
            },
        });

        // ====================================================
        // GLOW
        // ====================================================

        viewer.entities.add({
            id: glowId,

            position,

            point: {
                pixelSize: GLOW_SIZE,

                color:
                    Cesium.Color.CYAN.withAlpha(
                        0.14
                    ),

                disableDepthTestDistance:
                    Number.POSITIVE_INFINITY,
            },
        });

        // ====================================================
        // STATIC TARGETING RING
        // ====================================================

        viewer.entities.add({
            id: ringId,

            position,

            ellipse: {
                semiMajorAxis:
                    RING_RADIUS,

                semiMinorAxis:
                    RING_RADIUS,

                height:
                    MARKER_ALTITUDE,

                material:
                    Cesium.Color.TRANSPARENT,

                outline: true,

                outlineColor:
                    Cesium.Color.CYAN.withAlpha(
                        0.85
                    ),

                outlineWidth: 3,

                heightReference:
                    Cesium.HeightReference.NONE,
            },
        });

        // ====================================================
        // CREATE RIPPLE CANVAS
        // ====================================================

        const rippleCanvas =
            document.createElement(
                "canvas"
            );

        const CANVAS_SIZE = 256;

        rippleCanvas.width =
            CANVAS_SIZE;

        rippleCanvas.height =
            CANVAS_SIZE;

        const ctx =
            rippleCanvas.getContext(
                "2d"
            );

        if (!ctx) {
            return;
        }

        // ====================================================
        // Draw holographic ripple texture
        // ====================================================

        const center =
            CANVAS_SIZE / 2;

        ctx.clearRect(
            0,
            0,
            CANVAS_SIZE,
            CANVAS_SIZE
        );

        // Outer glow
        const gradient =
            ctx.createRadialGradient(
                center,
                center,
                20,
                center,
                center,
                120
            );

        gradient.addColorStop(
            0,
            "rgba(0,255,255,0)"
        );

        gradient.addColorStop(
            0.55,
            "rgba(0,255,255,0)"
        );

        gradient.addColorStop(
            0.82,
            "rgba(0,255,255,0.15)"
        );

        gradient.addColorStop(
            0.94,
            "rgba(0,255,255,0.9)"
        );

        gradient.addColorStop(
            1,
            "rgba(0,255,255,0)"
        );

        ctx.beginPath();

        ctx.arc(
            center,
            center,
            88,
            0,
            Math.PI * 2
        );

        ctx.strokeStyle =
            "rgba(0,255,255,0.95)";

        ctx.lineWidth = 4;

        ctx.stroke();

        // Soft glow
        ctx.beginPath();

        ctx.arc(
            center,
            center,
            88,
            0,
            Math.PI * 2
        );

        ctx.strokeStyle =
            gradient;

        ctx.lineWidth = 12;

        ctx.stroke();

        const rippleImage =
            rippleCanvas.toDataURL(
                "image/png"
            );

        // ====================================================
        // RIPPLE BILLBOARD
        // ====================================================

        const rippleEntity =
            viewer.entities.add({
                id: rippleId,

                position,

                billboard: {
                    image: rippleImage,

                    width: RIPPLE_START_PIXELS,

                    height: RIPPLE_START_PIXELS,

                    scale: 1,

                    color:
                        Cesium.Color.CYAN.withAlpha(
                            0.75
                        ),

                    verticalOrigin:
                        Cesium.VerticalOrigin.CENTER,

                    horizontalOrigin:
                        Cesium.HorizontalOrigin.CENTER,

                    disableDepthTestDistance:
                        Number.POSITIVE_INFINITY,

                    translucencyByDistance:
                        undefined,
                },
            });

        // ====================================================
        // Animate ripple
        // ====================================================

        const rippleStartTime =
            performance.now();

        const updateRipple = () => {
            if (
                !viewer ||
                viewer.isDestroyed()
            ) {
                return;
            }

            const elapsed =
                performance.now() -
                rippleStartTime;

            const progress =
                (elapsed %
                    RIPPLE_DURATION) /
                RIPPLE_DURATION;

            // Smooth cubic easing
            const eased =
                1 -
                Math.pow(
                    1 - progress,
                    3
                );

            const size =
                RIPPLE_START_PIXELS +
                (
                    RIPPLE_END_PIXELS -
                    RIPPLE_START_PIXELS
                ) *
                    eased;

            const opacity =
                0.75 *
                (1 - progress);

            // ----------------------------------------------
            // Keep ripple screen-space sized
            // ----------------------------------------------

            if (
                rippleEntity.billboard
            ) {
                rippleEntity.billboard.width =
                    size;

                rippleEntity.billboard.height =
                    size;

                rippleEntity.billboard.color =
                    Cesium.Color.CYAN.withAlpha(
                        opacity
                    );
            }

            viewer.scene.requestRender();
        };

        viewer.scene.preRender.addEventListener(
            updateRipple
        );

        // ====================================================
        // Track entities
        // ====================================================

        entityIdsRef.current = [
            coreId,
            glowId,
            ringId,
            rippleId,
        ];

        // ====================================================
        // Cleanup
        // ====================================================

        return () => {
            viewer.scene.preRender.removeEventListener(
                updateRipple
            );

            if (
                !viewer ||
                viewer.isDestroyed()
            ) {
                return;
            }

            entityIdsRef.current.forEach(
                (id) => {
                    viewer.entities.removeById(
                        id
                    );
                }
            );

            entityIdsRef.current = [];

            viewer.scene.requestRender();
        };
    }, [
        viewer,
        location?.latitude,
        location?.longitude,
    ]);

    return null;
}
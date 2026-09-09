import { useEffect, useRef, useState } from "react";
import * as Cesium from "cesium";

import LocationMarker from "./LocationMarker";
import TemperatureCanvasLayer from "./TemperatureCanvasLayer";
import SalinityCanvasLayer from "./SalinityCanvasLayer";
import CurrentFlowLayer from "./CurrentFlowLayer";

import "cesium/Build/Cesium/Widgets/widgets.css";

// =============================================================
// SHIP NAMES
// =============================================================

const SHIP_NAMES = [
    "Ocean Voyager",
    "Sea Explorer",
    "Pacific Trader",
    "Atlantic Star",
    "Blue Horizon",
    "Marine Spirit",
    "Ocean Pioneer",
    "Global Carrier",
    "Sea Falcon",
    "Neptune Express",
    "Indian Ocean Star",
    "Arctic Navigator",
    "Southern Cross",
    "Ocean Guardian",
    "Wave Runner",
    "Deep Sea",
    "Marine Voyager",
    "Pacific Horizon",
    "Ocean Titan",
    "Sea Venture",
    "Global Navigator",
    "Aqua Explorer",
    "Ocean Liberty",
    "Blue Mariner",
    "Sea Dragon",
    "Ocean Enterprise",
    "Marine Arrow",
    "Pacific Wind",
    "Atlantic Voyager",
    "Ocean Majesty",
];

// =============================================================
// OCEAN-ONLY SHIP POSITIONS
// =============================================================
//
// [longitude, latitude]
//
// Frontend mock ship positions.
// No backend / AIS connection.
// =============================================================

const SHIP_POSITIONS = [
    // ---------------------------------------------------------
    // ATLANTIC OCEAN
    // ---------------------------------------------------------

    [-60, 30],
    [-48, 25],
    [-36, 20],
    [-24, 15],
    [-12, 10],

    [-55, -10],
    [-42, -18],
    [-30, -25],
    [-18, -32],
    [-5, -28],

    // ---------------------------------------------------------
    // INDIAN OCEAN
    // ---------------------------------------------------------

    [55, -20],
    [65, -15],
    [75, -22],
    [85, -18],
    [95, -22],

    [60, 5],
    [70, 5],
    [80, 2],
    [90, -5],
    [100, -12],

    // ---------------------------------------------------------
    // SOUTHERN INDIAN OCEAN
    // ---------------------------------------------------------

    [70, -35],
    [85, -35],
    [100, -35],
    [115, -30],
    [125, -35],

    // ---------------------------------------------------------
    // PACIFIC OCEAN
    // ---------------------------------------------------------

    [145, 10],
    [160, 20],
    [175, 30],
    [-170, 20],
    [-155, 10],
];

// =============================================================
// CESIUM GLOBE
// =============================================================

export default function CesiumGlobe({
    viewport,
    onGlobeClick,
    selectedLocation,
    selectedVariable,
    layerDataByVariable,
    trackingShips,
}) {
    const containerRef = useRef(null);
    const viewerRef = useRef(null);

    const [viewerInstance, setViewerInstance] = useState(null);

    // =========================================================
    // CREATE CESIUM VIEWER
    // =========================================================

    useEffect(() => {
        if (!containerRef.current) {
            return;
        }

        const viewer = new Cesium.Viewer(
            containerRef.current,
            {
                animation: false,
                timeline: false,
                baseLayerPicker: false,
                geocoder: false,
                homeButton: false,
                sceneModePicker: false,
                navigationHelpButton: false,
                fullscreenButton: false,
                infoBox: false,
                selectionIndicator: false,
            }
        );

        viewerRef.current = viewer;

        setViewerInstance(viewer);

        // =====================================================
        // INITIAL CAMERA
        // =====================================================

        viewer.camera.setView({
            destination:
                Cesium.Cartesian3.fromDegrees(
                    70,
                    20,
                    18000000
                ),
        });

        // =====================================================
        // GLOBE CLICK HANDLER
        // =====================================================

        const handler =
            new Cesium.ScreenSpaceEventHandler(
                viewer.scene.canvas
            );

        handler.setInputAction(
            (click) => {
                // =================================================
                // CHECK IF A SHIP WAS CLICKED
                // =================================================

                const pickedObject =
                    viewer.scene.pick(click.position);

                if (
                    Cesium.defined(pickedObject) &&
                    pickedObject.id &&
                    pickedObject.id.shipEntity
                ) {
                    console.log(
                        "Ship clicked:",
                        pickedObject.id.shipName
                    );

                    // Do not treat ship click as globe click.
                    return;
                }

                // =================================================
                // NORMAL GLOBE CLICK
                // =================================================

                const cartesian =
                    viewer.camera.pickEllipsoid(
                        click.position,
                        viewer.scene.globe.ellipsoid
                    );

                if (!cartesian) {
                    console.log(
                        "Clicked outside globe"
                    );

                    return;
                }

                // =================================================
                // CARTESIAN → GEOGRAPHIC COORDINATES
                // =================================================

                const cartographic =
                    Cesium.Cartographic.fromCartesian(
                        cartesian
                    );

                const longitude =
                    Cesium.Math.toDegrees(
                        cartographic.longitude
                    );

                const latitude =
                    Cesium.Math.toDegrees(
                        cartographic.latitude
                    );

                console.log(
                    "🌍 Cesium Globe Click"
                );

                console.log(
                    "Latitude:",
                    latitude
                );

                console.log(
                    "Longitude:",
                    longitude
                );

                // =================================================
                // SEND COORDINATES TO APP
                // =================================================

                if (onGlobeClick) {
                    onGlobeClick({
                        lat: latitude,
                        lng: longitude,
                    });
                }
            },
            Cesium.ScreenSpaceEventType.LEFT_CLICK
        );

        // =========================================================
        // CLEANUP
        // =========================================================

        return () => {
            handler.destroy();

            if (!viewer.isDestroyed()) {
                viewer.destroy();
            }

            viewerRef.current = null;
            setViewerInstance(null);
        };
    }, [onGlobeClick]);

    // =========================================================
    // SHIP TRACKING
    // =========================================================

    useEffect(() => {
        const viewer = viewerInstance;

        if (!viewer || viewer.isDestroyed()) {
            return;
        }

        // =====================================================
        // REMOVE EXISTING SHIPS
        // =====================================================

        const existingShips =
            viewer.entities.values.filter(
                (entity) => entity.shipEntity === true
            );

        existingShips.forEach((entity) => {
            viewer.entities.remove(entity);
        });

        // =====================================================
        // TRACKING OFF
        // =====================================================

        if (!trackingShips) {
            console.log(
                "🚢 Ship tracking disabled"
            );

            return;
        }

        // =====================================================
        // TRACKING ON
        // =====================================================

        console.log(
            "🚢 Creating 30 ocean ships..."
        );

        SHIP_NAMES.forEach((name, index) => {
            const [
                longitude,
                latitude,
            ] = SHIP_POSITIONS[index];

            // =================================================
            // CREATE SHIP ENTITY
            // =================================================

            viewer.entities.add({
                id: `ship-${index + 1}`,

                // Custom flags for identifying ships.
                shipEntity: true,
                shipName: name,

                // =================================================
                // SHIP POSITION
                // =================================================

                position:
                    Cesium.Cartesian3.fromDegrees(
                        longitude,
                        latitude,
                        5000
                    ),

                // =================================================
                // SHIP MARKER
                // =================================================

                point: {
                    pixelSize: 16,

                    color:
                        Cesium.Color.WHITE,

                    outlineColor:
                        Cesium.Color.fromCssColorString(
                            "#00d9ff"
                        ),

                    outlineWidth: 4,

                    heightReference:
                        Cesium.HeightReference.NONE,

                    disableDepthTestDistance:
                        Number.POSITIVE_INFINITY,
                },

                // =================================================
                // SHIP LABEL
                // =================================================

                label: {
                    text: `🚢 ${name}`,

                    font:
                        "bold 13px sans-serif",

                    fillColor:
                        Cesium.Color.WHITE,

                    outlineColor:
                        Cesium.Color.BLACK,

                    outlineWidth: 4,

                    style:
                        Cesium.LabelStyle
                            .FILL_AND_OUTLINE,

                    showBackground: true,

                    backgroundColor:
                        Cesium.Color.fromCssColorString(
                            "rgba(5, 20, 30, 0.85)"
                        ),

                    backgroundPadding:
                        new Cesium.Cartesian2(
                            8,
                            5
                        ),

                    pixelOffset:
                        new Cesium.Cartesian2(
                            0,
                            -25
                        ),

                    disableDepthTestDistance:
                        Number.POSITIVE_INFINITY,

                    scale: 0.9,
                },
            });

            console.log(
                `🚢 ${index + 1}. ${name} → ${longitude}, ${latitude}`
            );
        });

        console.log(
            `🚢 ${SHIP_NAMES.length} ships added to Cesium`
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

            const ships =
                viewer.entities.values.filter(
                    (entity) =>
                        entity.shipEntity === true
                );

            ships.forEach((ship) => {
                viewer.entities.remove(ship);
            });
        };
    }, [trackingShips, viewerInstance]);

    // =========================================================
    // TEMPERATURE DATA
    // =========================================================

    const temperatureData =
        layerDataByVariable?.temperature ||
        null;

    const showTemperature =
        selectedVariable === "temperature" &&
        temperatureData !== null;

    // =========================================================
    // SALINITY DATA
    // =========================================================

    const salinityData =
        layerDataByVariable?.salinity ||
        null;

    const showSalinity =
        selectedVariable === "salinity" &&
        salinityData !== null;

    // =========================================================
    // CURRENT FLOW DATA
    // =========================================================

    const currentData =
        layerDataByVariable?.currents ||
        null;

    const showCurrents =
        selectedVariable === "currents" &&
        currentData !== null;

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
            }}
        >
            {/* =================================================
                CESIUM GLOBE
            ================================================= */}

            <div
                ref={containerRef}
                style={{
                    width: "100%",
                    height: "100%",
                }}
            />

            {/* =================================================
                TEMPERATURE LAYER
            ================================================= */}

            <TemperatureCanvasLayer
                viewer={viewerInstance}
                raster={temperatureData}
                visible={showTemperature}
                opacity={0.6}
            />

            {/* =================================================
                SALINITY LAYER
            ================================================= */}

            <SalinityCanvasLayer
                viewer={viewerInstance}
                raster={salinityData}
                visible={showSalinity}
                opacity={0.7}
            />

            {/* =================================================
                LOCATION MARKER
            ================================================= */}

            <LocationMarker
                viewer={viewerInstance}
                location={selectedLocation}
            />

            {/* =================================================
                CURRENT FLOW LAYER
            ================================================= */}

            <CurrentFlowLayer
                viewer={viewerInstance}
                raster={currentData}
                visible={showCurrents}
                opacity={0.9}
            />
        </div>
    );
}
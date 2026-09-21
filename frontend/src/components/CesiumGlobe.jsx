import { useCallback, useEffect, useRef, useState } from "react";
import * as Cesium from "cesium";

import LocationMarker from "./LocationMarker";
import TemperatureCanvasLayer from "./TemperatureCanvasLayer";
import SalinityCanvasLayer from "./SalinityCanvasLayer";
import CurrentFlowLayer from "./CurrentFlowLayer";
import SeaHeightTerrainLayer from "./SeaHeightTerrainLayer";

import LayerErrorBoundary from "../explore/ui/LayerErrorBoundary.jsx";

import "cesium/Build/Cesium/Widgets/widgets.css";

// =============================================================
// SHIP NAMES
// =============================================================

// const SHIP_NAMES = [
//     "Ocean Voyager", "Sea Explorer", "Pacific Trader", "Atlantic Star",
//     "Blue Horizon", "Marine Spirit", "Ocean Pioneer", "Global Carrier",
//     "Sea Falcon", "Neptune Express", "Indian Ocean Star", "Arctic Navigator",
//     "Southern Cross", "Ocean Guardian", "Wave Runner", "Deep Sea",
//     "Marine Voyager", "Pacific Horizon", "Ocean Titan", "Sea Venture",
//     "Global Navigator", "Aqua Explorer", "Ocean Liberty", "Blue Mariner",
//     "Sea Dragon", "Ocean Enterprise", "Marine Arrow", "Pacific Wind",
//     "Atlantic Voyager", "Ocean Majesty",
// ];

// =============================================================
// OCEAN-ONLY SHIP POSITIONS   [longitude, latitude]
//
// Frontend demonstration positions. No backend / AIS connection.
// =============================================================

// const SHIP_POSITIONS = [
//     [-60, 30], [-48, 25], [-36, 20], [-24, 15], [-12, 10],
//     [-55, -10], [-42, -18], [-30, -25], [-18, -32], [-5, -28],
//     [55, -20], [65, -15], [75, -22], [85, -18], [95, -22],
//     [60, 5], [70, 5], [80, 2], [90, -5], [100, -12],
//     [70, -35], [85, -35], [100, -35], [115, -30], [125, -35],
//     [145, 10], [160, 20], [175, 30], [-170, 20], [-155, 10],
// ];

const HOME_VIEW = { longitude: 79, latitude: 23, height: 20_000_000 };

// =============================================================
// CESIUM GLOBE
//
// The one Cesium viewer for the app. Created exactly once — the
// creation effect below has an empty dependency array, deliberately,
// so opening a dropdown or a contextual panel never rebuilds it.
// Click handling, area drag, ship tracking, and every data layer are
// driven off that single instance through refs and follow-on effects.
// =============================================================

export default function CesiumGlobe({
    viewport,
    onGlobeClick,
    onAreaSelect,
    onViewerReady,
    onLayerFailure,
    selectionMode,
    selectedLocation,
    selectedArea,
    flyToLocation,
    layerDataByVariable,
    layerOpacity,
    layerSettings,
}) {
    const containerRef = useRef(null);
    const viewerRef = useRef(null);

    const [viewerInstance, setViewerInstance] = useState(null);

    /*
     * Interaction callbacks and the current selection mode are read through
     * refs inside the Cesium handlers. Without this the handlers would need
     * to be re-registered (or the viewer rebuilt) whenever a parent callback
     * changed identity.
     */
    const clickRef = useRef(onGlobeClick);
    const areaRef = useRef(onAreaSelect);
    const modeRef = useRef(selectionMode);
    const areaPointsRef = useRef(selectedArea?.points ?? []);
    const areaPreviewRef = useRef(null);

    useEffect(() => {
        clickRef.current = onGlobeClick;
        areaRef.current = onAreaSelect;
        modeRef.current = selectionMode;
        areaPointsRef.current = selectedArea?.points ?? [];
    }, [onGlobeClick, onAreaSelect, selectionMode, selectedArea]);

    // =========================================================
    // CREATE CESIUM VIEWER  (exactly once)
    // =========================================================

    useEffect(() => {
        if (!containerRef.current) {
            return undefined;
        }

        const viewer = new Cesium.Viewer(containerRef.current, {
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
        });

        viewerRef.current = viewer;
        setViewerInstance(viewer);

        // Cesium's own credit block collides with the bottom dock.
        viewer.cesiumWidget.creditContainer.style.display = "none";

        // =====================================================
        // INITIAL CAMERA
        // =====================================================

        viewer.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(
                HOME_VIEW.longitude,
                HOME_VIEW.latitude,
                HOME_VIEW.height,
            ),
        });

        // =====================================================
        // INTERACTION
        // =====================================================

        const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

        const toDegrees = (windowPosition) => {
            const cartesian = viewer.camera.pickEllipsoid(
                windowPosition,
                viewer.scene.globe.ellipsoid,
            );

            if (!cartesian) return null;

            const cartographic = Cesium.Cartographic.fromCartesian(cartesian);

            return {
                latitude: Cesium.Math.toDegrees(cartographic.latitude),
                longitude: Cesium.Math.toDegrees(cartographic.longitude),
            };
        };

        const clearAreaPreview = () => {
            if (areaPreviewRef.current) {
                areaPreviewRef.current.polyline.show = false;
            }
        };

        // One click handler supports both normal point inspection and custom
        // polygon drawing. Area mode never triggers the point query.
        handler.setInputAction((click) => {
            const point = toDegrees(click.position);
            if (!point) return;

            if (modeRef.current === "area") {
                const current = areaPointsRef.current;
                const next = [...current, point];

                areaPointsRef.current = next;
                areaRef.current?.({ points: next, drawing: true });
                clearAreaPreview();
                return;
            }

            const picked = viewer.scene.pick(click.position);
            if (Cesium.defined(picked) && picked.id && picked.id.shipEntity) {
                return;
            }

            clickRef.current?.({ lat: point.latitude, lng: point.longitude });
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        // Live preview of the next polygon edge.
        handler.setInputAction((event) => {
            if (modeRef.current !== "area") {
                clearAreaPreview();
                return;
            }

            const points = areaPointsRef.current;
            if (!points.length) {
                clearAreaPreview();
                return;
            }

            const cursor = toDegrees(event.endPosition);
            if (!cursor) {
                clearAreaPreview();
                return;
            }

            const last = points[points.length - 1];

            if (!areaPreviewRef.current) {
                areaPreviewRef.current = viewer.entities.add({
                    polyline: {
                        positions: [],
                        width: 1.8,
                        material: Cesium.Color.fromCssColorString("#8fdcff").withAlpha(0.72),
                        clampToGround: true,
                    },
                });
            }

            const previewPositions = [
                last.longitude,
                last.latitude,
                cursor.longitude,
                cursor.latitude,
            ];

            // Once three vertices exist, preview both the new edge and the
            // closing edge back to the first vertex.
            if (points.length >= 3) {
                const first = points[0];
                previewPositions.push(first.longitude, first.latitude);
            }

            areaPreviewRef.current.polyline.positions =
                Cesium.Cartesian3.fromDegreesArray(previewPositions);
            areaPreviewRef.current.polyline.show = true;
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        handler.setInputAction(() => {
            clearAreaPreview();
        }, Cesium.ScreenSpaceEventType.LEFT_UP);

        // =====================================================
        // IMPERATIVE API for the bottom dock's navigation buttons
        // =====================================================

        onViewerReady?.({
            zoomIn: () =>
                viewer.camera.zoomIn(
                    viewer.camera.positionCartographic.height * 0.35,
                ),

            zoomOut: () =>
                viewer.camera.zoomOut(
                    viewer.camera.positionCartographic.height * 0.45,
                ),

            resetView: () =>
                viewer.camera.flyTo({
                    destination: Cesium.Cartesian3.fromDegrees(
                        HOME_VIEW.longitude,
                        HOME_VIEW.latitude,
                        HOME_VIEW.height,
                    ),
                    duration: 1.4,
                }),
        });

        // =====================================================
        // CLEANUP
        // =====================================================

        return () => {
            handler.destroy();

            if (areaPreviewRef.current && !viewer.isDestroyed()) {
                viewer.entities.remove(areaPreviewRef.current);
                areaPreviewRef.current = null;
            }

            if (!viewer.isDestroyed()) {
                viewer.destroy();
            }

            viewerRef.current = null;
            setViewerInstance(null);
        };
        // Created once. Interaction reads current props through refs above,
        // so this effect intentionally never re-runs after mount.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // =========================================================
    // KEEP THE CANVAS IN STEP WITH THE WINDOW
    // =========================================================

    useEffect(() => {
        const viewer = viewerRef.current;
        if (!viewer || viewer.isDestroyed()) return;

        viewer.resize();
        viewer.scene.requestRender();
    }, [viewport?.width, viewport?.height]);

    // =========================================================
    // AREA SELECTION INTERACTION
    //
    // Drawing a polygon must not lock Cesium's normal camera controls.
    // LEFT_CLICK adds a vertex; drag gestures remain camera navigation.
    // =========================================================

    useEffect(() => {
        if (selectionMode !== "area" && areaPreviewRef.current) {
            areaPreviewRef.current.polyline.show = false;
        }

        viewerInstance?.scene.requestRender();
    }, [selectionMode, viewerInstance]);

    // =========================================================
    // AREA SELECTION POLYGON
    // =========================================================

    useEffect(() => {
        const viewer = viewerInstance;
        if (!viewer || viewer.isDestroyed()) return undefined;

        const points = selectedArea?.points ?? [];
        const entities = [];

        points.forEach((point, index) => {
            entities.push(
                viewer.entities.add({
                    position: Cesium.Cartesian3.fromDegrees(
                        point.longitude,
                        point.latitude,
                        1200,
                    ),
                    point: {
                        pixelSize: index === points.length - 1 ? 10 : 8,
                        color:
                            index === points.length - 1
                                ? Cesium.Color.WHITE
                                : Cesium.Color.fromCssColorString("#8fdcff"),
                        outlineColor: Cesium.Color.fromCssColorString("#0b1522"),
                        outlineWidth: 2,
                        disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    },
                    label: {
                        text: String(index + 1),
                        font: "600 11px Inter, sans-serif",
                        fillColor: Cesium.Color.WHITE,
                        showBackground: true,
                        backgroundColor:
                            Cesium.Color.fromCssColorString("#0b1724").withAlpha(0.84),
                        backgroundPadding: new Cesium.Cartesian2(5, 3),
                        pixelOffset: new Cesium.Cartesian2(0, -18),
                        disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    },
                }),
            );
        });

        if (points.length >= 2) {
            const positions = [];
            points.forEach((point) => positions.push(point.longitude, point.latitude));

            if (points.length >= 3) {
                positions.push(points[0].longitude, points[0].latitude);
            }

            entities.push(
                viewer.entities.add({
                    polyline: {
                        positions: Cesium.Cartesian3.fromDegreesArray(positions),
                        width: 3,
                        material: Cesium.Color.fromCssColorString("#8fdcff").withAlpha(0.92),
                        clampToGround: true,
                    },
                }),
            );
        }

        if (points.length >= 3) {
            const positions = [];
            points.forEach((point) => positions.push(point.longitude, point.latitude));

            entities.push(
                viewer.entities.add({
                    polygon: {
                        hierarchy: Cesium.Cartesian3.fromDegreesArray(positions),
                        material: Cesium.Color.fromCssColorString("#56c8f6").withAlpha(0.12),
                        height: 0,
                        outline: true,
                        outlineColor: Cesium.Color.fromCssColorString("#8fdcff").withAlpha(0.28),
                    },
                }),
            );
        }

        viewer.scene.requestRender();

        return () => {
            if (viewer.isDestroyed()) return;
            entities.forEach((entity) => viewer.entities.remove(entity));
            viewer.scene.requestRender();
        };
    }, [selectedArea, viewerInstance]);

    // =========================================================
    // CAMERA FLIGHT (precise coordinate navigation)
    // =========================================================

    useEffect(() => {
        const viewer = viewerInstance;
        if (!viewer || viewer.isDestroyed() || !flyToLocation) return;

        const latitude = Number(flyToLocation.latitude);
        const longitude = Number(flyToLocation.longitude);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(
                longitude,
                latitude,
                2_500_000,
            ),
            duration: 1.5,
        });
    }, [flyToLocation, viewerInstance]);

    // =========================================================
    // SHIP TRACKING
    // =========================================================

    // useEffect(() => {
    //     const viewer = viewerInstance;

    //     if (!viewer || viewer.isDestroyed()) {
    //         return undefined;
    //     }

    //     viewer.entities.values
    //         .filter((entity) => entity.shipEntity === true)
    //         .forEach((entity) => viewer.entities.remove(entity));

    //     if (!trackingShips) {
    //         viewer.scene.requestRender();
    //         return undefined;
    //     }

    //     SHIP_NAMES.forEach((name, index) => {
    //         const [longitude, latitude] = SHIP_POSITIONS[index];

    //         viewer.entities.add({
    //             id: `ship-${index + 1}`,

    //             shipEntity: true,
    //             shipName: name,

    //             position: Cesium.Cartesian3.fromDegrees(longitude, latitude, 5000),

    //             point: {
    //                 pixelSize: 13,
    //                 color: Cesium.Color.WHITE,
    //                 outlineColor: Cesium.Color.fromCssColorString("#00d9ff"),
    //                 outlineWidth: 3,
    //                 heightReference: Cesium.HeightReference.NONE,
    //                 disableDepthTestDistance: Number.POSITIVE_INFINITY,
    //             },

    //             label: {
    //                 text: name,
    //                 font: "600 12px Inter, sans-serif",
    //                 fillColor: Cesium.Color.WHITE,
    //                 outlineColor: Cesium.Color.BLACK,
    //                 outlineWidth: 3,
    //                 style: Cesium.LabelStyle.FILL_AND_OUTLINE,
    //                 showBackground: true,
    //                 backgroundColor:
    //                     Cesium.Color.fromCssColorString("rgba(6, 12, 22, 0.86)"),
    //                 backgroundPadding: new Cesium.Cartesian2(8, 5),
    //                 pixelOffset: new Cesium.Cartesian2(0, -22),
    //                 disableDepthTestDistance: Number.POSITIVE_INFINITY,
    //                 scale: 0.9,
    //                 translucencyByDistance:
    //                     new Cesium.NearFarScalar(3.0e6, 1.0, 2.0e7, 0.0),
    //             },
    //         });
    //     });

    //     viewer.scene.requestRender();

    //     return () => {
    //         if (!viewer || viewer.isDestroyed()) return;

    //         viewer.entities.values
    //             .filter((entity) => entity.shipEntity === true)
    //             .forEach((entity) => viewer.entities.remove(entity));

    //         viewer.scene.requestRender();
    //     };
    // }, [trackingShips, viewerInstance]);

    // =========================================================
    // LAYER VISIBILITY
    //
    // `layerOpacity` is the animated cross-fade value the Explore screen
    // drives every frame. A layer stays mounted while it fades and is
    // only hidden once its fade reaches zero, so the globe never blanks
    // between two layers, and rapid switching never rebuilds a canvas.
    // =========================================================

    const fadeFor = useCallback(
        (variable) => {
            const layerFade = Number(layerOpacity?.[variable] ?? 0);
            const userOpacity = Number(layerSettings?.[variable]?.opacity ?? 1);
            return layerFade * userOpacity;
        },
        [layerOpacity, layerSettings],
    );

    const temperatureFade = fadeFor("temperature");
    const salinityFade = fadeFor("salinity");
    const currentsFade = fadeFor("currents");
    const seaHeightFade = fadeFor("seaHeight");

    const paletteFor = (variable) => layerSettings?.[variable]?.paletteStops;
    const domainFor = (variable) => layerSettings?.[variable]?.domain;

    const flowVisible = layerSettings?.currents?.flowVisible !== false;

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div className="ox-globe">
            <div ref={containerRef} className="ox-globe__canvas" />

            <LayerErrorBoundary name="temperature" onFailure={onLayerFailure}>
                <TemperatureCanvasLayer
                    viewer={viewerInstance}
                    raster={layerDataByVariable?.temperature ?? null}
                    visible={temperatureFade > 0.002}
                    opacity={temperatureFade * 0.6}
                    palette={paletteFor("temperature")}
                    domain={domainFor("temperature")}
                />
            </LayerErrorBoundary>

            <LayerErrorBoundary name="salinity" onFailure={onLayerFailure}>
                <SalinityCanvasLayer
                    viewer={viewerInstance}
                    raster={layerDataByVariable?.salinity ?? null}
                    visible={salinityFade > 0.002}
                    opacity={salinityFade * 0.7}
                    palette={paletteFor("salinity")}
                    domain={domainFor("salinity")}
                />
            </LayerErrorBoundary>

            <LayerErrorBoundary name="currents" onFailure={onLayerFailure}>
                <CurrentFlowLayer
                    viewer={viewerInstance}
                    raster={layerDataByVariable?.currents ?? null}
                    visible={currentsFade > 0.002 && flowVisible}
                    opacity={currentsFade * 0.9}
                />
            </LayerErrorBoundary>

            <LayerErrorBoundary name="seaHeight" onFailure={onLayerFailure}>
                <SeaHeightTerrainLayer
                    viewer={viewerInstance}
                    raster={layerDataByVariable?.seaHeight ?? null}
                    visible={seaHeightFade > 0.002}
                    opacity={seaHeightFade * 0.85}
                />
            </LayerErrorBoundary>

            <LocationMarker viewer={viewerInstance} location={selectedLocation} />
        </div>
    );
}

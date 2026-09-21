import { useCallback, useEffect, useRef, useState } from "react";

import CesiumGlobe from "../components/CesiumGlobe.jsx";
import DataUploadModal from "../components/DataUploadModal.jsx";

import ExploreCommandBar, {
    CommandMenu,
    MenuItem,
} from "./ExploreCommandBar.jsx";

import LocationContextPanel from "./panels/LocationContextPanel.jsx";
import ExactCoordinatesContextPanel from "./panels/ExactCoordinatesContextPanel.jsx";
import LayerContextPanel from "./panels/LayerContextPanel.jsx";
import ColorContextPanel from "./panels/ColorContextPanel.jsx";
import DepthContextPanel from "./panels/DepthContextPanel.jsx";
import AnalysisContextPanel from "./panels/AnalysisContextPanel.jsx";
import IsoLayerContextPanel from "./panels/IsoLayerContextPanel.jsx";
import BottomDataDock from "./panels/BottomDataDock.jsx";

import { IconArea, IconClear, IconCrosshair, IconPin } from "./ui/Icons.jsx";

import { fetchOceanAreaAnalysis, fetchOceanLayer, fetchOceanPoint } from "./lib/api.js";
import { polygonAreaKm2 } from "./lib/areaAnalysis.js";
import { EXPLORE_LAYER_IDS, LAYERS, PALETTES, getLayer } from "./lib/layers.js";

import "./explore.css";

/* ==========================================================================
   OCEAN-X — Explore screen

   The globe is the product; every panel here is opened by a command and
   nothing is on screen by default except the globe, the command bar and the
   bottom dock. This component owns all Explore state and hands each piece
   only what it needs.
   ========================================================================== */

const FADE_MS = 650;

export default function ExploreScreen({ onOpenResearchWorkspace, onOpenDepthAnalysis }) {
    /* ---- Viewport ------------------------------------------------------ */

    const [viewport, setViewport] = useState(() => ({
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight,
    }));

    useEffect(() => {
        const onResize = () =>
            setViewport({
                width: document.documentElement.clientWidth,
                height: document.documentElement.clientHeight,
            });

        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    /* ---- Command bar ----------------------------------------------------
       Only one command menu is open at a time; only the tools the user has
       actually activated get a contextual panel. */

    const [openCommand, setOpenCommand] = useState(null);
    const [openTools, setOpenTools] = useState([]);

    const openTool = useCallback((id) => {
        const leftTools = new Set([
            "layers",
            "color",
            "depth",
            "analysis",
            "isolayer",
        ]);
        const rightTools = new Set(["location", "coordinates"]);
        const group = leftTools.has(id)
            ? leftTools
            : rightTools.has(id)
              ? rightTools
              : null;

        setOpenTools((previous) => {
            if (!group) {
                return previous.includes(id) ? previous : [...previous, id];
            }

            const next = previous.filter((item) => !group.has(item) || item === id);
            return next.includes(id) ? next : [...next, id];
        });
    }, []);

    const closeTool = useCallback((id) => {
        setOpenTools((previous) => previous.filter((item) => item !== id));
    }, []);

    /* ---- Location -------------------------------------------------------
       "point" is the default so a first-time user can click the globe with
       no setup. */

    const [selectionMode, setSelectionMode] = useState("point");
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [selectedArea, setSelectedArea] = useState(null);
    const [oceanData, setOceanData] = useState(null);
    const [pointStatus, setPointStatus] = useState({ state: "idle" });
    const [flyToLocation, setFlyToLocation] = useState(null);
    const pointRequestRef = useRef(0);

    const [areaAnalysis, setAreaAnalysis] = useState(null);
    const [areaAnalysisStatus, setAreaAnalysisStatus] = useState({ state: "idle" });
    const areaAnalysisRequestRef = useRef(0);
    const areaAnalysisAbortRef = useRef(null);

    const cancelAreaAnalysis = useCallback(() => {
        areaAnalysisRequestRef.current += 1;

        if (areaAnalysisAbortRef.current) {
            areaAnalysisAbortRef.current.abort();
            areaAnalysisAbortRef.current = null;
        }
    }, []);

    useEffect(() => () => cancelAreaAnalysis(), [cancelAreaAnalysis]);

    /* ---- Layers -----------------------------------------------------------
       Rasters are cached by variable: switching back and forth never
       re-fetches, and the cross-fade never waits on the network twice. */

    const [activeLayerId, setActiveLayerId] = useState(null);
    const [layerDataByVariable, setLayerDataByVariable] = useState({});
    const [layerErrors, setLayerErrors] = useState({});
    const [layerSettings, setLayerSettings] = useState(() =>
        Object.fromEntries(
            LAYERS.map((layer) => [
                layer.id,
                { opacity: 1, palette: layer.defaultPalette, domain: null },
            ]),
        ),
    );

    const updateLayerSettings = useCallback((id, patch) => {
        setLayerSettings((previous) => {
            const next = { ...previous[id], ...patch };

            // Resolve preset ramps once here. A custom ramp carries its own
            // paletteStops and must never be overwritten by the preset lookup.
            if (patch?.palette === "custom") {
                next.palette = "custom";

                if (
                    !Array.isArray(next.paletteStops) ||
                    next.paletteStops.length < 2
                ) {
                    const layer = getLayer(id);
                    next.paletteStops =
                        PALETTES[layer?.defaultPalette]?.stops;
                }
            } else if (patch?.palette && PALETTES[patch.palette]) {
                next.palette = patch.palette;
                next.paletteStops = PALETTES[patch.palette].stops;
                delete next.customColors;
            } else if (
                !Array.isArray(next.paletteStops) ||
                next.paletteStops.length < 2
            ) {
                const layer = getLayer(id);
                next.paletteStops =
                    PALETTES[layer?.defaultPalette]?.stops;
            }

            return { ...previous, [id]: next };
        });
    }, []);

    /* ---- Cross-fade -------------------------------------------------------
       One animated opacity per variable, independent of React's render
       cycle. Switching layers retargets whichever fades are running rather
       than restarting them, which is what makes rapid switching look
       continuous instead of jumpy. */

    const [layerOpacity, setLayerOpacity] = useState(() =>
        Object.fromEntries(LAYERS.map((layer) => [layer.id, 0])),
    );

    const fadeTargets = useRef(
        Object.fromEntries(LAYERS.map((layer) => [layer.id, 0])),
    );
    const fadeValues = useRef(
        Object.fromEntries(LAYERS.map((layer) => [layer.id, 0])),
    );

    useEffect(() => {
        for (const layer of LAYERS) {
            fadeTargets.current[layer.id] = layer.id === activeLayerId ? 1 : 0;
        }
    }, [activeLayerId]);

    useEffect(() => {
        let frame;
        let previous = performance.now();

        const tick = (now) => {
            const delta = now - previous;
            previous = now;

            const step = delta / FADE_MS;
            let changed = false;
            const next = {};

            for (const layer of LAYERS) {
                const id = layer.id;
                const target = fadeTargets.current[id];
                let value = fadeValues.current[id];

                if (value !== target) {
                    const direction = target > value ? 1 : -1;
                    value += direction * step;

                    if (
                        (direction === 1 && value > target) ||
                        (direction === -1 && value < target)
                    ) {
                        value = target;
                    }

                    changed = true;
                }

                fadeValues.current[id] = value;

                // Ease so the fade reads as intentional rather than linear.
                next[id] = value < 0.5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2;
            }

            if (changed) setLayerOpacity(next);

            frame = requestAnimationFrame(tick);
        };

        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, []);

    /* ---- Layer fetch ------------------------------------------------------ */

    useEffect(() => {
        if (!activeLayerId) return undefined;

        const layer = getLayer(activeLayerId);
        if (!layer || layer.status !== "live") return undefined;
        if (layerDataByVariable[activeLayerId]) return undefined;
        if (layerErrors[activeLayerId]) return undefined;

        const controller = new AbortController();

        fetchOceanLayer(activeLayerId, { signal: controller.signal })
            .then((result) => {
                setLayerDataByVariable((previous) => ({
                    ...previous,
                    [activeLayerId]: result,
                }));
            })
            .catch((error) => {
                if (error.name === "AbortError") return;

                setLayerErrors((previous) => ({
                    ...previous,
                    [activeLayerId]:
                        error.message ?? "Ocean data service unavailable.",
                }));
            });

        return () => controller.abort();
    }, [activeLayerId, layerDataByVariable, layerErrors]);

    const retryLayer = useCallback((id) => {
        setLayerErrors((previous) => {
            const next = { ...previous };
            delete next[id];
            return next;
        });
    }, []);

    const handleLayerFailure = useCallback((name, error) => {
        setLayerErrors((previous) => ({
            ...previous,
            [name]: error?.message ?? "This layer failed to render.",
        }));
    }, []);

    /* ---- Point + regional query -------------------------------------- */

    const inspectPoint = useCallback(async (latitude, longitude) => {
        const requestId = pointRequestRef.current + 1;
        pointRequestRef.current = requestId;

        setSelectedLocation({ latitude, longitude });
        cancelAreaAnalysis();
        setSelectedArea(null);
        setAreaAnalysis(null);
        setAreaAnalysisStatus({ state: "idle" });
        setOceanData(null);
        setPointStatus({ state: "loading" });

        try {
            const result = await fetchOceanPoint({ latitude, longitude });

            // A slower earlier request must not overwrite a newer one.
            if (pointRequestRef.current !== requestId) return;

            if (result.kind === "empty") {
                setPointStatus({ state: "empty", message: result.message });
                return;
            }

            setOceanData(result.data);
            setPointStatus({ state: "ready" });
        } catch (error) {
            if (pointRequestRef.current !== requestId) return;
            if (error.name === "AbortError") return;

            setPointStatus({
                state: "error",
                message: error.message ?? "Ocean data service unavailable.",
            });
        }
    }, [cancelAreaAnalysis]);

    const handleGlobeClick = useCallback(
        ({ lat, lng }) => {
            if (selectionMode === "area") return;

            // Argo / Float mode currently uses the same geographic click
            // target as point selection. The dedicated float-observation
            // data source can be wired here later without changing the
            // command-bar UX.
            inspectPoint(lat, lng);
            openTool("location");
        },
        [inspectPoint, openTool, selectionMode],
    );

    const handleAreaSelect = useCallback(
        (area) => {
            const points = area?.points ?? [];

            cancelAreaAnalysis();

            setSelectedArea(
                points.length
                    ? { ...area, points, areaKm2: polygonAreaKm2(points) }
                    : null,
            );
            setAreaAnalysis(null);
            setAreaAnalysisStatus({ state: "idle" });
            setSelectedLocation(null);
            setOceanData(null);
            setPointStatus({ state: "idle" });

            if (points.length) openTool("location");
        },
        [cancelAreaAnalysis, openTool],
    );

    const undoAreaPoint = useCallback(() => {
        cancelAreaAnalysis();

        setSelectedArea((previous) => {
            if (!previous?.points?.length) return previous;

            const points = previous.points.slice(0, -1);
            return points.length
                ? { ...previous, points, areaKm2: polygonAreaKm2(points) }
                : null;
        });

        setAreaAnalysis(null);
        setAreaAnalysisStatus({ state: "idle" });
    }, [cancelAreaAnalysis]);

    const clearAreaSelection = useCallback(() => {
        cancelAreaAnalysis();
        setSelectedArea(null);
        setAreaAnalysis(null);
        setAreaAnalysisStatus({ state: "idle" });
    }, [cancelAreaAnalysis]);

    const analyzeSelectedArea = useCallback(async () => {
        const polygon = selectedArea?.points;

        if (!Array.isArray(polygon) || polygon.length < 3) {
            setAreaAnalysisStatus({
                state: "invalid",
                message: "Add at least three points to analyze this area.",
            });
            return;
        }

        cancelAreaAnalysis();

        const requestId = areaAnalysisRequestRef.current;
        const controller = new AbortController();
        areaAnalysisAbortRef.current = controller;

        setAreaAnalysisStatus({ state: "loading" });
        setAreaAnalysis(null);

        try {
            const result = await fetchOceanAreaAnalysis(polygon, {
                signal: controller.signal,
            });

            if (areaAnalysisRequestRef.current !== requestId) return;

            if (Number(result?.cellsAnalyzed ?? 0) === 0) {
                setAreaAnalysisStatus({
                    state: "empty",
                    message:
                        result?.message ??
                        "No valid ocean grid cells fall inside the selected polygon.",
                });
                return;
            }

            setAreaAnalysis(result);
            setAreaAnalysisStatus({ state: "ready" });
        } catch (error) {
            if (error.name === "AbortError") return;
            if (areaAnalysisRequestRef.current !== requestId) return;

            setAreaAnalysisStatus({
                state: "error",
                message:
                    error?.message ??
                    "The regional analysis service could not be reached.",
            });
        } finally {
            if (areaAnalysisAbortRef.current === controller) {
                areaAnalysisAbortRef.current = null;
            }
        }
    }, [cancelAreaAnalysis, selectedArea]);

    const handleGoToLocation = useCallback(
        ({ latitude, longitude }) => {
            setFlyToLocation({ latitude, longitude, token: Date.now() });
            inspectPoint(latitude, longitude);
        },
        [inspectPoint],
    );

    /* ---- Globe handle --------------------------------------------------- */

    const [globeApi, setGlobeApi] = useState(null);
    const handleViewerReady = useCallback((api) => setGlobeApi(api), []);

    /* ---- Upload ----------------------------------------------------------- */

    const [uploadOpen, setUploadOpen] = useState(false);

    /* ---- Bottom dock ------------------------------------------------------ */

    const [dockCollapsed, setDockCollapsed] = useState(false);

    const chooseSelectionMode = useCallback(
        (mode) => {
            setOpenCommand(null);

            if (mode === "clear") {
                cancelAreaAnalysis();
                setSelectedLocation(null);
                setSelectedArea(null);
                setAreaAnalysis(null);
                setAreaAnalysisStatus({ state: "idle" });
                setOceanData(null);
                setPointStatus({ state: "idle" });
                closeTool("location");
                closeTool("coordinates");
                setSelectionMode("point");
                return;
            }

            if (mode === "coordinates") {
                cancelAreaAnalysis();
                setSelectedArea(null);
                setAreaAnalysis(null);
                setAreaAnalysisStatus({ state: "idle" });
                closeTool("location");
                setSelectionMode("coordinates");
                openTool("coordinates");
                return;
            }

            if (mode !== "area") {
                cancelAreaAnalysis();
                setSelectedArea(null);
                setAreaAnalysis(null);
                setAreaAnalysisStatus({ state: "idle" });
            }

            closeTool("coordinates");
            setSelectionMode(mode);
            openTool("location");
        },
        [cancelAreaAnalysis, closeTool, openTool],
    );

    const chooseLayer = useCallback((id) => {
        setActiveLayerId((current) => (current === id ? null : id));
        setOpenCommand(null);
        if (id !== activeLayerId) openTool("layers");
    }, [activeLayerId, openTool]);

    const openColor = useCallback(() => {
        setOpenCommand(null);
        openTool("color");
    }, [openTool]);

    // Full-screen research navigation must always clear any contextual
    // Explore panels first. Otherwise an active layer panel can retain its
    // overlay state while App.jsx changes the top-level screen.
    const openDepth = useCallback(() => {
        setOpenCommand(null);
        setOpenTools([]);
        onOpenDepthAnalysis?.();
    }, [onOpenDepthAnalysis]);

    const openAnalysis = useCallback(() => {
        setOpenCommand(null);
        setOpenTools([]);
        onOpenResearchWorkspace?.("analysis");
    }, [onOpenResearchWorkspace]);

    const openIsoLayer = useCallback(() => {
        setOpenCommand(null);
        openTool("isolayer");
    }, [openTool]);

    /* ---- Command handling ------------------------------------------------- */

    // Analysis and Depth are full-screen research tools, not contextual
    // panels on top of the globe. Route them through App.jsx when their
    // command-bar buttons are clicked. All other commands keep the normal
    // contextual-menu behavior.
    const handleOpenCommand = useCallback(
        (id) => {
            if (id === "analysis") {
                openAnalysis();
                return;
            }

            if (id === "depth") {
                openDepth();
                return;
            }

            setOpenCommand((current) => (current === id ? null : id));
        },
        [openAnalysis, openDepth],
    );

    const activeLayer = getLayer(activeLayerId);
    const activeRaster = activeLayerId
        ? layerDataByVariable[activeLayerId]
        : null;
    const activeLoading =
        Boolean(activeLayerId) &&
        activeLayer?.status === "live" &&
        !layerDataByVariable[activeLayerId] &&
        !layerErrors[activeLayerId];

    return (
        <div className="ox-explore">
            <CesiumGlobe
                viewport={viewport}
                onGlobeClick={handleGlobeClick}
                onAreaSelect={handleAreaSelect}
                onViewerReady={handleViewerReady}
                onLayerFailure={handleLayerFailure}
                selectionMode={selectionMode}
                selectedLocation={selectedLocation}
                selectedArea={selectedArea}
                flyToLocation={flyToLocation}
                layerDataByVariable={layerDataByVariable}
                layerOpacity={layerOpacity}
                layerSettings={layerSettings}
            />

            <ExploreCommandBar
                openCommand={openCommand}
                onOpenCommand={handleOpenCommand}
                activeTools={openTools}
                selectionMode={selectionMode}
                activeLayer={activeLayer}
                onOpenDataUpload={() => setUploadOpen(true)}
                onOpenAnalysis={openAnalysis}
                onOpenDepthAnalysis={openDepth}
            >
                {openCommand === "location" && (
                    <CommandMenu
                        command="location"
                        title="Location"
                        hint="Choose how to inspect the ocean"
                    >
                        <MenuItem
                            icon={<IconPin />}
                            label="Point selection"
                            detail="Click the globe to inspect a cell"
                            active={selectionMode === "point"}
                            onClick={() => chooseSelectionMode("point")}
                        />
                        <MenuItem
                            icon={<IconArea />}
                            label="Area selection"
                            detail="Click vertices to outline a custom region"
                            active={selectionMode === "area"}
                            onClick={() => chooseSelectionMode("area")}
                        />
                        <MenuItem
                            icon={<IconPin />}
                            label="Argo / Float selection"
                            detail="Select an Argo float or ocean drifter"
                            active={selectionMode === "argo"}
                            onClick={() => chooseSelectionMode("argo")}
                        />
                        <MenuItem
                            icon={<IconCrosshair />}
                            label="Exact coordinates"
                            detail="Type a latitude and longitude"
                            active={openTools.includes("coordinates")}
                            onClick={() => chooseSelectionMode("coordinates")}
                        />
                        <MenuItem
                            icon={<IconClear />}
                            label="Clear selection"
                            disabled={!selectedLocation && !selectedArea}
                            onClick={() => chooseSelectionMode("clear")}
                        />
                    </CommandMenu>
                )}

                {openCommand === "layers" && (
                    <CommandMenu
                        command="layers"
                        title="Model layers"
                        hint="Temperature, Salinity, Currents, Chlorophyll"
                    >
                        {EXPLORE_LAYER_IDS.map((id) => {
                            const layer = getLayer(id);
                            if (!layer) return null;

                            return (
                                <MenuItem
                                    key={layer.id}
                                    label={layer.label}
                                    detail={layer.description}
                                    active={activeLayerId === layer.id}
                                    onClick={() => chooseLayer(layer.id)}
                                />
                            );
                        })}

                        <div className="ox-menu__section-label">Additional data</div>

                        <MenuItem
                            label="More layers"
                            detail="Additional datasets will appear here"
                            badge="Soon"
                            disabled
                            onClick={() => {}}
                        />
                    </CommandMenu>
                )}

                {openCommand === "color" && (
                    <CommandMenu command="color" title="Colour" hint="Visualisation only">
                        <MenuItem
                            label="Open colour mapping"
                            detail={
                                activeLayer
                                    ? `Editing ${activeLayer.label}`
                                    : "Activate a layer first"
                            }
                            onClick={openColor}
                        />
                    </CommandMenu>
                )}

                {openCommand === "isolayer" && (
                    <CommandMenu command="isolayer" title="IsoLayer" hint="Requires depth-resolved data">
                        <MenuItem label="Open isolayer panel" onClick={openIsoLayer} />
                    </CommandMenu>
                )}
            </ExploreCommandBar>

            {openTools.includes("location") && (
                <LocationContextPanel
                    selectionMode={selectionMode}
                    selectedLocation={selectedLocation}
                    selectedArea={selectedArea}
                    oceanData={oceanData}
                    pointStatus={pointStatus}
                    areaAnalysis={areaAnalysis}
                    areaAnalysisStatus={areaAnalysisStatus}
                    onAnalyzeArea={analyzeSelectedArea}
                    onUndoAreaPoint={undoAreaPoint}
                    onClearArea={clearAreaSelection}
                    onClose={() => closeTool("location")}
                />
            )}

            {openTools.includes("coordinates") && (
                <ExactCoordinatesContextPanel
                    selectedLocation={selectedLocation}
                    oceanData={oceanData}
                    pointStatus={pointStatus}
                    onGoToLocation={handleGoToLocation}
                    onClose={() => closeTool("coordinates")}
                />
            )}

            {openTools.includes("layers") && activeLayer && (
                <LayerContextPanel
                    layer={activeLayer}
                    raster={activeRaster}
                    loading={activeLoading}
                    error={layerErrors[activeLayerId]}
                    settings={layerSettings}
                    onSettingsChange={updateLayerSettings}
                    onRetry={() => retryLayer(activeLayerId)}
                    onClose={() => closeTool("layers")}
                />
            )}

            {openTools.includes("color") && (
                <ColorContextPanel
                    layer={activeLayer}
                    raster={activeRaster}
                    settings={layerSettings}
                    onSettingsChange={updateLayerSettings}
                    onClose={() => closeTool("color")}
                />
            )}

            {openTools.includes("depth") && (
                <DepthContextPanel
                    oceanData={oceanData}
                    selectedLocation={selectedLocation}
                    onClose={() => closeTool("depth")}
                />
            )}

            {openTools.includes("analysis") && (
                <AnalysisContextPanel
                    layer={activeLayer}
                    raster={activeRaster}
                    oceanData={oceanData}
                    selectedLocation={selectedLocation}
                    onClose={() => closeTool("analysis")}
                />
            )}

            {openTools.includes("isolayer") && (
                <IsoLayerContextPanel
                    rasters={layerDataByVariable}
                    onClose={() => closeTool("isolayer")}
                />
            )}

            <BottomDataDock
                collapsed={dockCollapsed}
                onToggleCollapsed={() => setDockCollapsed((value) => !value)}
                layer={activeLayer}
                raster={activeRaster}
                settings={layerSettings}
                oceanData={oceanData}
                globeApi={globeApi}
            />

            <DataUploadModal
                isOpen={uploadOpen}
                onClose={() => setUploadOpen(false)}
            />
        </div>
    );
}

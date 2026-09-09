import { useCallback, useEffect, useState } from "react";

import Header from "./components/Header";
import CesiumGlobe from "./components/CesiumGlobe";
import LayerPanel from "./components/LayerPanel";
import LocationPanel from "./components/LocationPanel";
import DataUploadModal from "./components/DataUploadModal.jsx";
import ShipTracker from "./components/ShipTracker";

function App() {
    // =========================================================
    // VIEWPORT
    // =========================================================

    const [viewport, setViewport] = useState({
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight,
    });

    // =========================================================
    // LOCATION / POINT DATA
    // =========================================================

    const [selectedLocation, setSelectedLocation] = useState(null);
    const [oceanData, setOceanData] = useState(null);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    // =========================================================
    // ACTIVE LAYER
    // =========================================================

    const [selectedVariable, setSelectedVariable] = useState(null);

    // =========================================================
    // LAYER DATA
    // =========================================================

    const [layerDataByVariable, setLayerDataByVariable] = useState({});
    const [layerLoading, setLayerLoading] = useState(false);

    // =========================================================
    // DATASET MODAL
    // =========================================================

    const [showDatasetModal, setShowDatasetModal] = useState(false);

    // =========================================================
    // SHIP TRACKING
    // =========================================================

    const [trackingShips, setTrackingShips] = useState(false);

    // =========================================================
    // VIEWPORT RESIZE
    // =========================================================

    useEffect(() => {
        const handleResize = () => {
            setViewport({
                width: document.documentElement.clientWidth,
                height: document.documentElement.clientHeight,
            });
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    // =========================================================
    // LAYER SELECTION
    // =========================================================

    const handleVariableChange = (variable) => {
        if (selectedVariable === variable) {
            setSelectedVariable(null);
            return;
        }

        setSelectedVariable(variable);
    };

    // =========================================================
    // FETCH LAYER DATA
    // =========================================================

    useEffect(() => {
        if (!selectedVariable) {
            setLayerLoading(false);
            return;
        }

        if (layerDataByVariable[selectedVariable]) {
            setLayerLoading(false);
            return;
        }

        const controller = new AbortController();

        const fetchLayerData = async () => {
            setLayerLoading(true);

            try {
                console.log(
                    `Fetching ${selectedVariable} raster...`
                );

                const response = await fetch(
                    `http://localhost:5001/api/ocean-layer?variable=${selectedVariable}`,
                    {
                        signal: controller.signal,
                    }
                );

                const result = await response.json();

                console.log(
                    "Ocean raster response:",
                    result
                );

                if (!response.ok) {
                    throw new Error(
                        result.error ||
                            "Failed to fetch ocean raster"
                    );
                }

                setLayerDataByVariable((previous) => ({
                    ...previous,
                    [selectedVariable]: result,
                }));
            } catch (error) {
                if (error.name === "AbortError") {
                    return;
                }

                console.error(
                    "Layer API error:",
                    error
                );
            } finally {
                if (!controller.signal.aborted) {
                    setLayerLoading(false);
                }
            }
        };

        fetchLayerData();

        return () => {
            controller.abort();
        };
    }, [selectedVariable, layerDataByVariable]);

    // =========================================================
    // GLOBE CLICK
    // =========================================================

    const handleGlobeClick = useCallback(
        async ({ lat, lng }) => {
            console.log(
                "Globe clicked:",
                lat,
                lng
            );

            setSelectedLocation({
                latitude: lat,
                longitude: lng,
            });

            setOceanData(null);
            setMessage("");
            setLoading(true);

            try {
                const response = await fetch(
                    `http://localhost:5001/api/ocean-data?latitude=${lat}&longitude=${lng}`
                );

                const result = await response.json();

                console.log(
                    "Backend response:",
                    result
                );

                if (!response.ok) {
                    setMessage(
                        result.message ||
                            "Something went wrong."
                    );

                    return;
                }

                if (!result.hasOceanData) {
                    setMessage(result.message);
                    return;
                }

                setOceanData(result);
            } catch (error) {
                console.error(
                    "API error:",
                    error
                );

                setMessage(
                    "Could not connect to the backend."
                );
            } finally {
                setLoading(false);
            }
        },
        []
    );

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div className="app">

            {/* =================================================
                HEADER
            ================================================= */}

            <Header />

            {/* =================================================
                ADD NEW DATA
            ================================================= */}

            <button
                type="button"
                className="add-dataset-button"
                onClick={() => setShowDatasetModal(true)}
            >
                <span className="add-dataset-icon">
                    +
                </span>

                <span>
                    Add New Data
                </span>
            </button>

            {/* =================================================
                SHIP TRACKER
            ================================================= */}

            <ShipTracker
                tracking={trackingShips}
                onTrackingChange={setTrackingShips}
            />

            {/* =================================================
                LAYER PANEL
            ================================================= */}

            <LayerPanel
                selectedVariable={selectedVariable}
                onVariableChange={handleVariableChange}
                layerLoading={layerLoading}
            />

            {/* =================================================
                MAIN CONTENT
            ================================================= */}

            <main className="main-content">

                {/* =================================================
                    CESIUM GLOBE
                ================================================= */}

                <CesiumGlobe
                    viewport={viewport}
                    onGlobeClick={handleGlobeClick}
                    selectedVariable={selectedVariable}
                    selectedLocation={selectedLocation}
                    layerDataByVariable={layerDataByVariable}
                    trackingShips={trackingShips}
                />

                {/* =================================================
                    LOCATION PANEL
                ================================================= */}

                <LocationPanel
                    selectedLocation={selectedLocation}
                    oceanData={oceanData}
                    message={message}
                    loading={loading}
                />

            </main>

            {/* =================================================
                STATUS BAR
            ================================================= */}

            <footer className="status-bar">

                <div>
                    <span className="status-dot"></span>
                    POSTGIS DATABASE CONNECTED
                </div>

                <div>
                    OCEAN MODEL DATA · 138,240 POINTS
                </div>

                <div>
                    OCEAN-X v0.1
                </div>

            </footer>

            {/* =================================================
                DATASET MODAL
            ================================================= */}

            <DataUploadModal
                isOpen={showDatasetModal}
                onClose={() => setShowDatasetModal(false)}
            />

        </div>
    );
}

export default App;
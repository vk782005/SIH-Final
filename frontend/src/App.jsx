import { useCallback, useEffect, useState } from "react";

import Header from "./components/Header";
import CesiumGlobe from "./components/CesiumGlobe";
import LayerPanel from "./components/LayerPanel";
import LocationPanel from "./components/LocationPanel";
import DataUploadModal from "./components/DataUploadModal";
import ShipTracker from "./components/ShipTracker";

import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import TemperaturePage from "./pages/TemperaturePage.jsx";
import SalinityPage from "./pages/SalinityPage.jsx";
import CurrentsPage from "./pages/CurrentsPage";
import ChlorophyllPage from "./pages/ChlorophyllPage.jsx";

// =============================================================
// APP
// =============================================================

function App() {

    // =========================================================
    // AUTHENTICATION
    // =========================================================

    const [isAuthenticated, setIsAuthenticated] =
        useState(false);

    const [userRole, setUserRole] =
        useState(null);


    // =========================================================
    // STUDENT NAVIGATION
    // =========================================================

    const [studentPage, setStudentPage] =
        useState("dashboard");

    const [showGlobe, setShowGlobe] =
        useState(false);


    // =========================================================
    // LOGIN
    // =========================================================

    const handleLogin = (role) => {

        console.log(
            "Logged in as:",
            role
        );

        setUserRole(role);
        setIsAuthenticated(true);


        // -----------------------------------------------------
        // STUDENT
        // -----------------------------------------------------

        if (role === "student") {

            setStudentPage("dashboard");

            setShowGlobe(false);

            return;
        }


        // -----------------------------------------------------
        // OTHER ROLES
        // -----------------------------------------------------

        setShowGlobe(true);
    };


    // =========================================================
    // VIEWPORT
    // =========================================================

    const [viewport, setViewport] =
        useState({
            width:
                document.documentElement.clientWidth,

            height:
                document.documentElement.clientHeight,
        });


    // =========================================================
    // LOCATION / POINT DATA
    // =========================================================

    const [selectedLocation, setSelectedLocation] =
        useState(null);

    const [oceanData, setOceanData] =
        useState(null);

    const [message, setMessage] =
        useState("");

    const [loading, setLoading] =
        useState(false);


    // =========================================================
    // ACTIVE LAYER
    // =========================================================

    const [selectedVariable, setSelectedVariable] =
        useState(null);


    // =========================================================
    // LAYER DATA
    // =========================================================

    const [layerDataByVariable, setLayerDataByVariable] =
        useState({});

    const [layerLoading, setLayerLoading] =
        useState(false);


    // =========================================================
    // DATASET MODAL
    // =========================================================

    const [showDatasetModal, setShowDatasetModal] =
        useState(false);


    // =========================================================
    // SHIP TRACKING
    // =========================================================

    const [trackingShips, setTrackingShips] =
        useState(false);


    // =========================================================
    // VIEWPORT RESIZE
    // =========================================================

    useEffect(() => {

        const handleResize = () => {

            setViewport({
                width:
                    document.documentElement.clientWidth,

                height:
                    document.documentElement.clientHeight,
            });
        };


        window.addEventListener(
            "resize",
            handleResize
        );


        return () => {

            window.removeEventListener(
                "resize",
                handleResize
            );
        };

    }, []);


    // =========================================================
    // LAYER SELECTION
    // =========================================================

    const handleVariableChange = (variable) => {

        // Clicking the currently selected layer
        // turns it off.

        if (
            selectedVariable === variable
        ) {

            setSelectedVariable(null);

            return;
        }


        setSelectedVariable(variable);
    };


    // =========================================================
    // FETCH OCEAN LAYER DATA
    // =========================================================

    useEffect(() => {

        // -----------------------------------------------------
        // Nothing selected
        // -----------------------------------------------------

        if (!selectedVariable) {

            setLayerLoading(false);

            return;
        }


        // -----------------------------------------------------
        // Already loaded
        // -----------------------------------------------------

        if (
            layerDataByVariable[selectedVariable]
        ) {

            setLayerLoading(false);

            return;
        }


        const controller =
            new AbortController();


        // -----------------------------------------------------
        // Fetch
        // -----------------------------------------------------

        const fetchLayerData = async () => {

            setLayerLoading(true);


            try {

                console.log(
                    `Fetching ${selectedVariable} raster...`
                );


                const response =
                    await fetch(
                        `http://localhost:5001/api/ocean-layer?variable=${selectedVariable}`,
                        {
                            signal:
                                controller.signal,
                        }
                    );


                const result =
                    await response.json();


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


                // -------------------------------------------------
                // Store data by variable
                // -------------------------------------------------

                setLayerDataByVariable(
                    (previous) => ({
                        ...previous,

                        [selectedVariable]:
                            result,
                    })
                );


            } catch (error) {

                // Ignore aborted requests

                if (
                    error.name ===
                    "AbortError"
                ) {

                    return;
                }


                console.error(
                    "Layer API error:",
                    error
                );


            } finally {

                if (
                    !controller.signal.aborted
                ) {

                    setLayerLoading(false);
                }
            }
        };


        fetchLayerData();


        // -----------------------------------------------------
        // Cleanup
        // -----------------------------------------------------

        return () => {

            controller.abort();
        };


    }, [
        selectedVariable,
        layerDataByVariable,
    ]);


    // =========================================================
    // GLOBE CLICK
    // =========================================================

    const handleGlobeClick =
        useCallback(
            async ({ lat, lng }) => {

                console.log(
                    "Globe clicked:",
                    lat,
                    lng
                );


                // -------------------------------------------------
                // Store selected location
                // -------------------------------------------------

                setSelectedLocation({
                    latitude:
                        lat,

                    longitude:
                        lng,
                });


                // -------------------------------------------------
                // Clear previous data
                // -------------------------------------------------

                setOceanData(null);

                setMessage("");

                setLoading(true);


                try {

                    // -------------------------------------------------
                    // Request nearest ocean observation
                    // -------------------------------------------------

                    const response =
                        await fetch(
                            `http://localhost:5001/api/ocean-data?latitude=${lat}&longitude=${lng}`
                        );


                    const result =
                        await response.json();


                    console.log(
                        "Backend response:",
                        result
                    );


                    // -------------------------------------------------
                    // API error
                    // -------------------------------------------------

                    if (
                        !response.ok
                    ) {

                        setMessage(
                            result.message ||
                            "Something went wrong."
                        );

                        return;
                    }


                    // -------------------------------------------------
                    // No ocean data
                    // -------------------------------------------------

                    if (
                        !result.hasOceanData
                    ) {

                        setMessage(
                            result.message
                        );

                        return;
                    }


                    // -------------------------------------------------
                    // Successful result
                    // -------------------------------------------------

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
    // LOGIN SCREEN
    // =========================================================

    if (
        !isAuthenticated
    ) {

        return (
            <Login
                onLogin={
                    handleLogin
                }
            />
        );
    }


    // =========================================================
    // STUDENT DASHBOARD
    // =========================================================

    if (
        userRole === "student" &&
        !showGlobe &&
        studentPage === "dashboard"
    ) {

        return (
            <StudentDashboard

                // -----------------------------------------------
                // Launch main Cesium globe
                // -----------------------------------------------

                onLaunchGlobe={() => {

                    setShowGlobe(true);
                }}


                // -----------------------------------------------
                // Open a learning parameter
                // -----------------------------------------------

                onOpenParameter={
                    (parameter) => {

                        console.log(
                            "Opening learning parameter:",
                            parameter
                        );

                        setStudentPage(
                            parameter
                        );
                    }
                }

            />
        );
    }


    // =========================================================
    // TEMPERATURE LEARNING PAGE
    // =========================================================

    if (
        userRole === "student" &&
        !showGlobe &&
        studentPage === "temperature"
    ) {

        return (
            <TemperaturePage

                // -----------------------------------------------
                // Back to student dashboard
                // -----------------------------------------------

                onBack={() => {

                    console.log(
                        "Returning to student dashboard"
                    );

                    setStudentPage(
                        "dashboard"
                    );
                }}


                // -----------------------------------------------
                // Open the actual Cesium exploration application
                // -----------------------------------------------

                onLaunchGlobe={() => {

                    console.log(
                        "Launching Ocean-X globe"
                    );

                    setShowGlobe(true);
                }}

            />
        );
    }


    // =========================================================
    // SALINITY LEARNING PAGE
    // =========================================================

    if (
        userRole === "student" &&
        !showGlobe &&
        studentPage === "salinity"
    ) {

        return (
            <SalinityPage

                // -----------------------------------------------
                // Back to student dashboard
                // -----------------------------------------------

                onBack={() => {

                    console.log(
                        "Returning to student dashboard"
                    );

                    setStudentPage(
                        "dashboard"
                    );
                }}


                // -----------------------------------------------
                // Open the actual Cesium exploration application
                // -----------------------------------------------

                onLaunchGlobe={() => {

                    console.log(
                        "Launching Ocean-X globe"
                    );

                    setShowGlobe(true);
                }}

            />
        );
    }


    // =========================================================
    // CURRENTS LEARNING PAGE
    // =========================================================

    if (
        userRole === "student" &&
        !showGlobe &&
        studentPage === "currents"
    ) {

        return (
            <CurrentsPage

                // -----------------------------------------------
                // Back to student dashboard
                // -----------------------------------------------

                onBackToDashboard={() => {

                    console.log(
                        "Returning to student dashboard"
                    );

                    setStudentPage(
                        "dashboard"
                    );
                }}


                // -----------------------------------------------
                // Open the actual Cesium exploration application
                // -----------------------------------------------

                onLaunchGlobe={() => {

                    console.log(
                        "Launching Ocean-X globe"
                    );

                    setShowGlobe(true);
                }}

            />
        );
    }


    // =========================================================
    // CHLOROPHYLL LEARNING PAGE
    // =========================================================
    //
    // StudentDashboard
    //       ↓
    // Chlorophyll
    //       ↓
    // studentPage = "chlorophyll"
    //       ↓
    // ChlorophyllPage.jsx
    //
    // IMPORTANT:
    // This stays separate from the main Cesium application.
    // =========================================================

    if (
        userRole === "student" &&
        !showGlobe &&
        studentPage === "chlorophyll"
    ) {

        return (
            <ChlorophyllPage

                // -----------------------------------------------
                // Back to student dashboard
                // -----------------------------------------------

                onBackToDashboard={() => {

                    console.log(
                        "Returning to student dashboard"
                    );

                    setStudentPage(
                        "dashboard"
                    );
                }}


                // -----------------------------------------------
                // Open the actual Cesium exploration application
                // -----------------------------------------------

                onLaunchGlobe={() => {

                    console.log(
                        "Launching Ocean-X globe"
                    );

                    setShowGlobe(true);
                }}

            />
        );
    }


    // =========================================================
    // OCEAN-X CESIUM APPLICATION
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
                onClick={() =>
                    setShowDatasetModal(true)
                }
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

                tracking={
                    trackingShips
                }

                onTrackingChange={
                    setTrackingShips
                }

            />


            {/* =================================================
                LAYER PANEL
            ================================================= */}

            <LayerPanel

                selectedVariable={
                    selectedVariable
                }

                onVariableChange={
                    handleVariableChange
                }

                layerLoading={
                    layerLoading
                }

            />


            {/* =================================================
                MAIN CONTENT
            ================================================= */}

            <main className="main-content">


                {/* =================================================
                    CESIUM GLOBE
                ================================================= */}

                <CesiumGlobe

                    viewport={
                        viewport
                    }

                    onGlobeClick={
                        handleGlobeClick
                    }

                    selectedVariable={
                        selectedVariable
                    }

                    selectedLocation={
                        selectedLocation
                    }

                    layerDataByVariable={
                        layerDataByVariable
                    }

                    trackingShips={
                        trackingShips
                    }

                />


                {/* =================================================
                    LOCATION / POINT INFORMATION
                ================================================= */}

                <LocationPanel

                    selectedLocation={
                        selectedLocation
                    }

                    oceanData={
                        oceanData
                    }

                    message={
                        message
                    }

                    loading={
                        loading
                    }

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

                    OCEAN MODEL DATA ·
                    138,240 POINTS

                </div>


                <div>

                    OCEAN-X v0.1

                </div>

            </footer>


            {/* =================================================
                DATASET UPLOAD MODAL
            ================================================= */}

            <DataUploadModal

                isOpen={
                    showDatasetModal
                }

                onClose={() =>
                    setShowDatasetModal(false)
                }

            />

        </div>
    );
}


// =============================================================
// EXPORT
// =============================================================

export default App;
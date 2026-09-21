import { useState } from "react";

import ExploreScreen from "./explore/ExploreScreen.jsx";

import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import TemperaturePage from "./pages/TemperaturePage.jsx";
import SalinityPage from "./pages/SalinityPage.jsx";
import CurrentsPage from "./pages/CurrentsPage";
import ChlorophyllPage from "./pages/ChlorophyllPage.jsx";
import ResearchWorkspace from "./pages/ResearchWorkspace/ResearchWorkspace";
import DepthAnalysisPage from "./pages/DepthAnalysisPage/DepthAnalysisPage";
import DataUploadModal from "./components/DataUploadModal.jsx";

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

    // Workspace/depth navigation is kept at the app level so the globe
    // command bar can open the full research tools without duplicating
    // those pages inside ExploreScreen.
    const [workspacePage, setWorkspacePage] =
        useState("overview");

    const [showDepthAnalysis, setShowDepthAnalysis] =
        useState(false);

    const [showDatasetModal, setShowDatasetModal] =
        useState(false);


    // =========================================================
    // LOGIN
    // =========================================================

    const handleLogin = (role) => {

        console.log(
            "Logged in as:",
            role
        );

        const normalizedRole =
            String(role || "")
                .trim()
                .toLowerCase();

        setUserRole(normalizedRole);
        setIsAuthenticated(true);


        // -----------------------------------------------------
        // STUDENT
        // -----------------------------------------------------

        if (normalizedRole === "student") {

            setStudentPage("dashboard");
            setShowGlobe(false);
            setShowDepthAnalysis(false);

            return;
        }


        // -----------------------------------------------------
        // ADMIN / ADMINISTRATOR / RESEARCHER
        // -----------------------------------------------------

        // Research-capable roles land directly in the Cesium Ocean Explorer.
        // The full Research Workspace / Analysis Lab is opened explicitly
        // from the globe command bar via the Analysis command. Depth Analysis
        // is likewise opened explicitly from the Depth command.

        if (
            normalizedRole === "admin" ||
            normalizedRole === "administrator" ||
            normalizedRole === "researcher"
        ) {

            setShowGlobe(true);
            setShowDepthAnalysis(false);
            setWorkspacePage("overview");

            return;
        }


        // -----------------------------------------------------
        // FALLBACK
        // -----------------------------------------------------

        setShowGlobe(true);
        setShowDepthAnalysis(false);
    };



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
    // DEPTH ANALYSIS
    // =========================================================

    if (
        (
            userRole === "admin" ||
            userRole === "administrator" ||
            userRole === "researcher"
        ) &&
        !showGlobe &&
        showDepthAnalysis
    ) {
        return (
            <DepthAnalysisPage
                onOpenGlobe={() => {
                    setShowDepthAnalysis(false);
                    setShowGlobe(true);
                }}
                onNavigate={(page) => {
                    if (page === "analysis") {
                        setShowDepthAnalysis(false);
                        setWorkspacePage("analysis");
                        setShowGlobe(false);
                        return;
                    }

                    if (page === "explorer") {
                        setShowDepthAnalysis(false);
                        setShowGlobe(true);
                    }
                }}
            />
        );
    }


    // =========================================================
    // RESEARCH WORKSPACE
    // =========================================================

    if (
        (
            userRole === "admin" ||
            userRole === "administrator" ||
            userRole === "researcher"
        ) &&
        !showGlobe
    ) {

        return (
            <>
                <ResearchWorkspace
                    initialPage={workspacePage}
                    onOpenGlobe={() => {
                        setShowDepthAnalysis(false);
                        setShowGlobe(true);
                    }}
                    onAddData={() => setShowDatasetModal(true)}
                    onLogout={() => {
                        setIsAuthenticated(false);
                        setUserRole(null);
                        setShowGlobe(false);
                        setShowDepthAnalysis(false);
                        setShowDatasetModal(false);
                        setStudentPage("dashboard");
                        setWorkspacePage("overview");
                    }}
                />

                <DataUploadModal
                    isOpen={showDatasetModal}
                    onClose={() => setShowDatasetModal(false)}
                />
            </>
        );
    }


    // =========================================================
    // OCEAN-X CESIUM APPLICATION
    // =========================================================

    return (
        <ExploreScreen
            onOpenResearchWorkspace={(page = "analysis") => {
                setWorkspacePage(page);
                setShowDepthAnalysis(false);
                setShowGlobe(false);
            }}
            onOpenDepthAnalysis={() => {
                setShowDepthAnalysis(true);
                setShowGlobe(false);
            }}
        />
    );
}


// =============================================================
// EXPORT
// =============================================================

export default App;
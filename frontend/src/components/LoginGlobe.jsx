import { useEffect, useRef } from "react";
import * as Cesium from "cesium";

import "cesium/Build/Cesium/Widgets/widgets.css";
import "./LoginGlobe.css";

function LoginGlobe() {
    const containerRef = useRef(null);
    const viewerRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) {
            return;
        }

        // =====================================================
        // CREATE VIEWER
        // EXACT SAME CONFIGURATION AS YOUR WORKING GLOBE
        // =====================================================

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

        // =====================================================
        // INITIAL CAMERA
        // EXACT SAME CAMERA AS YOUR WORKING GLOBE
        // =====================================================

        viewer.camera.setView({
            destination:
                Cesium.Cartesian3.fromDegrees(
                    79,
                    23,
                    12000000
                ),
        });

        // =====================================================
        // MAKE SURE GLOBE IS VISIBLE
        // =====================================================

        viewer.scene.globe.show = true;

        // =====================================================
        // REMOVE CESIUM UI
        // =====================================================

        if (
            viewer.cesiumWidget &&
            viewer.cesiumWidget.creditContainer
        ) {
            viewer.cesiumWidget.creditContainer.style.display =
                "none";
        }

        // =====================================================
        // RESIZE
        // =====================================================

        const handleResize = () => {
            if (
                viewer &&
                !viewer.isDestroyed()
            ) {
                viewer.resize();
            }
        };

        window.addEventListener(
            "resize",
            handleResize
        );

        // Give the browser time to calculate
        // the dimensions of the left panel.

        requestAnimationFrame(() => {
            handleResize();
        });

        // =====================================================
        // CLEANUP
        // =====================================================

        return () => {
            window.removeEventListener(
                "resize",
                handleResize
            );

            if (
                viewer &&
                !viewer.isDestroyed()
            ) {
                viewer.destroy();
            }

            viewerRef.current = null;
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="login-globe-container"
        />
    );
}

export default LoginGlobe;
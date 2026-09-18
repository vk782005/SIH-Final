import { useEffect, useRef } from "react";
import * as Cesium from "cesium";

import "cesium/Build/Cesium/Widgets/widgets.css";
import "./LoginGlobe.css";

function LoginGlobe() {
    const globeContainer = useRef(null);

    useEffect(() => {
        if (!globeContainer.current) {
            return;
        }

        // =====================================================
        // CREATE IMAGERY PROVIDER
        // =====================================================

        const imageryProvider =
            new Cesium.UrlTemplateImageryProvider({
                url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",

                credit:
                    "© OpenStreetMap contributors",
            });


        // =====================================================
        // CREATE CESIUM VIEWER
        // =====================================================

        const viewer = new Cesium.Viewer(
            globeContainer.current,
            {
                imageryProvider: imageryProvider,

                terrainProvider:
                    new Cesium.EllipsoidTerrainProvider(),

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

                scene3DOnly: true,

                shadows: false,
            }
        );


        // =====================================================
        // REMOVE CESIUM UI
        // =====================================================

        if (viewer.cesiumWidget.creditContainer) {
            viewer.cesiumWidget.creditContainer.style.display =
                "none";
        }


        // =====================================================
        // GLOBE SETTINGS
        // =====================================================

        const globe = viewer.scene.globe;

        globe.show = true;

        globe.enableLighting = false;

        globe.showGroundAtmosphere = true;

        globe.depthTestAgainstTerrain = false;


        // =====================================================
        // SKY
        // =====================================================

        viewer.scene.backgroundColor =
            Cesium.Color.fromCssColorString(
                "#020811"
            );

        viewer.scene.skyAtmosphere.show = true;


        // =====================================================
        // CAMERA
        // =====================================================

        const earthPosition =
            Cesium.Cartesian3.fromDegrees(
                72,
                15,
                9000000
            );

        viewer.camera.setView({
            destination: earthPosition,
        });


        // =====================================================
        // FORCE CAMERA TO LOOK AT EARTH
        // =====================================================

        viewer.camera.lookAt(
            Cesium.Cartesian3.fromDegrees(
                72,
                15,
                0
            ),
            new Cesium.HeadingPitchRange(
                0,
                Cesium.Math.toRadians(-8),
                9000000
            )
        );


        // =====================================================
        // RELEASE CAMERA CONTROL
        // =====================================================

        viewer.camera.lookAtTransform(
            Cesium.Matrix4.IDENTITY
        );


        // =====================================================
        // MAKE GLOBE INTERACTIVE
        // =====================================================

        viewer.scene.screenSpaceCameraController.enableRotate =
            true;

        viewer.scene.screenSpaceCameraController.enableZoom =
            false;

        viewer.scene.screenSpaceCameraController.enableTranslate =
            false;

        viewer.scene.screenSpaceCameraController.enableTilt =
            false;

        viewer.scene.screenSpaceCameraController.enableLook =
            false;


        // =====================================================
        // SLOW AUTOMATIC ROTATION
        // =====================================================

        let lastTime = performance.now();

        const rotateEarth = () => {

            if (viewer.isDestroyed()) {
                return;
            }

            const now = performance.now();

            const delta =
                now - lastTime;

            lastTime = now;

            viewer.camera.rotateRight(
                delta * 0.000002
            );
        };


        viewer.clock.shouldAnimate = true;

        viewer.scene.postRender.addEventListener(
            rotateEarth
        );


        // =====================================================
        // RESIZE OBSERVER
        // =====================================================

        const resizeObserver =
            new ResizeObserver(() => {

                if (!viewer.isDestroyed()) {
                    viewer.resize();
                }

            });


        resizeObserver.observe(
            globeContainer.current
        );


        // =====================================================
        // CLEANUP
        // =====================================================

        return () => {

            resizeObserver.disconnect();

            if (!viewer.isDestroyed()) {
                viewer.destroy();
            }
        };

    }, []);


    return (
        <div
            ref={globeContainer}
            className="login-globe"
        />
    );
}

export default LoginGlobe;
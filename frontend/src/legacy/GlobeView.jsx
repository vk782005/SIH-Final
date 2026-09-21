import { useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";
import * as THREE from "three";

import LocationMarker from "../components/LocationMarker";
import CurrentFlow from "./CurrentFlow";
import SeaSurfaceTowers from "./SeaSurfaceTowers";

// =========================================================
// CONSTANTS
// =========================================================

const GLOBE_RADIUS = 100;

// Globe.gl altitude is expressed as a fraction of
// the globe radius.
const DATA_ALTITUDE = 0.008;

// =========================================================
// SHARED LAYER TRANSITION
// =========================================================

const TRANSITION_DURATION_MS = 700;

// =========================================================
// SCALAR INITIAL FADE
// =========================================================

const FADE_DELAY_MS = 1000;
const FADE_DURATION_MS = 900;

// =========================================================
// EASING
// =========================================================

function easeInOutCubic(t) {
    t = THREE.MathUtils.clamp(t, 0, 1);

    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// =========================================================
// SCALAR FADE HELPER
// =========================================================

function startFade(material, targetValue, withDelay = false) {
    if (!material) {
        return;
    }

    const now = performance.now();

    const currentValue = material.uniforms.uFadeIn.value;

    material.userData.fadeFrom = currentValue;

    material.userData.fadeTo = targetValue;

    material.userData.fadeStart = now + (withDelay ? FADE_DELAY_MS : 0);

    material.userData.fadeDuration = FADE_DURATION_MS;
}

// =========================================================
// COMPONENT
// =========================================================

export default function GlobeView({
    viewport,
    onGlobeClick,
    layerDataByVariable,
    selectedVariable,
    selectedLocation,
}) {
    const globeRef = useRef(null);

    // Two independent scalar renderers are kept alive so
    // Temperature and Salinity can crossfade instead of replacing
    // the same point cloud.
    const scalarRenderersRef = useRef({
        temperature: null,
        salinity: null,
    });

    const gridKeyRef = useRef({
        temperature: null,
        salinity: null,
    });

    const latestLayerRef = useRef(layerDataByVariable);

    // =====================================================
    // GLOBE READINESS
    // =====================================================

    const [globeReady, setGlobeReady] = useState(false);

    // =====================================================
    // SELECTED VARIABLE REF
    //
    // Keeps animation callbacks synced without
    // restarting the animation loop.
    // =====================================================

    const selectedVariableRef = useRef(selectedVariable);

    selectedVariableRef.current = selectedVariable;

    // =====================================================
    // LATEST DATA
    // =====================================================

    latestLayerRef.current = layerDataByVariable;

    // =====================================================
    // SHARED TRANSITION CONTROLLER
    // =====================================================
    //
    // This is the central transition state for:
    //
    // Temperature
    // Salinity
    // Currents
    // Sea Surface Height
    //
    // Child renderers will consume this in the
    // following steps.
    // =====================================================

    const transitionRef = useRef({
        from: selectedVariable,
        to: selectedVariable,
        progress: 1,
        easedProgress: 1,
        startTime: performance.now(),
        duration: TRANSITION_DURATION_MS,
        active: false,
    });

    const previousVariableRef = useRef(selectedVariable);

    const [layerTransition, setLayerTransition] = useState({
        from: selectedVariable,
        to: selectedVariable,
        progress: 1,
        easedProgress: 1,
        active: false,
    });

    // =====================================================
    // START SHARED LAYER TRANSITION
    // =====================================================

    useEffect(() => {
        const previousVariable = previousVariableRef.current;

        if (previousVariable === selectedVariable) {
            return;
        }

        const now = performance.now();

        const currentTransition = transitionRef.current;

        // -------------------------------------------------
        // Preserve current visual progress if the user
        // switches again before the previous transition
        // finishes.
        // -------------------------------------------------

        let currentProgress = 1;

        if (currentTransition.active) {
            currentProgress = THREE.MathUtils.clamp(
                (now - currentTransition.startTime) /
                    currentTransition.duration,
                0,
                1,
            );
        }

        const currentEasedProgress = currentTransition.active
            ? easeInOutCubic(currentProgress)
            : 1;

        // -------------------------------------------------
        // Start the new transition.
        // -------------------------------------------------

        transitionRef.current = {
            from: previousVariable,
            to: selectedVariable,
            progress: currentEasedProgress,
            easedProgress: currentEasedProgress,
            startTime: now,
            duration: TRANSITION_DURATION_MS,
            active: true,
        };

        previousVariableRef.current = selectedVariable;

        setLayerTransition({
            from: previousVariable,
            to: selectedVariable,
            progress: currentEasedProgress,
            easedProgress: currentEasedProgress,
            active: true,
        });
    }, [selectedVariable]);

    // =====================================================
    // SHARED TRANSITION ANIMATION LOOP
    // =====================================================

    useEffect(() => {
        let animationFrame;

        const animateTransition = () => {
            const transition = transitionRef.current;

            if (transition.active) {
                const now = performance.now();

                const rawProgress = Math.min(
                    1,
                    Math.max(
                        0,
                        (now - transition.startTime) / transition.duration,
                    ),
                );

                const easedProgress = easeInOutCubic(rawProgress);

                transition.progress = rawProgress;

                transition.easedProgress = easedProgress;

                // -------------------------------------------------
                // Expose current transition state to children.
                // -------------------------------------------------

                setLayerTransition({
                    from: transition.from,

                    to: transition.to,

                    progress: rawProgress,

                    easedProgress: easedProgress,

                    active: rawProgress < 1,
                });

                // -------------------------------------------------
                // Transition finished.
                // -------------------------------------------------

                if (rawProgress >= 1) {
                    transition.active = false;

                    transition.progress = 1;

                    transition.easedProgress = 1;

                    setLayerTransition({
                        from: transition.from,

                        to: transition.to,

                        progress: 1,

                        easedProgress: 1,

                        active: false,
                    });
                }
            }

            animationFrame = requestAnimationFrame(animateTransition);
        };

        animateTransition();

        return () => {
            cancelAnimationFrame(animationFrame);
        };
    }, []);

    // =====================================================
    // CREATE / UPDATE DATA POINT CLOUD
    // =====================================================

    const updatePointCloud = (data, variable) => {
        if (!data) {
            return;
        }

        const globe = globeRef.current;

        if (!globe) {
            return;
        }

        const scene = globe.scene();

        if (!scene) {
            return;
        }

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
        } = data;

        if (!width || !height || !values) {
            return;
        }

        const count = width * height;

        if (variable !== "temperature" && variable !== "salinity") {
            return;
        }

        let renderer = scalarRenderersRef.current[variable];

        // =================================================
        // GRID IDENTITY
        // =================================================

        const gridKey = [
            width,
            height,
            minLatitude,
            minLongitude,
            latStep,
            lonStep,
        ].join("|");

        const needsNewGeometry =
            !renderer || gridKeyRef.current[variable] !== gridKey;

        // =================================================
        // BUILD FIXED GEOMETRY
        // =================================================

        if (needsNewGeometry) {
            // ---------------------------------------------
            // REMOVE PREVIOUS CLOUD
            // ---------------------------------------------

            if (renderer?.points) {
                scene.remove(renderer.points);
            }

            if (renderer?.geometry) {
                renderer.geometry.dispose();
            }

            if (renderer?.material) {
                renderer.material.dispose();
            }

            // ---------------------------------------------
            // POSITION BUFFER
            // ---------------------------------------------

            const positions = new Float32Array(count * 3);

            let index = 0;

            // ---------------------------------------------
            // BUILD POSITIONS
            // ---------------------------------------------

            for (let row = 0; row < height; row++) {
                const latitude = minLatitude + row * latStep;

                for (let col = 0; col < width; col++) {
                    const longitude = minLongitude + col * lonStep;

                    const coords = globe.getCoords(
                        latitude,
                        longitude,
                        DATA_ALTITUDE,
                    );

                    positions[index * 3] = coords.x;

                    positions[index * 3 + 1] = coords.y;

                    positions[index * 3 + 2] = coords.z;

                    index++;
                }
            }

            // ---------------------------------------------
            // THREE GEOMETRY
            // ---------------------------------------------

            const geometry = new THREE.BufferGeometry();

            geometry.setAttribute(
                "position",
                new THREE.BufferAttribute(positions, 3),
            );

            // ---------------------------------------------
            // VALUE ATTRIBUTE
            // ---------------------------------------------

            const valueArray = new Float32Array(count);

            // ---------------------------------------------
            // VALIDITY ATTRIBUTE
            // ---------------------------------------------

            const validArray = new Float32Array(count);

            geometry.setAttribute(
                "aValue",
                new THREE.BufferAttribute(valueArray, 1),
            );

            geometry.setAttribute(
                "aValid",
                new THREE.BufferAttribute(validArray, 1),
            );

            geometry.computeBoundingSphere();

            // ---------------------------------------------
            // SHADER MATERIAL
            // ---------------------------------------------

            const material = new THREE.ShaderMaterial({
                uniforms: {
                    uMin: {
                        value: Number.isFinite(Number(min)) ? Number(min) : 0,
                    },

                    uMax: {
                        value: Number.isFinite(Number(max)) ? Number(max) : 1,
                    },

                    uPointSize: {
                        value: 2.65,
                    },

                    uTime: {
                        value: 0,
                    },

                    uFadeIn: {
                        value: 0,
                    },
                },

                vertexShader: `
                        attribute float aValue;
                        attribute float aValid;

                        uniform float uPointSize;
                        uniform float uFadeIn;

                        varying float vValue;
                        varying float vValid;

                        void main() {

                            vValue = aValue;
                            vValid = aValid;

                            vec4 mvPosition =
                                modelViewMatrix *
                                vec4(position, 1.0);

                            float distanceScale =
                                300.0 /
                                max(-mvPosition.z, 1.0);

                            float sizeFade =
                                mix(
                                    0.55,
                                    1.0,
                                    uFadeIn
                                );

                            gl_PointSize =
                                uPointSize *
                                distanceScale *
                                sizeFade;

                            gl_Position =
                                projectionMatrix *
                                mvPosition;
                        }
                    `,

                fragmentShader: `
                        precision highp float;

                        uniform float uMin;
                        uniform float uMax;
                        uniform float uTime;
                        uniform float uFadeIn;

                        varying float vValue;
                        varying float vValid;

                        vec3 oceanPalette(
                            float t
                        ) {

                            t =
                                clamp(
                                    t,
                                    0.0,
                                    1.0
                                );

                            vec3 c0 =
                                vec3(
                                    0.0,
                                    35.0 / 255.0,
                                    180.0 / 255.0
                                );

                            vec3 c1 =
                                vec3(
                                    0.0,
                                    150.0 / 255.0,
                                    1.0
                                );

                            vec3 c2 =
                                vec3(
                                    0.0,
                                    220.0 / 255.0,
                                    220.0 / 255.0
                                );

                            vec3 c3 =
                                vec3(
                                    0.0,
                                    220.0 / 255.0,
                                    100.0 / 255.0
                                );

                            vec3 c4 =
                                vec3(
                                    1.0,
                                    220.0 / 255.0,
                                    0.0
                                );

                            vec3 c5 =
                                vec3(
                                    1.0,
                                    35.0 / 255.0,
                                    20.0 / 255.0
                                );

                            if (t < 0.2) {

                                return mix(
                                    c0,
                                    c1,
                                    t / 0.2
                                );

                            } else if (
                                t < 0.4
                            ) {

                                return mix(
                                    c1,
                                    c2,
                                    (t - 0.2) /
                                        0.2
                                );

                            } else if (
                                t < 0.6
                            ) {

                                return mix(
                                    c2,
                                    c3,
                                    (t - 0.4) /
                                        0.2
                                );

                            } else if (
                                t < 0.8
                            ) {

                                return mix(
                                    c3,
                                    c4,
                                    (t - 0.6) /
                                        0.2
                                );

                            } else {

                                return mix(
                                    c4,
                                    c5,
                                    (t - 0.8) /
                                        0.2
                                );
                            }
                        }

                        void main() {

                            if (
                                vValid < 0.5
                            ) {
                                discard;
                            }

                            if (
                                uFadeIn <= 0.0
                            ) {
                                discard;
                            }

                            vec2 uv =
                                gl_PointCoord -
                                vec2(0.5);

                            float distanceFromCenter =
                                length(uv);

                            if (
                                distanceFromCenter >
                                0.5
                            ) {
                                discard;
                            }

                            float range =
                                max(
                                    uMax - uMin,
                                    0.000001
                                );

                            float t =
                                clamp(
                                    (
                                        vValue -
                                        uMin
                                    ) /
                                        range,
                                    0.0,
                                    1.0
                                );

                            vec3 baseColor =
                                oceanPalette(t);

                            float core =
                                1.0 -
                                smoothstep(
                                    0.0,
                                    0.42,
                                    distanceFromCenter
                                );

                            float edge =
                                1.0 -
                                smoothstep(
                                    0.27,
                                    0.50,
                                    distanceFromCenter
                                );

                            float shimmer =
                                sin(
                                    uTime *
                                        1.4 +
                                    vValue *
                                        8.0
                                ) *
                                    0.5 +
                                0.5;

                            float brightness =
                                0.90 +
                                core *
                                    0.35 +
                                shimmer *
                                    0.045;

                            vec3 finalColor =
                                baseColor *
                                brightness;

                            finalColor +=
                                vec3(
                                    0.04,
                                    0.20,
                                    0.30
                                ) *
                                edge *
                                0.14;

                            float alpha =
                                0.62 +
                                core *
                                    0.28;

                            alpha *=
                                uFadeIn;

                            gl_FragColor =
                                vec4(
                                    finalColor,
                                    alpha
                                );
                        }
                    `,

                transparent: true,

                depthTest: true,

                depthWrite: false,

                blending: THREE.NormalBlending,

                toneMapped: false,
            });

            // ---------------------------------------------
            // INITIAL REVEAL
            // ---------------------------------------------

            startFade(material, 1, true);

            // ---------------------------------------------
            // POINT CLOUD
            // ---------------------------------------------

            const points = new THREE.Points(geometry, material);

            points.raycast = () => {};

            points.renderOrder = 20;

            points.visible = false;

            scene.add(points);

            // ---------------------------------------------
            // SAVE PER-VARIABLE REFERENCES
            // ---------------------------------------------

            renderer = {
                points,
                geometry,
                material,
            };

            scalarRenderersRef.current[variable] = renderer;
            gridKeyRef.current[variable] = gridKey;
        }

        // =================================================
        // UPDATE DATA
        // =================================================

        if (!renderer) {
            renderer = scalarRenderersRef.current[variable];
        }

        const geometry = renderer?.geometry;

        const material = renderer?.material;

        if (!geometry || !material) {
            return;
        }

        const valueAttribute = geometry.getAttribute("aValue");

        const validAttribute = geometry.getAttribute("aValid");

        const valueArray = valueAttribute.array;

        const validArray = validAttribute.array;

        // =================================================
        // COPY NEW VARIABLE
        // =================================================

        for (let i = 0; i < count; i++) {
            const value = values[i];

            if (
                value === null ||
                value === undefined ||
                !Number.isFinite(Number(value))
            ) {
                valueArray[i] = 0;

                validArray[i] = 0;
            } else {
                valueArray[i] = Number(value);

                validArray[i] = 1;
            }
        }

        valueAttribute.needsUpdate = true;

        validAttribute.needsUpdate = true;

        // =================================================
        // UPDATE COLOR RANGE
        // =================================================

        material.uniforms.uMin.value = Number.isFinite(Number(min))
            ? Number(min)
            : 0;

        material.uniforms.uMax.value = Number.isFinite(Number(max))
            ? Number(max)
            : 1;
    };

    // =====================================================
    // SCALAR LAYER VISIBILITY
    // =====================================================

    useEffect(() => {
        const renderers = scalarRenderersRef.current;

        // Dedicated renderers handle these layers.
        if (selectedVariable === "currents" || selectedVariable === "seaHeight") {
            for (const key of ["temperature", "salinity"]) {
                const renderer = renderers[key];
                if (renderer) {
                    renderer.points.visible = false;
                    renderer.material.uniforms.uFadeIn.value = 0;
                }
            }
            return;
        }

        if (!selectedVariable) {
            for (const key of ["temperature", "salinity"]) {
                const renderer = renderers[key];
                if (renderer) {
                    renderer.points.visible = false;
                    renderer.material.uniforms.uFadeIn.value = 0;
                }
            }
            return;
        }

        const renderer = renderers[selectedVariable];
        if (renderer) {
            renderer.points.visible = true;
        }
    }, [selectedVariable, layerDataByVariable]);

    // =====================================================
    // SCALAR DATA CHANGE
    // =====================================================

    useEffect(() => {
        if (!selectedVariable) return;

        if (
            selectedVariable === "currents" ||
            selectedVariable === "seaHeight"
        ) {
            return;
        }

        const data = layerDataByVariable[selectedVariable];
        if (!data) return;

        if (!globeRef.current) {
            requestAnimationFrame(() => {
                const latestData = latestLayerRef.current[selectedVariable];
                if (latestData) {
                    updatePointCloud(latestData, selectedVariable);
                }
            });
            return;
        }

        updatePointCloud(data, selectedVariable);
    }, [layerDataByVariable, selectedVariable]);

    // =====================================================
    // GLOBE READY
    // =====================================================

    const handleGlobeReady = () => {
        setGlobeReady(true);

        requestAnimationFrame(() => {
            const latest = latestLayerRef.current;

            if (latest.temperature) {
                updatePointCloud(latest.temperature, "temperature");
            }

            if (latest.salinity) {
                updatePointCloud(latest.salinity, "salinity");
            }
        });
    };

    // =====================================================
    // SCALAR ANIMATION
    // =====================================================

    useEffect(() => {
        let animationFrame;

        const animate = () => {
            const now = performance.now();
            const transition = transitionRef.current;
            const renderers = scalarRenderersRef.current;

            // -------------------------------------------------
            // Update shader time and transition opacity for both
            // scalar layers independently.
            // -------------------------------------------------

            for (const variable of ["temperature", "salinity"]) {
                const renderer = renderers[variable];
                if (!renderer) continue;

                const material = renderer.material;
                material.uniforms.uTime.value = now / 1000;

                let opacity = 0;

                if (!selectedVariableRef.current) {
                    opacity = 0;
                } else if (transition.active) {
                    const p = transition.easedProgress;

                    if (transition.from === variable) {
                        opacity = 1 - p;
                    }

                    if (transition.to === variable) {
                        opacity = p;
                    }
                } else if (selectedVariableRef.current === variable) {
                    opacity = 1;
                }

                if (
                    selectedVariableRef.current === "currents" ||
                    selectedVariableRef.current === "seaHeight"
                ) {
                    opacity = 0;
                }

                material.uniforms.uFadeIn.value = opacity;
                renderer.points.visible = opacity > 0.001;
            }

            animationFrame = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            cancelAnimationFrame(animationFrame);
        };
    }, []);

    // =====================================================
    // CLEANUP
    // =====================================================

    useEffect(() => {
        return () => {
            const globe = globeRef.current;
            const scene = globe ? globe.scene() : null;

            for (const variable of ["temperature", "salinity"]) {
                const renderer = scalarRenderersRef.current[variable];
                if (!renderer) continue;

                if (scene && renderer.points) {
                    scene.remove(renderer.points);
                }

                renderer.geometry?.dispose();
                renderer.material?.dispose();
            }

            scalarRenderersRef.current.temperature = null;
            scalarRenderersRef.current.salinity = null;
        };
    }, []);

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <>
            <Globe
                ref={globeRef}
                width={viewport.width}
                height={viewport.height}
                globeRadius={GLOBE_RADIUS}
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
                bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
                showAtmosphere={true}
                atmosphereColor="#4cc9f0"
                atmosphereAltitude={0.18}
                onGlobeClick={onGlobeClick}
                onGlobeReady={handleGlobeReady}
            />

            {/* =================================================
                LOCATION MARKER
            ================================================= */}

            <LocationMarker globeRef={globeRef} location={selectedLocation} />

            {/* =================================================
                CURRENT FLOW

                Transition information is now passed from
                the shared GlobeView controller.

                CurrentFlow consumes the cached currents dataset.
            ================================================= */}

            {globeReady &&
                (selectedVariable === "currents" ||
                    layerTransition.from === "currents" ||
                    layerTransition.to === "currents") &&
                layerDataByVariable.currents && (
                    <CurrentFlow
                        key="current-flow"
                        globeRef={globeRef}
                        data={layerDataByVariable.currents}
                        layerTransition={layerTransition}
                    />
                )}

            {/* =================================================
                SEA SURFACE HEIGHT

                Transition information is now passed from
                the shared GlobeView controller.

                SeaSurfaceTowers consumes the cached SSH dataset.
            ================================================= */}

            {globeReady &&
                (selectedVariable === "seaHeight" ||
                    layerTransition.from === "seaHeight" ||
                    layerTransition.to === "seaHeight") &&
                layerDataByVariable.seaHeight && (
                    <SeaSurfaceTowers
                        key="sea-surface-towers"
                        globeRef={globeRef}
                        data={layerDataByVariable.seaHeight}
                        layerTransition={layerTransition}
                    />
                )}
        </>
    );
}

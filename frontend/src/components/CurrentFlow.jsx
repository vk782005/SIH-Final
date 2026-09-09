import { useEffect, useRef } from "react";
import * as THREE from "three";

// ============================================================
// OCEAN-X — ESRI-STYLE OCEAN CURRENT TRACKS
//
// Visual system:
//   -> builds fixed tracks on the globe
//   -> animates a short bright window along each track
//   -> participates in the shared OCEAN-X layer transition
//
// The current animation itself remains independent.
// The shared layer transition controls only the overall
// visibility of the current renderer.
// ============================================================

const GLOBE_RADIUS = 100;
const CURRENT_ALTITUDE = 0.008;

const SURFACE_RADIUS =
    GLOBE_RADIUS * (1 + CURRENT_ALTITUDE);

// Number of independent current tracks.
const TRACK_COUNT = 360;

// Number of vector-field integration steps per track.
const TRACK_LENGTH = 18;

// Geographic step used when following the vector field.
const STEP_DEGREES = 0.55;

// Minimum track length to keep.
const MIN_TRACK_POINTS = 6;

// Number of segments visible in the moving bright window.
const ACTIVE_SEGMENTS = 8;

// How often the visible window advances.
const ANIMATION_INTERVAL = 45;

// Maximum visible opacity.
const MAX_OPACITY = 0.95;

// Wider faint halo around the current trail.
const GLOW_OPACITY = 0.16;
const GLOW_WIDTH = 2.4;
const CORE_WIDTH = 1.0;

// White current lines.
const FLOW_COLOR = 0xffffff;

// ============================================================
// Shared transition easing
// ============================================================

function easeInOutCubic(t) {
    t = THREE.MathUtils.clamp(t, 0, 1);

    return t < 0.5
        ? 4 * t * t * t
        : 1 -
              Math.pow(
                  -2 * t + 2,
                  3
              ) /
                  2;
}

// ============================================================
// Helpers
// ============================================================

function clamp(value, min, max) {
    return Math.max(
        min,
        Math.min(max, value)
    );
}

function normalizeLongitude(lon) {
    while (lon > 180) lon -= 360;
    while (lon < -180) lon += 360;

    return lon;
}

function getPosition(
    globe,
    lat,
    lon
) {
    const p =
        globe.getCoords(
            clamp(
                lat,
                -89.5,
                89.5
            ),
            normalizeLongitude(lon),
            CURRENT_ALTITUDE
        );

    const v =
        new THREE.Vector3(
            p.x,
            p.y,
            p.z
        );

    // Force the point onto the exact visual surface.
    return v
        .normalize()
        .multiplyScalar(
            SURFACE_RADIUS
        );
}

// ============================================================
// Bilinear U/V lookup
// ============================================================

function getVelocity(
    lat,
    lon,
    data
) {
    const rows =
        data.height;

    const cols =
        data.width;

    const rawLat =
        (lat -
            data.minLatitude) /
        data.latStep;

    if (
        rawLat < 0 ||
        rawLat >= rows - 1
    ) {
        return null;
    }

    let wrappedLon =
        normalizeLongitude(lon);

    let rawLon =
        (wrappedLon -
            data.minLongitude) /
        data.lonStep;

    while (rawLon < 0) {
        rawLon += cols;
    }

    while (rawLon >= cols) {
        rawLon -= cols;
    }

    const r0 =
        Math.floor(rawLat);

    const r1 =
        r0 + 1;

    const c0 =
        Math.floor(rawLon);

    const c1 =
        (c0 + 1) % cols;

    const fx =
        rawLon - c0;

    const fy =
        rawLat - r0;

    const indices = [
        r0 * cols + c0,
        r0 * cols + c1,
        r1 * cols + c0,
        r1 * cols + c1,
    ];

    const weights = [
        (1 - fx) * (1 - fy),
        fx * (1 - fy),
        (1 - fx) * fy,
        fx * fy,
    ];

    let u = 0;
    let v = 0;
    let totalWeight = 0;

    for (
        let i = 0;
        i < 4;
        i++
    ) {
        const uu =
            Number(
                data.uValues[
                    indices[i]
                ]
            );

        const vv =
            Number(
                data.vValues[
                    indices[i]
                ]
            );

        if (
            !Number.isFinite(uu) ||
            !Number.isFinite(vv)
        ) {
            continue;
        }

        u +=
            uu *
            weights[i];

        v +=
            vv *
            weights[i];

        totalWeight +=
            weights[i];
    }

    if (
        totalWeight <= 0
    ) {
        return null;
    }

    u /=
        totalWeight;

    v /=
        totalWeight;

    const speed =
        Math.hypot(u, v);

    if (
        !Number.isFinite(speed)
    ) {
        return null;
    }

    return {
        u,
        v,
        speed,
    };
}

// ============================================================
// Follow the actual vector field
// ============================================================

function buildTrack(
    startLat,
    startLon,
    data
) {
    const track = [];

    let lat = startLat;
    let lon = startLon;

    for (
        let step = 0;
        step < TRACK_LENGTH;
        step++
    ) {
        const velocity =
            getVelocity(
                lat,
                lon,
                data
            );

        if (!velocity) {
            break;
        }

        if (
            velocity.speed <
            0.00001
        ) {
            break;
        }

        track.push({
            lat,
            lon,
            speed:
                velocity.speed,
        });

        const magnitude =
            velocity.speed;

        const east =
            velocity.u /
            magnitude;

        const north =
            velocity.v /
            magnitude;

        const latRadians =
            THREE.MathUtils.degToRad(
                lat
            );

        const cosLat =
            Math.max(
                Math.cos(
                    latRadians
                ),
                0.2
            );

        // U = east/west
        // V = north/south

        lat +=
            north *
            STEP_DEGREES;

        lon +=
            (east *
                STEP_DEGREES) /
            cosLat;

        lon =
            normalizeLongitude(
                lon
            );

        if (
            lat <= -78 ||
            lat >= 84
        ) {
            break;
        }
    }

    if (
        track.length <
        MIN_TRACK_POINTS
    ) {
        return null;
    }

    return track;
}

// ============================================================
// Convert geographic track to a smooth spherical track.
// ============================================================

function smoothTrack(
    globe,
    track
) {
    const source =
        track.map(
            point =>
                getPosition(
                    globe,
                    point.lat,
                    point.lon
                )
        );

    if (
        source.length < 2
    ) {
        return null;
    }

    const curve =
        new THREE.CatmullRomCurve3(
            source,
            false,
            "catmullrom",
            0.35
        );

    const sampleCount =
        Math.max(
            source.length * 2,
            12
        );

    const points =
        curve.getSpacedPoints(
            sampleCount
        );

    // Re-project to exact sphere.
    for (
        const point of points
    ) {
        point
            .normalize()
            .multiplyScalar(
                SURFACE_RADIUS
            );
    }

    return points;
}

// ============================================================
// Component
// ============================================================

export default function CurrentFlow({
    globeRef,
    data,
    layerTransition,
}) {
    // --------------------------------------------------------
    // Store transition information without forcing the
    // expensive track-building effect to restart.
    // --------------------------------------------------------

    const transitionRef =
        useRef(
            layerTransition
        );

    transitionRef.current =
        layerTransition;

    useEffect(() => {
        let cancelled = false;

        let retryFrame = null;
        let animationTimer = null;
        let transitionFrame = null;

        let geometry = null;
        let material = null;
        let glowMaterial = null;

        let lines = null;

        let opacityAttribute =
            null;

        // ====================================================
        // CLEANUP
        // ====================================================

        function cleanup() {
            if (
                retryFrame !==
                null
            ) {
                cancelAnimationFrame(
                    retryFrame
                );

                retryFrame =
                    null;
            }

            if (
                transitionFrame !==
                null
            ) {
                cancelAnimationFrame(
                    transitionFrame
                );

                transitionFrame =
                    null;
            }

            if (
                animationTimer !==
                null
            ) {
                clearInterval(
                    animationTimer
                );

                animationTimer =
                    null;
            }

            if (lines) {
                lines.parent?.remove(
                    lines
                );
            }

            geometry?.dispose();

            material?.dispose();

            glowMaterial?.dispose();

            geometry =
                null;

            material =
                null;

            glowMaterial =
                null;

            lines =
                null;

            opacityAttribute =
                null;
        }

        // ====================================================
        // TRANSITION OPACITY
        // ====================================================

        function updateTransitionOpacity() {
            if (
                cancelled
            ) {
                return;
            }

            const transition =
                transitionRef.current;

            if (
                !transition ||
                !lines
            ) {
                transitionFrame =
                    requestAnimationFrame(
                        updateTransitionOpacity
                    );

                return;
            }

            const from =
                transition.from;

            const to =
                transition.to;

            const progress =
                transition.active
                    ? transition.easedProgress
                    : transition.progress;

            let transitionOpacity =
                0;

            // ------------------------------------------------
            // CurrentFlow is the DESTINATION when:
            //
            // from -> currents
            //
            // ------------------------------------------------

            if (
                to === "currents"
            ) {
                transitionOpacity =
                    easeInOutCubic(
                        progress
                    );
            }

            // ------------------------------------------------
            // CurrentFlow is the SOURCE when:
            //
            // currents -> something else
            //
            // ------------------------------------------------

            else if (
                from === "currents"
            ) {
                transitionOpacity =
                    1 -
                    easeInOutCubic(
                        progress
                    );
            }

            // ------------------------------------------------
            // No current transition.
            //
            // If mounted while currents is active, remain
            // fully visible.
            // ------------------------------------------------

            else {
                transitionOpacity =
                    selectedIsCurrents(
                        from,
                        to
                    )
                        ? 1
                        : 0;
            }

            transitionOpacity =
                THREE.MathUtils.clamp(
                    transitionOpacity,
                    0,
                    1
                );

            if (material) {
                material.uniforms.uOpacityMultiplier.value =
                    transitionOpacity;
            }

            if (glowMaterial) {
                glowMaterial.uniforms.uOpacityMultiplier.value =
                    GLOW_OPACITY *
                    transitionOpacity;
            }

            transitionFrame =
                requestAnimationFrame(
                    updateTransitionOpacity
                );
        }

        function selectedIsCurrents(
            from,
            to
        ) {
            return (
                from ===
                    "currents" ||
                to ===
                    "currents"
            );
        }

        // ====================================================
        // BUILD CURRENT FLOW
        // ====================================================

        function start() {
            if (
                cancelled
            ) {
                return;
            }

            const globe =
                globeRef.current;

            if (!globe) {
                retryFrame =
                    requestAnimationFrame(
                        start
                    );

                return;
            }

            const scene =
                globe.scene?.();

            if (!scene) {
                retryFrame =
                    requestAnimationFrame(
                        start
                    );

                return;
            }

            if (
                !data ||
                !data.uValues ||
                !data.vValues ||
                !data.width ||
                !data.height
            ) {
                console.log(
                    "OCEAN-X: waiting for current data..."
                );

                return;
            }

            // =================================================
            // BUILD VALID SEEDS
            // =================================================

            const seeds = [];

            const seedStride =
                6;

            for (
                let row = 3;
                row <
                    data.height -
                        3;
                row +=
                    seedStride
            ) {
                const lat =
                    data.minLatitude +
                    row *
                        data.latStep;

                if (
                    lat <= -70 ||
                    lat >= 80
                ) {
                    continue;
                }

                for (
                    let col = 0;
                    col <
                        data.width;
                    col +=
                        seedStride
                ) {
                    const lon =
                        data.minLongitude +
                        col *
                            data.lonStep;

                    const velocity =
                        getVelocity(
                            lat,
                            lon,
                            data
                        );

                    if (
                        !velocity ||
                        velocity.speed <
                            0.00001
                    ) {
                        continue;
                    }

                    seeds.push({
                        lat,
                        lon,
                    });
                }
            }

            if (
                !seeds.length
            ) {
                console.error(
                    "OCEAN-X: no valid current seeds"
                );

                return;
            }

            // =================================================
            // SELECT EVENLY DISTRIBUTED SEEDS
            // =================================================

            const selectedSeeds =
                [];

            const seedStep =
                seeds.length /
                TRACK_COUNT;

            for (
                let i = 0;
                i <
                    TRACK_COUNT;
                i++
            ) {
                selectedSeeds.push(
                    seeds[
                        Math.floor(
                            i *
                                seedStep
                        ) %
                            seeds.length
                    ]
                );
            }

            // =================================================
            // BUILD TRACKS
            // =================================================

            const tracks = [];

            for (
                let i = 0;
                i <
                    selectedSeeds.length;
                i++
            ) {
                const seed =
                    selectedSeeds[
                        i
                    ];

                const track =
                    buildTrack(
                        seed.lat,
                        seed.lon,
                        data
                    );

                if (!track) {
                    continue;
                }

                const smooth =
                    smoothTrack(
                        globe,
                        track
                    );

                if (
                    !smooth ||
                    smooth.length <
                        2
                ) {
                    continue;
                }

                let speedSum =
                    0;

                for (
                    const point of track
                ) {
                    speedSum +=
                        point.speed;
                }

                const averageSpeed =
                    speedSum /
                    track.length;

                tracks.push({
                    points:
                        smooth,

                    speed:
                        averageSpeed,

                    phase:
                        (
                            i *
                            0.61803398875
                        ) %
                        1,
                });
            }

            if (
                !tracks.length
            ) {
                console.error(
                    "OCEAN-X: no tracks could be constructed"
                );

                return;
            }

            console.log(
                "OCEAN-X ESRI-STYLE CURRENT TRACKS",
                {
                    seedCount:
                        seeds.length,

                    trackCount:
                        tracks.length,

                    trackLength:
                        TRACK_LENGTH,
                }
            );

            // =================================================
            // FLATTEN TRACKS
            // =================================================

            let segmentCount =
                0;

            for (
                const track of tracks
            ) {
                segmentCount +=
                    track.points
                        .length -
                    1;
            }

            const positions =
                new Float32Array(
                    segmentCount *
                        2 *
                        3
                );

            const opacities =
                new Float32Array(
                    segmentCount *
                        2
                );

            let segmentIndex =
                0;

            for (
                const track of tracks
            ) {
                const points =
                    track.points;

                for (
                    let j = 0;
                    j <
                        points.length -
                            1;
                    j++
                ) {
                    const a =
                        points[j];

                    const b =
                        points[
                            j + 1
                        ];

                    const offset =
                        segmentIndex *
                        6;

                    positions[
                        offset
                    ] = a.x;

                    positions[
                        offset + 1
                    ] = a.y;

                    positions[
                        offset + 2
                    ] = a.z;

                    positions[
                        offset + 3
                    ] = b.x;

                    positions[
                        offset + 4
                    ] = b.y;

                    positions[
                        offset + 5
                    ] = b.z;

                    opacities[
                        segmentIndex *
                            2
                    ] = 0;

                    opacities[
                        segmentIndex *
                            2 +
                            1
                    ] = 0;

                    segmentIndex++;
                }
            }

            // =================================================
            // GEOMETRY
            // =================================================

            geometry =
                new THREE.BufferGeometry();

            geometry.setAttribute(
                "position",
                new THREE.BufferAttribute(
                    positions,
                    3
                )
            );

            opacityAttribute =
                new THREE.BufferAttribute(
                    opacities,
                    1
                );

            geometry.setAttribute(
                "aOpacity",
                opacityAttribute
            );

            // =================================================
            // SHARED LINE SHADER
            // =================================================

            const vertexShader = `
                attribute float aOpacity;

                varying float vOpacity;

                void main() {

                    vOpacity =
                        aOpacity;

                    gl_Position =
                        projectionMatrix *
                        modelViewMatrix *
                        vec4(
                            position,
                            1.0
                        );
                }
            `;

            const fragmentShader = `
                uniform vec3 uColor;
                uniform float uOpacityMultiplier;

                varying float vOpacity;

                void main() {

                    float alpha =
                        vOpacity *
                        uOpacityMultiplier;

                    if (
                        alpha <= 0.005
                    ) {
                        discard;
                    }

                    gl_FragColor =
                        vec4(
                            uColor,
                            alpha
                        );
                }
            `;

            // =================================================
            // GLOW PASS
            // =================================================

            glowMaterial =
                new THREE.ShaderMaterial({
                    transparent:
                        true,

                    depthWrite:
                        false,

                    depthTest:
                        true,

                    blending:
                        THREE.AdditiveBlending,

                    uniforms: {
                        uColor: {
                            value:
                                new THREE.Color(
                                    FLOW_COLOR
                                ),
                        },

                        uOpacityMultiplier: {
                            value:
                                0,
                        },
                    },

                    vertexShader,

                    fragmentShader,
                });

            // =================================================
            // CORE PASS
            // =================================================

            material =
                new THREE.ShaderMaterial({
                    transparent:
                        true,

                    depthWrite:
                        false,

                    depthTest:
                        true,

                    blending:
                        THREE.AdditiveBlending,

                    uniforms: {
                        uColor: {
                            value:
                                new THREE.Color(
                                    FLOW_COLOR
                                ),
                        },

                        uOpacityMultiplier: {
                            value:
                                0,
                        },
                    },

                    vertexShader,

                    fragmentShader,
                });

            // =================================================
            // LINE OBJECTS
            // =================================================

            const glowLines =
                new THREE.LineSegments(
                    geometry,
                    glowMaterial
                );

            const coreLines =
                new THREE.LineSegments(
                    geometry,
                    material
                );

            glowLines.renderOrder =
                149;

            coreLines.renderOrder =
                150;

            glowLines.frustumCulled =
                false;

            coreLines.frustumCulled =
                false;

            glowLines.raycast =
                () => {};

            coreLines.raycast =
                () => {};

            // =================================================
            // PARENT GROUP
            // =================================================

            lines =
                new THREE.Group();

            lines.add(
                glowLines
            );

            lines.add(
                coreLines
            );

            lines.renderOrder =
                150;

            scene.add(lines);

            // =================================================
            // TRACK METADATA
            // =================================================

            const trackMeta =
                [];

            let runningSegment =
                0;

            const maxSpeed =
                Math.max(
                    Number(
                        data.maxSpeed
                    ) || 1,

                    0.00001
                );

            for (
                const track of tracks
            ) {
                const segmentStart =
                    runningSegment;

                const segmentEnd =
                    runningSegment +
                    track.points
                        .length -
                    2;

                const normalizedSpeed =
                    clamp(
                        track.speed /
                            maxSpeed,
                        0,
                        1
                    );

                trackMeta.push({
                    start:
                        segmentStart,

                    end:
                        segmentEnd,

                    phase:
                        track.phase,

                    speed:
                        0.35 +
                        normalizedSpeed *
                            0.9,
                });

                runningSegment =
                    segmentEnd;
            }

            // =================================================
            // ANIMATE CURRENT WINDOWS
            // =================================================

            let animationIndex =
                0;

            function updateFlow() {
                if (
                    cancelled
                ) {
                    return;
                }

                const opacityArray =
                    opacityAttribute.array;

                opacityArray.fill(
                    0
                );

                for (
                    const meta of trackMeta
                ) {
                    const segmentCountForTrack =
                        meta.end -
                        meta.start;

                    if (
                        segmentCountForTrack <=
                        0
                    ) {
                        continue;
                    }

                    const localPosition =
                        (
                            meta.phase *
                                segmentCountForTrack +
                            animationIndex *
                                meta.speed
                        ) %
                        segmentCountForTrack;

                    const center =
                        Math.floor(
                            localPosition
                        );

                    for (
                        let k = 0;
                        k <
                            ACTIVE_SEGMENTS;
                        k++
                    ) {
                        let segment =
                            center -
                            k;

                        while (
                            segment <
                            0
                        ) {
                            segment +=
                                segmentCountForTrack;
                        }

                        segment %=
                            segmentCountForTrack;

                        const absolute =
                            meta.start +
                            segment;

                        const normalized =
                            1 -
                            k /
                                ACTIVE_SEGMENTS;

                        const fade =
                            normalized *
                            normalized *
                            (
                                3 -
                                2 *
                                    normalized
                            );

                        const opacity =
                            MAX_OPACITY *
                            fade;

                        opacityArray[
                            absolute *
                                2
                        ] = opacity;

                        opacityArray[
                            absolute *
                                2 +
                                1
                        ] = opacity;
                    }
                }

                opacityAttribute.needsUpdate =
                    true;

                animationIndex++;
            }

            updateFlow();

            animationTimer =
                setInterval(
                    updateFlow,
                    ANIMATION_INTERVAL
                );

            // =================================================
            // START SHARED TRANSITION LOOP
            // =================================================

            updateTransitionOpacity();

            console.log(
                "OCEAN-X: ESRI-STYLE GLOW FLOW MOUNTED"
            );
        }

        start();

        return () => {
            cancelled =
                true;

            cleanup();
        };
    }, [
        globeRef,
        data,
    ]);

    // ========================================================
    // Keep transition ref synchronized.
    //
    // This effect does NOT rebuild tracks.
    // It only ensures the renderer immediately responds
    // to GlobeView's latest transition state.
    // ========================================================

    useEffect(() => {
        transitionRef.current =
            layerTransition;
    }, [
        layerTransition,
    ]);

    return null;
}
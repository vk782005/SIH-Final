import { useEffect, useRef } from "react";
import * as Cesium from "cesium";

/*
|--------------------------------------------------------------------------
| OCEAN-X — CESIUM FLOWING CURRENT TRACKS
|--------------------------------------------------------------------------
|
| This replaces the particle-dot system with the same visual technique
| as the old Three.js version: fixed curved tracks traced once from the
| real vector field, each with a bright comet-like highlight animating
| along its length.
|
| The key difference from a naive port is WHERE the animation happens.
| The old Three.js version mutated a per-vertex opacity Float32Array on
| the CPU every ~25ms and re-uploaded it to the GPU. That works, but it
| doesn't scale well past a few hundred tracks.
|
| Cesium's polylines already expose a normalized arc-length coordinate
| (materialInput.st.s, 0 at the start of the line to 1 at the end) to
| any custom Material assigned to a polyline. That lets the "moving
| comet" be computed entirely in the fragment shader from a single time
| uniform - the CPU only has to update one float per material per frame,
| not thousands of vertex opacities. This is the same mechanism Cesium's
| own built-in dash/arrow polyline materials use internally.
|
| ------------------------------------------------------------------
| WHY EVERY TRACK USED TO RESET TOGETHER
| ------------------------------------------------------------------
| Two separate bugs were stacked here, and fixing only the first one
| still left something that reads as "a sudden restart":
|
| 1. PER-COMET WRAPAROUND (fixed previously): a track is an OPEN
|    curve, so a single comet's position along it must sweep
|    linearly (head - s, never wrapped with mod()) or the shader
|    treats the start and end of the track as adjacent and both
|    light up together at the reset instant.
|
| 2. GLOBAL SYNCHRONIZATION (the remaining issue): all ~1400 tracks
|    were sharing ONE material with the same uPhase. That means
|    literally every track's comet(s) were in perfect lockstep -
|    every `cycle / cometCount` seconds, a new "generation" of
|    comets was born on every single track AT THE SAME INSTANT.
|    Each comet itself was glitch-free, but the whole ocean
|    visibly pulsing in sync on a beat reads exactly like "a
|    sudden restart of a loop" - just at the scene level instead
|    of the single-track level.
|
| The fix below spreads tracks across a small POOL of materials
| (PHASE_POOL_SIZE), each with an evenly-staggered starting phase.
| A pool keeps the batching benefit that motivated using a shared
| material in the first place (a few dozen draw-call buckets
| instead of ~1400), while breaking the global sync - different
| tracks now pulse on different beats, so the ocean reads as many
| independent, continuously flowing currents instead of one
| system resetting all at once.
| ------------------------------------------------------------------
|
*/

const DEG_TO_RAD = Math.PI / 180;

/* ---------------------------------------------------------
 * CONFIG
 * --------------------------------------------------------- */

const CONFIG = {
    // Target number of tiles probed for seeds across the whole
    // lat/lon domain (see buildSeeds). Bumped up for more density;
    // actual track count will land somewhat below this since land
    // tiles are skipped - see SEED_TILE_YIELD_ESTIMATE.
    TRACK_COUNT: 1400,

    // Hard safety cap regardless of how much ocean coverage exists.
    MAX_TRACKS: 1800,

    // Rough fraction of probed tiles expected to land on valid ocean
    // data, used only to size the tile grid so the final seed count
    // lands close to TRACK_COUNT. Not critical to get exact.
    SEED_TILE_YIELD_ESTIMATE: 0.55,

    // Random probe points sampled per tile when looking for a valid
    // seed location inside it.
    SEED_PROBES_PER_TILE: 5,

    // ----------------------------------------------------------
    // GAP FILLING
    //
    // Real velocity rasters have holes: QC-flagged cells, satellite
    // swath gaps, ice cover, etc. Left alone, those patches have no
    // seeds and no tracks - visually "empty ocean". Before tracing
    // anything, small-to-medium holes are filled by interpolating
    // from valid neighboring ocean cells (weighted, closer neighbors
    // count more), the same technique used for the SSH terrain layer.
    // A cell only gets filled once it has enough valid neighbors,
    // which keeps this from bridging across real land.
    // ----------------------------------------------------------
    GAP_FILL_PASSES: 4,
    GAP_FILL_MIN_NEIGHBORS: 5,

    // Vector-field integration steps used to trace each track.
    TRACK_STEPS: 22,

    // Geographic step per integration step, in degrees.
    STEP_DEGREES: 0.5,

    // Discard any track shorter than this many points.
    MIN_TRACK_POINTS: 6,

    // How many Catmull-Rom samples per raw integration point, to turn
    // the jagged field-following polyline into a smooth curve.
    SMOOTH_SAMPLES_PER_POINT: 3,

    // Minimum vector magnitude required to keep tracing / seeding.
    SPEED_FLOOR: 0.00001,

    // Keep all current geometry at the same, near-zero surface altitude
    // so it stays visually glued to the ocean (true meters in Cesium,
    // unlike the old Three.js version's globe-radius-relative altitude).
    ALTITUDE: 2,

    // Comet appearance: fraction of the track length (0..1) the bright
    // trail extends behind the head before fading to nothing.
    CORE_COMET_LENGTH: 0.32,
    GLOW_COMET_LENGTH: 0.62,

    // Small idle fraction the head travels through fully off-track
    // (before s=0 and after s=1) each cycle, per comet.
    COMET_GAP: 0.1,

    // How many staggered comets travel each track simultaneously.
    CORE_COMET_COUNT: 3,
    GLOW_COMET_COUNT: 2,

    // How many distinct materials tracks are spread across. Each
    // pool slot gets an evenly-staggered starting phase, so tracks
    // assigned to different slots pulse on different beats instead
    // of every track resetting in lockstep. Higher = less global
    // synchrony but more draw-call buckets; 16-24 is a good balance
    // for a couple thousand tracks.
    PHASE_POOL_SIZE: 18,

    // Peak alpha for the two passes.
    CORE_MAX_ALPHA: 0.95,
    GLOW_MAX_ALPHA: 0.22,

    // Pixel widths.
    CORE_WIDTH: 1.4,
    GLOW_WIDTH: 3.4,

    // How fast a comet travels along a track (normalized-length
    // units per second, before per-track speed scaling).
    BASE_FLOW_RATE: 0.18,

    // Caps how often the flow animation actually updates uniforms and
    // requests a render, independent of display refresh rate. Running
    // this uncapped (i.e. on every requestAnimationFrame tick) pushes
    // far more render calls than needed - especially on 90Hz/120Hz+
    // displays - and with a lot of overlapping translucent track
    // geometry on screen, that extra GPU load is what was competing
    // with the camera controller and showing up as glitchy zoom.
    FRAME_INTERVAL_MS: 33,

    // White current lines, matching the old version.
    FLOW_COLOR: Cesium.Color.WHITE,
};

/* ---------------------------------------------------------
 * HELPERS
 * --------------------------------------------------------- */

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function normalizeLongitude(lon) {
    let value = lon;
    while (value > 180) value -= 360;
    while (value < -180) value += 360;
    return value;
}

function shuffleInPlace(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

/* ---------------------------------------------------------
 * GAP FILLING
 *
 * Produces a copy of the raster where small-to-medium data holes
 * are filled in by distance-weighted interpolation from valid
 * neighboring ocean cells (orthogonal neighbors weighted more than
 * diagonal). Cells that never accumulate enough valid neighbors -
 * i.e. real land, or the interior of a large gap - are left as NaN
 * and are correctly treated as "no data" everywhere downstream.
 * --------------------------------------------------------- */

function wrapColumn(column, width) {
    return ((column % width) + width) % width;
}

function buildFilledField(raster) {
    const { width, height, uValues, vValues } = raster;
    const totalCells = width * height;

    const filledU = new Float32Array(totalCells).fill(NaN);
    const filledV = new Float32Array(totalCells).fill(NaN);
    const valid = new Uint8Array(totalCells);

    let originalValidCount = 0;

    for (let i = 0; i < totalCells; i++) {
        const u = Number(uValues[i]);
        const v = Number(vValues[i]);

        if (Number.isFinite(u) && Number.isFinite(v)) {
            filledU[i] = u;
            filledV[i] = v;
            valid[i] = 1;
            originalValidCount++;
        }
    }

    for (let pass = 0; pass < CONFIG.GAP_FILL_PASSES; pass++) {
        const nextU = new Float32Array(filledU);
        const nextV = new Float32Array(filledV);
        const nextValid = new Uint8Array(valid);

        for (let row = 1; row < height - 1; row++) {
            for (let column = 0; column < width; column++) {
                const index = row * width + column;
                if (valid[index] === 1) continue;

                let sumU = 0;
                let sumV = 0;
                let weightTotal = 0;
                let neighborCount = 0;

                for (let dy = -1; dy <= 1; dy++) {
                    const neighborRow = row + dy;
                    if (neighborRow < 0 || neighborRow >= height) continue;

                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue;

                        const neighborColumn = wrapColumn(column + dx, width);
                        const neighborIndex = neighborRow * width + neighborColumn;

                        if (valid[neighborIndex] !== 1) continue;

                        const orthogonal = dx === 0 || dy === 0;
                        const weight = orthogonal ? 2 : 1;

                        sumU += filledU[neighborIndex] * weight;
                        sumV += filledV[neighborIndex] * weight;
                        weightTotal += weight;
                        neighborCount++;
                    }
                }

                if (neighborCount >= CONFIG.GAP_FILL_MIN_NEIGHBORS && weightTotal > 0) {
                    nextU[index] = sumU / weightTotal;
                    nextV[index] = sumV / weightTotal;
                    nextValid[index] = 1;
                }
            }
        }

        filledU.set(nextU);
        filledV.set(nextV);
        valid.set(nextValid);
    }

    let filledValidCount = 0;
    for (let i = 0; i < totalCells; i++) {
        if (valid[i] === 1) filledValidCount++;
    }

    return {
        raster: {
            ...raster,
            uValues: filledU,
            vValues: filledV,
        },
        stats: {
            originalValidCount,
            filledValidCount,
            recoveredCount: filledValidCount - originalValidCount,
        },
    };
}

/* ---------------------------------------------------------
 * VECTOR FIELD SAMPLER (bilinear, with nearest-corner fallback)
 * --------------------------------------------------------- */

function getVelocity(lat, lon, raster) {
    const { width, height, minLatitude, minLongitude, latStep, lonStep, uValues, vValues } =
        raster;

    const rawLat = (lat - minLatitude) / latStep;

    if (rawLat < 0 || rawLat > height - 1) {
        return null;
    }

    const wrappedLon = normalizeLongitude(lon);
    let rawLon = (wrappedLon - minLongitude) / lonStep;

    while (rawLon < 0) rawLon += width;
    while (rawLon >= width) rawLon -= width;

    const r0 = Math.floor(rawLat);
    const r1 = Math.min(r0 + 1, height - 1);
    const c0 = Math.floor(rawLon);
    const c1 = (c0 + 1) % width;

    const fy = rawLat - r0;
    const fx = rawLon - c0;

    const i00 = r0 * width + c0;
    const i10 = r0 * width + c1;
    const i01 = r1 * width + c0;
    const i11 = r1 * width + c1;

    const read = (array, index) => {
        const value = Number(array[index]);
        return Number.isFinite(value) ? value : null;
    };

    const u00 = read(uValues, i00);
    const u10 = read(uValues, i10);
    const u01 = read(uValues, i01);
    const u11 = read(uValues, i11);

    const v00 = read(vValues, i00);
    const v10 = read(vValues, i10);
    const v01 = read(vValues, i01);
    const v11 = read(vValues, i11);

    if (u00 !== null && u10 !== null && u01 !== null && u11 !== null &&
        v00 !== null && v10 !== null && v01 !== null && v11 !== null) {
        const uTop = u00 + (u10 - u00) * fx;
        const uBottom = u01 + (u11 - u01) * fx;
        const vTop = v00 + (v10 - v00) * fx;
        const vBottom = v01 + (v11 - v01) * fx;

        const u = uTop + (uBottom - uTop) * fy;
        const v = vTop + (vBottom - vTop) * fy;
        const speed = Math.hypot(u, v);

        if (!Number.isFinite(speed)) return null;
        return { u, v, speed };
    }

    // Fallback to the nearest valid corner if the cell straddles the coast.
    const candidates = [
        { u: u00, v: v00, dx: fx, dy: fy },
        { u: u10, v: v10, dx: 1 - fx, dy: fy },
        { u: u01, v: v01, dx: fx, dy: 1 - fy },
        { u: u11, v: v11, dx: 1 - fx, dy: 1 - fy },
    ];

    let best = null;
    let bestDistance = Infinity;

    for (const candidate of candidates) {
        if (candidate.u === null || candidate.v === null) continue;

        const distance = candidate.dx * candidate.dx + candidate.dy * candidate.dy;
        if (distance < bestDistance) {
            bestDistance = distance;
            best = candidate;
        }
    }

    if (!best) return null;

    const speed = Math.hypot(best.u, best.v);
    if (!Number.isFinite(speed)) return null;

    return { u: best.u, v: best.v, speed };
}

/* ---------------------------------------------------------
 * TRACK TRACING (follow the actual vector field)
 * --------------------------------------------------------- */

function buildTrack(startLat, startLon, raster) {
    const track = [];

    let lat = startLat;
    let lon = startLon;

    for (let step = 0; step < CONFIG.TRACK_STEPS; step++) {
        const velocity = getVelocity(lat, lon, raster);

        if (!velocity || velocity.speed < CONFIG.SPEED_FLOOR) {
            break;
        }

        track.push({ lat, lon, speed: velocity.speed });

        const east = velocity.u / velocity.speed;
        const north = velocity.v / velocity.speed;

        const cosLat = Math.max(Math.cos(lat * DEG_TO_RAD), 0.2);

        lat += north * CONFIG.STEP_DEGREES;
        lon = normalizeLongitude(lon + (east * CONFIG.STEP_DEGREES) / cosLat);

        if (lat <= -85 || lat >= 85) break;
    }

    if (track.length < CONFIG.MIN_TRACK_POINTS) {
        return null;
    }

    return track;
}

/* ---------------------------------------------------------
 * SMOOTH A TRACK INTO CESIUM CARTESIAN3 POSITIONS
 * --------------------------------------------------------- */

function buildSmoothPositions(track) {
    const rawPositions = track.map((point) =>
        Cesium.Cartesian3.fromDegrees(point.lon, point.lat, CONFIG.ALTITUDE)
    );

    if (rawPositions.length < 3) {
        return rawPositions;
    }

    const times = rawPositions.map((_, index) => index / (rawPositions.length - 1));

    let spline;
    try {
        spline = new Cesium.CatmullRomSpline({
            times,
            points: rawPositions,
        });
    } catch {
        // Degenerate input (e.g. collinear/duplicate points) - fall back
        // to the raw traced positions rather than dropping the track.
        return rawPositions;
    }

    const sampleCount = Math.max(
        rawPositions.length * CONFIG.SMOOTH_SAMPLES_PER_POINT,
        12
    );

    const smoothed = [];
    for (let i = 0; i <= sampleCount; i++) {
        smoothed.push(spline.evaluate(i / sampleCount));
    }

    return smoothed;
}

/* ---------------------------------------------------------
 * SEED SELECTION
 *
 * Instead of stepping through a raster-scan-ordered candidate list
 * (which can bunch up unevenly depending on where valid data is
 * denser), the domain is divided into a roughly uniform grid of
 * tiles, and one valid ocean point is probed for inside each tile.
 * Tiles that land entirely on land (or unfillable gaps) are simply
 * skipped, which is what naturally keeps tracks off land without
 * needing a separate mask.
 *
 * The result is always shuffled before returning: tile order is
 * raster-scan order (row by row), so leaving it unshuffled would
 * mean consecutive tracks are spatially adjacent - and since track
 * build order determines which phase-pool slot a track lands in
 * (see the component below), that would print visible spatial
 * "bands" of synchronized tracks instead of an even scatter.
 * --------------------------------------------------------- */

function buildSeeds(filledRaster) {
    const { width, height, minLatitude, minLongitude, latStep, lonStep } = filledRaster;

    const domainWidthDeg = width * lonStep;
    const domainHeightDeg = (height - 1) * latStep;

    const requestedTiles = CONFIG.TRACK_COUNT / CONFIG.SEED_TILE_YIELD_ESTIMATE;

    const tileDeg = Math.max(
        1,
        Math.sqrt((domainWidthDeg * domainHeightDeg) / requestedTiles)
    );

    const tilesX = Math.max(1, Math.round(domainWidthDeg / tileDeg));
    const tilesY = Math.max(1, Math.round(domainHeightDeg / tileDeg));

    const seeds = [];

    for (let ty = 0; ty < tilesY; ty++) {
        const latStart = minLatitude + (ty / tilesY) * domainHeightDeg;
        const latEnd = minLatitude + ((ty + 1) / tilesY) * domainHeightDeg;

        if (latEnd <= -78 || latStart >= 80) continue;

        for (let tx = 0; tx < tilesX; tx++) {
            const lonStart = minLongitude + (tx / tilesX) * domainWidthDeg;
            const lonEnd = minLongitude + ((tx + 1) / tilesX) * domainWidthDeg;

            const tileCandidates = [];

            for (let probe = 0; probe < CONFIG.SEED_PROBES_PER_TILE; probe++) {
                const lat = latStart + Math.random() * (latEnd - latStart);
                const lon = lonStart + Math.random() * (lonEnd - lonStart);

                const velocity = getVelocity(lat, lon, filledRaster);
                if (velocity && velocity.speed >= CONFIG.SPEED_FLOOR) {
                    tileCandidates.push({ lat, lon });
                }
            }

            if (tileCandidates.length) {
                seeds.push(tileCandidates[Math.floor(Math.random() * tileCandidates.length)]);
            }
        }
    }

    shuffleInPlace(seeds);

    // Safety cap in case actual ocean coverage exceeds the estimate
    // used to size the tile grid.
    if (seeds.length > CONFIG.MAX_TRACKS) {
        return seeds.slice(0, CONFIG.MAX_TRACKS);
    }

    return seeds;
}

/* ---------------------------------------------------------
 * CUSTOM CESIUM MATERIAL: several staggered comet-style moving
 * highlights along a polyline's normalized arc length
 * (materialInput.st.s).
 *
 * `cometCount` is baked into the GLSL source as a literal
 * `const int`, not passed as a uniform — WebGL1/GLSL ES 1.0
 * fragment shaders require for-loop bounds to be compile-time
 * constants, so a uniform-driven loop count can fail to compile
 * (or silently fail to unroll) on some drivers.
 * --------------------------------------------------------- */

function createFlowMaterial({ cometLength, gap, cometCount, maxAlpha, phase, speed, color }) {
    return new Cesium.Material({
        fabric: {
            type: `OceanCurrentFlow_${cometCount}`,
            uniforms: {
                uColor: color,
                uPhase: phase,
                uSpeed: speed,
                uCometLength: cometLength,
                uGap: gap,
                uMaxAlpha: maxAlpha,
                uTime: 0,
                uLayerOpacity: 1,
            },
            source: `
                const int uCometCount = ${cometCount};

                czm_material czm_getMaterial(czm_materialInput materialInput)
                {
                    czm_material material = czm_getDefaultMaterial(materialInput);

                    float s = materialInput.st.s;

                    // One cycle = the comet's off-track approach
                    // (uCometLength before s=0) + the on-track sweep
                    // (s=0 to s=1) + an idle gap past the end (uGap).
                    // Using this as the modulus keeps every reset
                    // instant for a given comet fully off-track, so
                    // no single comet ever "teleports" mid-track.
                    float cycle = 1.0 + uCometLength + uGap;

                    float comet = 0.0;

                    // Several staggered copies of the same sweep,
                    // offset evenly across the cycle, so a new comet
                    // is already underway well before the previous
                    // one finishes on THIS track. Cross-track sync is
                    // handled separately via uPhase (see the pool of
                    // materials in the component below).
                    for (int i = 0; i < uCometCount; i++) {
                        float offset = float(i) / float(uCometCount);
                        float t = mod(uPhase + offset + uTime * uSpeed, 1.0) * cycle;
                        float head = t - uCometLength;

                        // Plain linear distance, never wrapped — a
                        // point only lights up when this particular
                        // comet's head has genuinely swept past it.
                        float dist = head - s;

                        if (dist >= 0.0 && dist <= uCometLength) {
                            float c = 1.0 - smoothstep(0.0, uCometLength, dist);
                            c = pow(clamp(c, 0.0, 1.0), 1.1);
                            comet = max(comet, c);
                        }
                    }

                    material.diffuse = uColor.rgb;
                    material.alpha = comet * uMaxAlpha * uLayerOpacity;

                    return material;
                }
            `,
        },
        translucent: true,
    });
}

/* ---------------------------------------------------------
 * COMPONENT
 * --------------------------------------------------------- */

export default function CurrentFlowLayer({ viewer, raster, visible = false, opacity = 1 }) {
    const configRef = useRef({ visible, opacity });

    // Written after every commit rather than during render, so the
    // animation loop always reads the latest visible/opacity without this
    // component needing to rebuild anything when they change.
    useEffect(() => {
        configRef.current = { visible, opacity };
    });

    const stateRef = useRef({
        animationFrame: null,
        glowCollection: null,
        coreCollection: null,
        glowMaterials: [],
        coreMaterials: [],
        ready: false,
        startTime: 0,
    });

    // ========================================================
    // BUILD TRACKS - only when the viewer or the underlying
    // data actually changes, NOT on every visible/opacity
    // toggle. Visibility and opacity are handled cheaply below
    // via a separate effect that never rebuilds geometry.
    // ========================================================

    useEffect(() => {
        if (!viewer || !raster) {
            return undefined;
        }

        const state = stateRef.current;

        const cleanup = () => {
            if (state.animationFrame !== null) {
                cancelAnimationFrame(state.animationFrame);
                state.animationFrame = null;
            }

            if (state.glowCollection) {
                try {
                    viewer.scene.primitives.remove(state.glowCollection);
                } catch {
                    // already removed
                }
                state.glowCollection = null;
            }

            if (state.coreCollection) {
                try {
                    viewer.scene.primitives.remove(state.coreCollection);
                } catch {
                    // already removed
                }
                state.coreCollection = null;
            }

            state.glowMaterials = [];
            state.coreMaterials = [];
            state.ready = false;
        };

        cleanup();

        const { raster: filledRaster, stats: fillStats } = buildFilledField(raster);

        const seeds = buildSeeds(filledRaster);

        if (!seeds.length) {
            console.error("OCEAN-X: no valid current seeds");
            return cleanup;
        }

        state.glowCollection = viewer.scene.primitives.add(new Cesium.PolylineCollection());
        state.coreCollection = viewer.scene.primitives.add(new Cesium.PolylineCollection());

        state.glowCollection.show = configRef.current.visible;
        state.coreCollection.show = configRef.current.visible;

        // ----------------------------------------------------------
        // A POOL of materials per pass, not one shared material and
        // not one-per-track. Each pool slot gets an evenly-staggered
        // starting phase (i / PHASE_POOL_SIZE), so tracks assigned to
        // different slots pulse on different beats - this is what
        // breaks the whole-ocean synchronized reset. Cesium can still
        // batch every track that shares a given pool slot together,
        // so this stays cheap (PHASE_POOL_SIZE draw-call buckets per
        // pass, not one per track).
        // ----------------------------------------------------------

        const clampedOpacity = clamp(Number(opacity), 0, 1);
        const poolSize = CONFIG.PHASE_POOL_SIZE;

        state.glowMaterials = [];
        state.coreMaterials = [];

        for (let p = 0; p < poolSize; p++) {
            const phase = p / poolSize;

            state.glowMaterials.push(
                createFlowMaterial({
                    cometLength: CONFIG.GLOW_COMET_LENGTH,
                    gap: CONFIG.COMET_GAP,
                    cometCount: CONFIG.GLOW_COMET_COUNT,
                    maxAlpha: CONFIG.GLOW_MAX_ALPHA * clampedOpacity,
                    phase,
                    speed: CONFIG.BASE_FLOW_RATE,
                    color: CONFIG.FLOW_COLOR,
                })
            );

            state.coreMaterials.push(
                createFlowMaterial({
                    cometLength: CONFIG.CORE_COMET_LENGTH,
                    gap: CONFIG.COMET_GAP,
                    cometCount: CONFIG.CORE_COMET_COUNT,
                    maxAlpha: CONFIG.CORE_MAX_ALPHA * clampedOpacity,
                    phase,
                    speed: CONFIG.BASE_FLOW_RATE,
                    color: CONFIG.FLOW_COLOR,
                })
            );
        }

        let builtCount = 0;

        for (let i = 0; i < seeds.length; i++) {
            const seed = seeds[i];

            const track = buildTrack(seed.lat, seed.lon, filledRaster);
            if (!track) continue;

            const positions = buildSmoothPositions(track);
            if (!positions || positions.length < 2) continue;

            // Same pool slot for both passes of a given track, so its
            // glow and core stay visually in sync with each other -
            // only cross-track sync is what we're breaking.
            const poolIndex = builtCount % poolSize;

            state.glowCollection.add({
                positions,
                width: CONFIG.GLOW_WIDTH,
                material: state.glowMaterials[poolIndex],
            });

            state.coreCollection.add({
                positions,
                width: CONFIG.CORE_WIDTH,
                material: state.coreMaterials[poolIndex],
            });

            builtCount++;
        }

        if (!builtCount) {
            console.error("OCEAN-X: no tracks could be constructed");
            return cleanup;
        }

        console.log("OCEAN-X: Cesium flow tracks mounted", {
            gapFill: fillStats,
            seedsProbed: seeds.length,
            tracksBuilt: builtCount,
            phasePoolSize: poolSize,
        });

        state.ready = true;
        state.startTime = performance.now();

        let lastUpdateTime = 0;

        const animate = (now) => {
            if (!state.ready) return;

            if (now - lastUpdateTime >= CONFIG.FRAME_INTERVAL_MS) {
                lastUpdateTime = now;

                const elapsedSeconds = (now - state.startTime) / 1000;

                for (let p = 0; p < state.glowMaterials.length; p++) {
                    state.glowMaterials[p].uniforms.uTime = elapsedSeconds;
                }

                for (let p = 0; p < state.coreMaterials.length; p++) {
                    state.coreMaterials[p].uniforms.uTime = elapsedSeconds;
                }

                viewer.scene.requestRender();
            }

            state.animationFrame = requestAnimationFrame(animate);
        };

        state.animationFrame = requestAnimationFrame(animate);

        return cleanup;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewer, raster]);

    // ========================================================
    // VISIBILITY - cheap collection-level toggle, no rebuild.
    // ========================================================

    useEffect(() => {
        const state = stateRef.current;

        if (state.glowCollection) state.glowCollection.show = visible;
        if (state.coreCollection) state.coreCollection.show = visible;

        if (viewer) viewer.scene.requestRender();
    }, [visible, viewer]);

    // ========================================================
    // OPACITY - cheap per-material uniform update, no rebuild.
    // ========================================================

    useEffect(() => {
        const state = stateRef.current;
        const clamped = clamp(Number(opacity), 0, 1);

        for (let p = 0; p < state.glowMaterials.length; p++) {
            state.glowMaterials[p].uniforms.uLayerOpacity = clamped;
        }

        for (let p = 0; p < state.coreMaterials.length; p++) {
            state.coreMaterials[p].uniforms.uLayerOpacity = clamped;
        }

        if (viewer) viewer.scene.requestRender();
    }, [opacity, viewer]);

    return null;
}
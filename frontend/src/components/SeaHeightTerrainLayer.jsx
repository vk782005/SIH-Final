import { useEffect, useRef } from "react";
import * as Cesium from "cesium";

/*
 * OCEAN-X
 * ============================================================
 * Sea Surface Height 3D Terrain Layer
 *
 * Rendering pipeline:
 *
 *   SSH raster
 *      ↓
 *   gap filling
 *      ↓
 *   smoothing
 *      ↓
 *   mask-aware upsampling
 *      ↓
 *   coastline smoothing
 *      ↓
 *   SSH anomaly
 *      ↓
 *   exaggerated vertical displacement
 *      ↓
 *   Cesium Geometry
 *      ↓
 *   RGBA GPU texture
 *      ↓
 *   Cesium MaterialAppearance
 *
 * IMPORTANT:
 *
 * We DO NOT use:
 *
 *   materialInput.diffuse
 *   materialInput.alpha
 *   custom vertex color attributes
 *   GeometryPipeline.computeNormal()
 *
 * Instead:
 *
 *   ST.s / ST.t → texture coordinates
 *   texture2D() → SSH color + alpha
 *   material.diffuse / material.alpha → output
 *
 * This keeps the shader compatible with Cesium's
 * MaterialAppearance pipeline.
 */

// ============================================================
// CONFIGURATION
// ============================================================

const UPSAMPLE_FACTOR = 2;

const SMOOTHING_PASSES = 2;
const GAP_FILL_PASSES = 2;
const COAST_SMOOTHING_PASSES = 2;
const FINE_SMOOTHING_PASSES = 1;
const COVERAGE_SMOOTHING_PASSES = 2;

const COVERAGE_THRESHOLD = 0.3;
const FEATHER_UPPER = 0.9;

// < 1 exaggerates smaller SSH differences.
const RELIEF_POWER = 0.72;

// IMPORTANT:
// This is visual exaggeration.
// It is NOT the physical SSH height.
const MAX_RELIEF_HEIGHT = 50000;

// Keep the mesh slightly above the ellipsoid.
const BASE_HEIGHT = 100;

const MAX_ALPHA = 0.96;

const MATERIAL_TYPE = "OCEAN_X_SSH_TERRAIN";

// ============================================================
// SSH COLOR PALETTE
// ============================================================

const SSH_STOPS = [
    { t: 0.0, color: [0.035, 0.1, 0.38] },
    { t: 0.14, color: [0.02, 0.28, 0.72] },
    { t: 0.28, color: [0.0, 0.62, 0.92] },
    { t: 0.42, color: [0.0, 0.88, 0.88] },
    { t: 0.56, color: [0.1, 0.95, 0.66] },
    { t: 0.68, color: [0.52, 0.92, 0.32] },
    { t: 0.8, color: [0.94, 0.82, 0.16] },
    { t: 0.9, color: [1.0, 0.48, 0.08] },
    { t: 1.0, color: [0.9, 0.1, 0.045] },
];

const SHORE_COLOR = [0.78, 0.94, 0.96];

// ============================================================
// MATH
// ============================================================

function clamp(value, min = 0, max = 1) {
    return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function smoothstep(edge0, edge1, value) {
    const range = Math.max(edge1 - edge0, 1e-6);

    const t = clamp((value - edge0) / range);

    return t * t * (3 - 2 * t);
}

// ============================================================
// LONGITUDE WRAP
// ============================================================

function wrapColumn(column, width) {
    if (column < 0) {
        return width - 1;
    }

    if (column >= width) {
        return 0;
    }

    return column;
}

// ============================================================
// COLOR INTERPOLATION
// ============================================================

function getSSHColor(t) {
    t = clamp(t);

    if (t <= SSH_STOPS[0].t) {
        return SSH_STOPS[0].color.slice();
    }

    for (let i = 0; i < SSH_STOPS.length - 1; i++) {
        const a = SSH_STOPS[i];

        const b = SSH_STOPS[i + 1];

        if (t >= a.t && t <= b.t) {
            const localT = (t - a.t) / Math.max(b.t - a.t, 1e-6);

            return [
                lerp(a.color[0], b.color[0], localT),
                lerp(a.color[1], b.color[1], localT),
                lerp(a.color[2], b.color[2], localT),
            ];
        }
    }

    return SSH_STOPS[SSH_STOPS.length - 1].color.slice();
}

// ============================================================
// WEIGHTED BLUR
// ============================================================

function weightedBlurPass(source, width, height, valid = null) {
    const next = new Float32Array(source);

    for (let row = 0; row < height; row++) {
        for (let column = 0; column < width; column++) {
            const index = row * width + column;

            if (valid && valid[index] !== 1) {
                continue;
            }

            let weightedSum = 0;
            let weightTotal = 0;

            for (let dy = -1; dy <= 1; dy++) {
                const neighborRow = row + dy;

                if (neighborRow < 0 || neighborRow >= height) {
                    continue;
                }

                for (let dx = -1; dx <= 1; dx++) {
                    const neighborColumn = wrapColumn(column + dx, width);

                    const neighborIndex = neighborRow * width + neighborColumn;

                    if (valid && valid[neighborIndex] !== 1) {
                        continue;
                    }

                    const distance = Math.abs(dx) + Math.abs(dy);

                    let weight = 1;

                    if (distance === 1) {
                        weight = 2;
                    }

                    if (dx === 0 && dy === 0) {
                        weight = 4;
                    }

                    const value = Number(source[neighborIndex]);

                    if (!Number.isFinite(value)) {
                        continue;
                    }

                    weightedSum += value * weight;

                    weightTotal += weight;
                }
            }

            if (weightTotal > 0) {
                next[index] = weightedSum / weightTotal;
            }
        }
    }

    return next;
}

function blurGrid(source, width, height, passes, valid = null) {
    let current = source;

    for (let pass = 0; pass < passes; pass++) {
        current = weightedBlurPass(current, width, height, valid);
    }

    return current;
}

// ============================================================
// GAP FILL
// ============================================================

function gapFillField(field, valid, width, height, passes) {
    let currentField = field;

    let currentValid = valid;

    for (let pass = 0; pass < passes; pass++) {
        const nextField = new Float32Array(currentField);

        const nextValid = new Uint8Array(currentValid);

        for (let row = 1; row < height - 1; row++) {
            for (let column = 0; column < width; column++) {
                const index = row * width + column;

                if (currentValid[index] === 1) {
                    continue;
                }

                let weightedSum = 0;
                let weightTotal = 0;
                let neighbors = 0;

                for (let dy = -1; dy <= 1; dy++) {
                    const neighborRow = row + dy;

                    if (neighborRow < 0 || neighborRow >= height) {
                        continue;
                    }

                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) {
                            continue;
                        }

                        const neighborColumn = wrapColumn(column + dx, width);

                        const neighborIndex =
                            neighborRow * width + neighborColumn;

                        if (currentValid[neighborIndex] !== 1) {
                            continue;
                        }

                        const value = Number(currentField[neighborIndex]);

                        if (!Number.isFinite(value)) {
                            continue;
                        }

                        const weight = dx === 0 || dy === 0 ? 2 : 1;

                        weightedSum += value * weight;

                        weightTotal += weight;

                        neighbors++;
                    }
                }

                if (neighbors >= 5 && weightTotal > 0) {
                    nextField[index] = weightedSum / weightTotal;

                    nextValid[index] = 1;
                }
            }
        }

        currentField = nextField;

        currentValid = nextValid;
    }

    return {
        field: currentField,
        valid: currentValid,
    };
}

// ============================================================
// COASTAL SMOOTHING
// ============================================================

function coastalSmoothField(field, valid, width, height, passes) {
    let current = field;

    for (let pass = 0; pass < passes; pass++) {
        const next = new Float32Array(current);

        for (let row = 1; row < height - 1; row++) {
            for (let column = 0; column < width; column++) {
                const index = row * width + column;

                if (valid[index] !== 1) {
                    continue;
                }

                let hasInvalidNeighbor = false;

                let sum = 0;
                let count = 0;

                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) {
                            continue;
                        }

                        const neighborRow = row + dy;

                        if (neighborRow < 0 || neighborRow >= height) {
                            continue;
                        }

                        const neighborColumn = wrapColumn(column + dx, width);

                        const neighborIndex =
                            neighborRow * width + neighborColumn;

                        if (valid[neighborIndex] !== 1) {
                            hasInvalidNeighbor = true;

                            continue;
                        }

                        const value = Number(current[neighborIndex]);

                        if (!Number.isFinite(value)) {
                            continue;
                        }

                        sum += value;
                        count++;
                    }
                }

                if (hasInvalidNeighbor && count >= 3) {
                    const average = sum / count;

                    next[index] = current[index] * 0.7 + average * 0.3;
                }
            }
        }

        current = next;
    }

    return current;
}

// ============================================================
// UPSAMPLING
// ============================================================

function upsampleField(field, valid, width, height, latStep, lonStep, factor) {
    const fineWidth = width * factor;

    const fineHeight = (height - 1) * factor + 1;

    const fineTotal = fineWidth * fineHeight;

    const fineField = new Float32Array(fineTotal);

    const fineCoverage = new Float32Array(fineTotal);

    for (let fineRow = 0; fineRow < fineHeight; fineRow++) {
        const sourceRow = fineRow / factor;

        const row0 = Math.floor(sourceRow);

        const row1 = Math.min(row0 + 1, height - 1);

        const rowT = sourceRow - row0;

        for (let fineColumn = 0; fineColumn < fineWidth; fineColumn++) {
            const sourceColumn = fineColumn / factor;

            const floorColumn = Math.floor(sourceColumn);

            const column0 = ((floorColumn % width) + width) % width;

            const column1 = (column0 + 1) % width;

            const columnT = sourceColumn - floorColumn;

            const w00 = (1 - rowT) * (1 - columnT);

            const w01 = (1 - rowT) * columnT;

            const w10 = rowT * (1 - columnT);

            const w11 = rowT * columnT;

            const i00 = row0 * width + column0;

            const i01 = row0 * width + column1;

            const i10 = row1 * width + column0;

            const i11 = row1 * width + column1;

            const c00 = valid[i00];

            const c01 = valid[i01];

            const c10 = valid[i10];

            const c11 = valid[i11];

            const coverage = w00 * c00 + w01 * c01 + w10 * c10 + w11 * c11;

            const fineIndex = fineRow * fineWidth + fineColumn;

            fineCoverage[fineIndex] = coverage;

            if (coverage > 0) {
                const weightedValue =
                    w00 * c00 * field[i00] +
                    w01 * c01 * field[i01] +
                    w10 * c10 * field[i10] +
                    w11 * c11 * field[i11];

                fineField[fineIndex] = weightedValue / coverage;
            }
        }
    }

    return {
        fineField,
        fineCoverage,
        fineWidth,
        fineHeight,
        fineLatStep: latStep / factor,
        fineLonStep: lonStep / factor,
    };
}

// ============================================================
// VALID MASK
// ============================================================

function computeValidMask(coverage, threshold) {
    const valid = new Uint8Array(coverage.length);

    for (let i = 0; i < coverage.length; i++) {
        valid[i] = coverage[i] >= threshold ? 1 : 0;
    }

    return valid;
}

// ============================================================
// SSH STATISTICS
// ============================================================

function computeSSHStatistics(field, valid) {
    let minSSH = Infinity;
    let maxSSH = -Infinity;

    let sum = 0;
    let count = 0;

    for (let i = 0; i < field.length; i++) {
        if (valid[i] !== 1) {
            continue;
        }

        const value = Number(field[i]);

        if (!Number.isFinite(value)) {
            continue;
        }

        minSSH = Math.min(minSSH, value);

        maxSSH = Math.max(maxSSH, value);

        sum += value;
        count++;
    }

    if (count === 0 || !Number.isFinite(minSSH) || !Number.isFinite(maxSSH)) {
        return null;
    }

    const meanSSH = sum / count;

    const sshRange = Math.max(maxSSH - minSSH, 1e-6);

    const maxAbsAnomaly = Math.max(
        Math.abs(minSSH - meanSSH),
        Math.abs(maxSSH - meanSSH),
        1e-6,
    );

    return {
        minSSH,
        maxSSH,
        meanSSH,
        sshRange,
        maxAbsAnomaly,
        count,
    };
}

// ============================================================
// BUILD VERTEX DATA
// ============================================================

function buildVertexBuffers({
    fineField,
    fineValid,
    fineCoverage,
    fineWidth,
    fineHeight,
    fineLatStep,
    fineLonStep,
    minLatitude,
    minLongitude,
    stats,
}) {
    const fineTotal = fineWidth * fineHeight;

    const positions = new Float64Array(fineTotal * 3);

    const normals = new Float32Array(fineTotal * 3);

    const st = new Float32Array(fineTotal * 2);

    const textureData = new Uint8Array(fineTotal * 4);

    let oceanVertexCount = 0;

    const { minSSH, meanSSH, sshRange, maxAbsAnomaly } = stats;

    const scratchNormal = new Cesium.Cartesian3();

    for (let row = 0; row < fineHeight; row++) {
        const latitude = minLatitude + row * fineLatStep;

        if (latitude < -90 || latitude > 90) {
            continue;
        }

        // Pixel-center UV.
        const v = (row + 0.5) / fineHeight;

        for (let column = 0; column < fineWidth; column++) {
            const index = row * fineWidth + column;

            const longitude = minLongitude + column * fineLonStep;

            let heightOffset = 0;

            let colorR = 0;
            let colorG = 0;
            let colorB = 0;
            let colorA = 0;

            if (fineValid[index] === 1) {
                const coverage = clamp(fineCoverage[index]);

                const coastStrength = smoothstep(
                    COVERAGE_THRESHOLD,
                    FEATHER_UPPER,
                    coverage,
                );

                // ------------------------------------------------
                // SSH anomaly
                // ------------------------------------------------

                const anomaly = fineField[index] - meanSSH;

                const normalized = clamp(anomaly / maxAbsAnomaly, -1, 1);

                const sign = normalized < 0 ? -1 : 1;

                const magnitude = Math.pow(Math.abs(normalized), RELIEF_POWER);

                heightOffset = clamp(
                    sign * magnitude * MAX_RELIEF_HEIGHT * coastStrength,
                    -MAX_RELIEF_HEIGHT,
                    MAX_RELIEF_HEIGHT,
                );

                // ------------------------------------------------
                // SSH color
                // ------------------------------------------------

                const colorT = clamp((fineField[index] - minSSH) / sshRange);

                let color = getSSHColor(colorT);

                if (coverage < FEATHER_UPPER) {
                    const shoreBlend = (1 - coastStrength) * 0.25;

                    color = [
                        lerp(color[0], SHORE_COLOR[0], shoreBlend),
                        lerp(color[1], SHORE_COLOR[1], shoreBlend),
                        lerp(color[2], SHORE_COLOR[2], shoreBlend),
                    ];
                }

                colorR = color[0];

                colorG = color[1];

                colorB = color[2];

                colorA = MAX_ALPHA;

                oceanVertexCount++;
            }

            // ------------------------------------------------
            // Position
            // ------------------------------------------------

            const cartesian = Cesium.Cartesian3.fromDegrees(
                longitude,
                latitude,
                BASE_HEIGHT + heightOffset,
            );

            const p = index * 3;

            positions[p] = cartesian.x;

            positions[p + 1] = cartesian.y;

            positions[p + 2] = cartesian.z;

            // ------------------------------------------------
            // Stable WGS84 normal
            // ------------------------------------------------

            Cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(
                cartesian,
                scratchNormal,
            );

            normals[p] = scratchNormal.x;

            normals[p + 1] = scratchNormal.y;

            normals[p + 2] = scratchNormal.z;

            // ------------------------------------------------
            // Texture coordinates
            // ------------------------------------------------

            const s = index * 2;

            st[s] = (column + 0.5) / fineWidth;

            st[s + 1] = v;

            // ------------------------------------------------
            // RGBA texture
            // ------------------------------------------------

            const t = index * 4;

            textureData[t] = Math.round(clamp(colorR) * 255);

            textureData[t + 1] = Math.round(clamp(colorG) * 255);

            textureData[t + 2] = Math.round(clamp(colorB) * 255);

            textureData[t + 3] = Math.round(clamp(colorA) * 255);
        }
    }

    return {
        positions,
        normals,
        st,
        textureData,
        oceanVertexCount,
    };
}

// ============================================================
// TRIANGLE INDEX BUFFER
// ============================================================

function buildTriangleIndices(fineValid, fineWidth, fineHeight) {
    const indices = [];

    let triangleCount = 0;

    for (let row = 0; row < fineHeight - 1; row++) {
        for (let column = 0; column < fineWidth - 1; column++) {
            const topLeft = row * fineWidth + column;

            const topRight = topLeft + 1;

            const bottomLeft = (row + 1) * fineWidth + column;

            const bottomRight = bottomLeft + 1;

            // Do NOT wrap the antimeridian.
            //
            // Otherwise Cesium would create enormous
            // triangles crossing from +180 → -180.

            if (
                fineValid[topLeft] !== 1 ||
                fineValid[topRight] !== 1 ||
                fineValid[bottomLeft] !== 1 ||
                fineValid[bottomRight] !== 1
            ) {
                continue;
            }

            indices.push(
                topLeft,
                topRight,
                bottomLeft,

                topRight,
                bottomRight,
                bottomLeft,
            );

            triangleCount += 2;
        }
    }

    return {
        indices: new Uint32Array(indices),

        triangleCount,
    };
}

// ============================================================
// CESIUM GEOMETRY
// ============================================================

function createSSHGeometry(positions, normals, st, indices) {
    const boundingSphere = Cesium.BoundingSphere.fromVertices(positions);

    if (
        !boundingSphere ||
        !Number.isFinite(boundingSphere.center.x) ||
        !Number.isFinite(boundingSphere.center.y) ||
        !Number.isFinite(boundingSphere.center.z) ||
        !Number.isFinite(boundingSphere.radius)
    ) {
        throw new Error("OCEAN-X: Invalid terrain bounding sphere.");
    }

    return new Cesium.Geometry({
        attributes: {
            position: new Cesium.GeometryAttribute({
                componentDatatype: Cesium.ComponentDatatype.DOUBLE,

                componentsPerAttribute: 3,

                values: positions,
            }),

            normal: new Cesium.GeometryAttribute({
                componentDatatype: Cesium.ComponentDatatype.FLOAT,

                componentsPerAttribute: 3,

                values: normals,
            }),

            st: new Cesium.GeometryAttribute({
                componentDatatype: Cesium.ComponentDatatype.FLOAT,

                componentsPerAttribute: 2,

                values: st,
            }),
        },

        indices,

        primitiveType: Cesium.PrimitiveType.TRIANGLES,

        boundingSphere,

        vertexFormat: Cesium.VertexFormat.POSITION_NORMAL_AND_ST,
    });
}

// ============================================================
// GPU COLOR TEXTURE
// ============================================================

function createColorTexture(context, width, height, rgba8) {
    if (!context) {
        throw new Error("OCEAN-X: Cesium rendering context is unavailable.");
    }

    if (
        !Number.isInteger(width) ||
        !Number.isInteger(height) ||
        width <= 0 ||
        height <= 0
    ) {
        throw new Error("OCEAN-X: Invalid SSH texture dimensions.");
    }

    const expectedLength = width * height * 4;

    if (rgba8.length !== expectedLength) {
        throw new Error(
            `OCEAN-X: Invalid SSH texture buffer. Expected ${expectedLength}, received ${rgba8.length}.`,
        );
    }

    return new Cesium.Texture({
        context,

        pixelFormat: Cesium.PixelFormat.RGBA,

        pixelDatatype: Cesium.PixelDatatype.UNSIGNED_BYTE,

        sampler: new Cesium.Sampler({
            wrapS: Cesium.TextureWrap.CLAMP_TO_EDGE,

            wrapT: Cesium.TextureWrap.CLAMP_TO_EDGE,

            minificationFilter: Cesium.TextureMinificationFilter.LINEAR,

            magnificationFilter: Cesium.TextureMagnificationFilter.LINEAR,
        }),

        source: {
            width,
            height,
            arrayBufferView: rgba8,
        },
    });
}

// ============================================================
// MATERIAL
// ============================================================

function createSSHMaterial(opacity, texture) {
    return new Cesium.Material({
        fabric: {
            type: MATERIAL_TYPE,

            uniforms: {
                uColorTexture: texture,
                uOpacity: clamp(Number(opacity), 0, 1),
                uTime: 0,
            },

            source: `
                uniform sampler2D uColorTexture;
                uniform float uOpacity;
                uniform float uTime;

                czm_material czm_getMaterial(
                    czm_materialInput materialInput
                )
                {
                    czm_material material =
                        czm_getDefaultMaterial(materialInput);

                    vec4 baseColor =
                        texture2D(
                            uColorTexture,
                            materialInput.st
                        );

                    float shimmer =
                        0.5 +
                        0.5 *
                        sin(
                            materialInput.st.s * 60.0 +
                            uTime * 0.12
                        );

                    float highlight =
                        0.975 +
                        shimmer * 0.025;

                    material.diffuse =
                        baseColor.rgb * highlight;

                    material.specular =
                        vec3(0.10, 0.22, 0.28);

                    material.shininess = 28.0;

                    material.alpha =
                        baseColor.a * uOpacity;

                    return material;
                }
            `,
        },

        translucent: false,
    });
}

// ============================================================
// PRIMITIVE
// ============================================================

function createSSHPrimitive(geometry, material, visible) {
    const appearance = new Cesium.MaterialAppearance({
        material,

        materialSupport: Cesium.MaterialAppearance.MaterialSupport.TEXTURED,

        translucent: false,

        closed: false,

        faceForward: true,

        renderState: Cesium.RenderState.fromCache({
            depthTest: {
                enabled: true,
            },

            depthMask: true,

            blending: Cesium.BlendingState.ALPHA_BLEND,

            cull: {
                enabled: false,
            },
        }),
    });

    return new Cesium.Primitive({
        geometryInstances: new Cesium.GeometryInstance({
            geometry,

            id: "OCEAN-X-SEA-HEIGHT",
        }),

        appearance,

        // --------------------------------------------------------
        // IMPORTANT:
        //
        // Custom geometry is constructed locally.
        // Don't send it to Cesium's geometry worker.
        // --------------------------------------------------------

        asynchronous: false,

        compressVertices: false,

        allowPicking: false,

        show: Boolean(visible),
    });
}

// ============================================================
// BUILD NATIVE FIELD
// ============================================================

function buildNativeField(raster) {
    const { width, height, minLatitude, latStep, values, oceanMask } = raster;

    const totalCells = width * height;

    const field = new Float32Array(totalCells);

    const valid = new Uint8Array(totalCells);

    for (let row = 0; row < height; row++) {
        const latitude = minLatitude + row * latStep;

        if (latitude < -90 || latitude > 90) {
            continue;
        }

        for (let column = 0; column < width; column++) {
            const index = row * width + column;

            if (Number(oceanMask[index]) !== 1) {
                continue;
            }

            const value = Number(values[index]);

            if (!Number.isFinite(value)) {
                continue;
            }

            field[index] = value;

            valid[index] = 1;
        }
    }

    return {
        field,
        valid,
    };
}

// ============================================================
// COMPLETE RASTER PROCESSING
// ============================================================

function processRaster(raster) {
    const { width, height, minLatitude, minLongitude, latStep, lonStep } =
        raster;

    let { field, valid } = buildNativeField(raster);

    // 1. Fill small missing areas.
    ({ field, valid } = gapFillField(
        field,
        valid,
        width,
        height,
        GAP_FILL_PASSES,
    ));

    // 2. Smooth native field.
    field = blurGrid(field, width, height, SMOOTHING_PASSES, valid);

    // 3. Coastline smoothing.
    field = coastalSmoothField(
        field,
        valid,
        width,
        height,
        COAST_SMOOTHING_PASSES,
    );

    // 4. Upsample.
    const factor = Math.max(1, Math.round(UPSAMPLE_FACTOR));

    const {
        fineField,
        fineCoverage,
        fineWidth,
        fineHeight,
        fineLatStep,
        fineLonStep,
    } = upsampleField(field, valid, width, height, latStep, lonStep, factor);

    // 5. Smooth coverage.
    const smoothedCoverage = blurGrid(
        fineCoverage,
        fineWidth,
        fineHeight,
        COVERAGE_SMOOTHING_PASSES,
    );

    // 6. Build final ocean mask.
    const fineValid = computeValidMask(smoothedCoverage, COVERAGE_THRESHOLD);

    // 7. Final SSH smoothing.
    const finalField = blurGrid(
        fineField,
        fineWidth,
        fineHeight,
        FINE_SMOOTHING_PASSES,
        fineValid,
    );

    // 8. Statistics.
    const stats = computeSSHStatistics(finalField, fineValid);

    if (!stats) {
        return null;
    }

    return {
        fineField: finalField,

        fineCoverage: smoothedCoverage,

        fineValid,

        fineWidth,

        fineHeight,

        fineLatStep,

        fineLonStep,

        minLatitude,

        minLongitude,

        stats,
    };
}

// ============================================================
// REACT COMPONENT
// ============================================================

export default function SeaHeightTerrainLayer({
    viewer,
    raster,
    visible = false,
    opacity = 1,
}) {
    const primitiveRef = useRef(null);

    const materialRef = useRef(null);

    const textureRef = useRef(null);

    // ========================================================
    // VISIBILITY / OPACITY
    // ========================================================

    useEffect(() => {
        const primitive = primitiveRef.current;

        if (!primitive) {
            return;
        }

        primitive.show = Boolean(visible);

        const material = materialRef.current;

        if (material && material.uniforms) {
            material.uniforms.uOpacity = clamp(Number(opacity), 0, 1);
        }

        viewer?.scene?.requestRender();
    }, [viewer, visible, opacity]);

    // ========================================================
    // BUILD TERRAIN
    // ========================================================

    useEffect(() => {
        if (!viewer || !raster) {
            return undefined;
        }

        const {
            width,
            height,
            minLatitude,
            minLongitude,
            latStep,
            lonStep,
            values,
            oceanMask,
        } = raster;

        // ----------------------------------------------------
        // VALIDATE RASTER
        // ----------------------------------------------------

        if (
            !Number.isInteger(width) ||
            !Number.isInteger(height) ||
            width < 2 ||
            height < 2 ||
            !values ||
            !oceanMask
        ) {
            console.warn("OCEAN-X: Invalid SSH raster.");

            return undefined;
        }

        const totalCells = width * height;

        if (values.length < totalCells || oceanMask.length < totalCells) {
            console.warn("OCEAN-X: SSH raster arrays are incomplete.");

            return undefined;
        }

        if (
            !Number.isFinite(minLatitude) ||
            !Number.isFinite(minLongitude) ||
            !Number.isFinite(latStep) ||
            !Number.isFinite(lonStep) ||
            latStep === 0 ||
            lonStep === 0
        ) {
            console.warn("OCEAN-X: Invalid SSH raster coordinates.");

            return undefined;
        }

        // ----------------------------------------------------
        // CLEAN OLD PRIMITIVE
        // ----------------------------------------------------

        const oldPrimitive = primitiveRef.current;

        if (oldPrimitive) {
            try {
                viewer.scene.primitives.remove(oldPrimitive);
            } catch {
                // Already removed.
            }

            primitiveRef.current = null;
        }

        materialRef.current = null;

        // ----------------------------------------------------
        // CLEAN OLD TEXTURE
        // ----------------------------------------------------

        const oldTexture = textureRef.current;

        if (oldTexture) {
            try {
                if (!oldTexture.isDestroyed()) {
                    oldTexture.destroy();
                }
            } catch {
                // Already destroyed.
            }

            textureRef.current = null;
        }

        // ----------------------------------------------------
        // PROCESS DATA
        // ----------------------------------------------------

        let processed;

        try {
            processed = processRaster(raster);
        } catch (error) {
            console.error("OCEAN-X: SSH raster processing failed.", error);

            return undefined;
        }

        if (!processed) {
            console.warn("OCEAN-X: No valid SSH data.");

            return undefined;
        }

        // ----------------------------------------------------
        // BUILD VERTICES
        // ----------------------------------------------------

        let vertexData;

        try {
            vertexData = buildVertexBuffers(processed);
        } catch (error) {
            console.error("OCEAN-X: SSH vertex construction failed.", error);

            return undefined;
        }

        // ----------------------------------------------------
        // BUILD TRIANGLES
        // ----------------------------------------------------

        const { indices, triangleCount } = buildTriangleIndices(
            processed.fineValid,
            processed.fineWidth,
            processed.fineHeight,
        );

        console.log("========== OCEAN-X SSH DEBUG ==========");
        console.log("Raster:", {
            width,
            height,
            values: values.length,
            mask: oceanMask.length,
        });

        console.log("Processed:", {
            fineWidth: processed.fineWidth,
            fineHeight: processed.fineHeight,
            validVertices: processed.fineValid.reduce(
                (sum, value) => sum + (value === 1 ? 1 : 0),
                0,
            ),
            minSSH: processed.stats.minSSH,
            maxSSH: processed.stats.maxSSH,
            meanSSH: processed.stats.meanSSH,
        });

        console.log("========================================");

        if (indices.length === 0) {
            console.warn("OCEAN-X: SSH mesh contains no valid triangles.");

            return undefined;
        }

        // ----------------------------------------------------
        // CREATE GEOMETRY
        // ----------------------------------------------------

        let geometry;

        try {
            geometry = createSSHGeometry(
                vertexData.positions,
                vertexData.normals,
                vertexData.st,
                indices,
            );
        } catch (error) {
            console.error("OCEAN-X: SSH geometry creation failed.", error);

            return undefined;
        }

        // ----------------------------------------------------
        // CREATE GPU TEXTURE
        // ----------------------------------------------------

        let texture;

        try {
            texture = createColorTexture(
                viewer.scene.context,
                processed.fineWidth,
                processed.fineHeight,
                vertexData.textureData,
            );
        } catch (error) {
            console.error("OCEAN-X: SSH texture creation failed.", error);

            return undefined;
        }

        textureRef.current = texture;

        // ----------------------------------------------------
        // CREATE MATERIAL
        // ----------------------------------------------------

        let material;

        try {
            material = createSSHMaterial(opacity, texture);
        } catch (error) {
            console.error("OCEAN-X: SSH material creation failed.", error);

            try {
                if (!texture.isDestroyed()) {
                    texture.destroy();
                }
            } catch {
                // Ignore.
            }

            textureRef.current = null;

            return undefined;
        }

        // ----------------------------------------------------
        // CREATE PRIMITIVE
        // ----------------------------------------------------

        let primitive;

        try {
            primitive = createSSHPrimitive(geometry, material, visible);
        } catch (error) {
            console.error("OCEAN-X: SSH primitive creation failed.", error);

            try {
                if (!texture.isDestroyed()) {
                    texture.destroy();
                }
            } catch {
                // Ignore.
            }

            textureRef.current = null;

            return undefined;
        }

        // ----------------------------------------------------
        // ADD TO CESIUM
        // ----------------------------------------------------

        materialRef.current = material;

        primitiveRef.current = primitive;

        viewer.scene.primitives.add(primitive);

        // ----------------------------------------------------
        // ANIMATION
        // ----------------------------------------------------

        let animationFrame = null;

        const animate = () => {
            if (primitiveRef.current !== primitive) {
                return;
            }

            if (material.uniforms) {
                material.uniforms.uTime = performance.now() * 0.001;
            }

            if (primitive.show && viewer.scene) {
                viewer.scene.requestRender();
            }

            animationFrame = requestAnimationFrame(animate);
        };

        animate();

        // ----------------------------------------------------
        // DEBUG
        // ----------------------------------------------------

        console.log("OCEAN-X SSH terrain created successfully", {
            nativeGrid: `${width} × ${height}`,

            fineGrid: `${processed.fineWidth} × ${processed.fineHeight}`,

            oceanVertices: vertexData.oceanVertexCount,

            triangles: triangleCount,

            minSSH: processed.stats.minSSH,

            maxSSH: processed.stats.maxSSH,

            meanSSH: processed.stats.meanSSH,

            maxAbsAnomaly: processed.stats.maxAbsAnomaly,

            maxReliefHeight: MAX_RELIEF_HEIGHT,

            vertexFormat: "POSITION_NORMAL_AND_ST",

            material: "TEXTURED",

            asynchronous: false,
        });

        // ----------------------------------------------------
        // CLEANUP
        // ----------------------------------------------------

        return () => {
            if (animationFrame !== null) {
                cancelAnimationFrame(animationFrame);
            }

            if (primitiveRef.current === primitive) {
                primitiveRef.current = null;
            }

            materialRef.current = null;

            try {
                viewer.scene.primitives.remove(primitive);
            } catch {
                // Already removed.
            }

            if (textureRef.current === texture) {
                try {
                    if (!texture.isDestroyed()) {
                        texture.destroy();
                    }
                } catch {
                    // Already destroyed.
                }

                textureRef.current = null;
            }

            viewer.scene?.requestRender();
        };

        // Raster itself determines geometry.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewer, raster]);

    return null;
}

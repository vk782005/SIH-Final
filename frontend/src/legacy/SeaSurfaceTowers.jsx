import { useEffect, useRef } from "react";
import * as THREE from "three";

const GLOBE_RADIUS = 100;
const BASE_ALTITUDE = 0.008;

// Overall vertical exaggeration.
const VERTICAL_EXAGGERATION = 6.0;

// Smoothness of the terrain (native-resolution passes).
const SMOOTHING_PASSES = 3;

// Small gaps surrounded by ocean will be filled.
const GAP_FILL_PASSES = 2;

// Extra visual smoothing of the coastline (native-resolution passes).
const COAST_SMOOTHING_PASSES = 2;

// Higher = smoother/softer terrain.
// Lower = more local detail.
const RELIEF_POWER = 0.72;

// ------------------------------------------------------------
// UPSAMPLING
// ------------------------------------------------------------

const UPSAMPLE_FACTOR = 2;

// Light smoothing pass applied AFTER upsampling.
const FINE_SMOOTHING_PASSES = 1;

// Fine-grid coverage threshold.
const COVERAGE_THRESHOLD = 0.32;

// Coverage value at which terrain reaches full strength.
const FEATHER_UPPER = 0.92;

// Smooth the interpolated coverage field.
const COVERAGE_SMOOTHING_PASSES = 3;

// Subtle shore tint.
const SHORE_TINT = new THREE.Color(0xeaf7f5);
const SHORE_BLEND_MAX = 0.4;

// ------------------------------------------------------------
// SHARED LAYER TRANSITION
// ------------------------------------------------------------

const TRANSITION_MAX_OPACITY = 0.94;

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

// ------------------------------------------------------------
// COLOR PALETTE
// ------------------------------------------------------------

function getOceanColor(t) {
    const stops = [
        {
            t: 0.0,
            color: new THREE.Color(0x1428a0),
        },
        {
            t: 0.18,
            color: new THREE.Color(0x1769d2),
        },
        {
            t: 0.36,
            color: new THREE.Color(0x20a9d6),
        },
        {
            t: 0.52,
            color: new THREE.Color(0x32c9b1),
        },
        {
            t: 0.68,
            color: new THREE.Color(0xb8d95b),
        },
        {
            t: 0.82,
            color: new THREE.Color(0xf2c65c),
        },
        {
            t: 1.0,
            color: new THREE.Color(0xe77b4b),
        },
    ];

    if (t <= 0) {
        return stops[0].color.clone();
    }

    if (t >= 1) {
        return stops[
            stops.length - 1
        ].color.clone();
    }

    for (
        let i = 0;
        i < stops.length - 1;
        i++
    ) {
        const a = stops[i];
        const b = stops[i + 1];

        if (
            t >= a.t &&
            t <= b.t
        ) {
            const localT =
                (t - a.t) /
                (b.t - a.t);

            return a.color
                .clone()
                .lerp(
                    b.color,
                    localT
                );
        }
    }

    return stops[0].color.clone();
}

// ------------------------------------------------------------
// Wrapped longitude column
// ------------------------------------------------------------

function wrapColumn(
    column,
    width
) {
    if (column < 0) {
        return width - 1;
    }

    if (column >= width) {
        return 0;
    }

    return column;
}

// ------------------------------------------------------------
// N-pass weighted box blur
// ------------------------------------------------------------

function blurScalarGrid(
    sourceField,
    gridWidth,
    gridHeight,
    passes
) {
    let current =
        sourceField;

    for (
        let pass = 0;
        pass < passes;
        pass++
    ) {
        const next =
            new Float32Array(
                current.length
            );

        for (
            let row = 0;
            row < gridHeight;
            row++
        ) {
            for (
                let column = 0;
                column < gridWidth;
                column++
            ) {
                const index =
                    row *
                        gridWidth +
                    column;

                let weightedSum = 0;
                let weightTotal = 0;

                for (
                    let dy = -1;
                    dy <= 1;
                    dy++
                ) {
                    const neighborRow =
                        row + dy;

                    if (
                        neighborRow <
                            0 ||
                        neighborRow >=
                            gridHeight
                    ) {
                        continue;
                    }

                    for (
                        let dx = -1;
                        dx <= 1;
                        dx++
                    ) {
                        const neighborColumn =
                            wrapColumn(
                                column + dx,
                                gridWidth
                            );

                        const neighborIndex =
                            neighborRow *
                                gridWidth +
                            neighborColumn;

                        const distance =
                            Math.abs(dx) +
                            Math.abs(dy);

                        let weight = 1;

                        if (
                            distance === 1
                        ) {
                            weight = 2;
                        }

                        if (
                            dx === 0 &&
                            dy === 0
                        ) {
                            weight = 4;
                        }

                        weightedSum +=
                            current[
                                neighborIndex
                            ] *
                            weight;

                        weightTotal +=
                            weight;
                    }
                }

                next[index] =
                    weightTotal > 0
                        ? weightedSum /
                          weightTotal
                        : current[index];
            }
        }

        current = next;
    }

    return current;
}

// ------------------------------------------------------------
// Main component
// ------------------------------------------------------------

export default function SeaSurfaceTowers({
    globeRef,
    data,
    layerTransition,
}) {
    // Keep the latest transition available without
    // rebuilding the expensive terrain mesh.
    const transitionRef =
        useRef(
            layerTransition
        );

    transitionRef.current =
        layerTransition;

    useEffect(() => {
        if (
            !globeRef?.current ||
            !data
        ) {
            return;
        }

        const globe =
            globeRef.current;

        const {
            width,
            height,
            minLatitude,
            minLongitude,
            latStep,
            lonStep,
            values,
            oceanMask,
        } = data;

        if (
            !width ||
            !height ||
            !values ||
            !oceanMask
        ) {
            console.warn(
                "SeaSurfaceTowers: Missing grid data"
            );

            return;
        }

        const totalCells =
            width * height;

        // ========================================================
        // 1. BUILD INITIAL DATA FIELD
        // ========================================================

        const field =
            new Float32Array(
                totalCells
            );

        const valid =
            new Uint8Array(
                totalCells
            );

        for (
            let row = 0;
            row < height;
            row++
        ) {
            const latitude =
                minLatitude +
                row * latStep;

            const rowInBounds =
                latitude >= -90 &&
                latitude <= 90;

            for (
                let column = 0;
                column < width;
                column++
            ) {
                const index =
                    row *
                        width +
                    column;

                if (
                    !rowInBounds
                ) {
                    continue;
                }

                if (
                    oceanMask[index] !==
                    1
                ) {
                    continue;
                }

                const value =
                    Number(
                        values[index]
                    );

                if (
                    !Number.isFinite(
                        value
                    )
                ) {
                    continue;
                }

                field[index] =
                    value;

                valid[index] = 1;
            }
        }

        // ========================================================
        // 2. FILL SMALL HOLES
        // ========================================================

        for (
            let pass = 0;
            pass < GAP_FILL_PASSES;
            pass++
        ) {
            const nextField =
                new Float32Array(
                    field
                );

            const nextValid =
                new Uint8Array(
                    valid
                );

            for (
                let row = 1;
                row <
                    height - 1;
                row++
            ) {
                for (
                    let column = 0;
                    column < width;
                    column++
                ) {
                    const index =
                        row *
                            width +
                        column;

                    if (
                        valid[index] ===
                        1
                    ) {
                        continue;
                    }

                    let weightedSum = 0;
                    let weightTotal = 0;
                    let neighborCount = 0;

                    for (
                        let dy = -1;
                        dy <= 1;
                        dy++
                    ) {
                        const neighborRow =
                            row + dy;

                        if (
                            neighborRow <
                                0 ||
                            neighborRow >=
                                height
                        ) {
                            continue;
                        }

                        for (
                            let dx = -1;
                            dx <= 1;
                            dx++
                        ) {
                            if (
                                dx === 0 &&
                                dy === 0
                            ) {
                                continue;
                            }

                            const neighborColumn =
                                wrapColumn(
                                    column +
                                        dx,
                                    width
                                );

                            const neighborIndex =
                                neighborRow *
                                    width +
                                neighborColumn;

                            if (
                                valid[
                                    neighborIndex
                                ] !== 1
                            ) {
                                continue;
                            }

                            const isOrthogonal =
                                dx === 0 ||
                                dy === 0;

                            const weight =
                                isOrthogonal
                                    ? 2
                                    : 1;

                            weightedSum +=
                                field[
                                    neighborIndex
                                ] *
                                weight;

                            weightTotal +=
                                weight;

                            neighborCount++;
                        }
                    }

                    if (
                        neighborCount >=
                            5 &&
                        weightTotal > 0
                    ) {
                        nextField[
                            index
                        ] =
                            weightedSum /
                            weightTotal;

                        nextValid[
                            index
                        ] = 1;
                    }
                }
            }

            field.set(
                nextField
            );

            valid.set(
                nextValid
            );
        }

        // ========================================================
        // 3. SMOOTH SSH FIELD
        // ========================================================

        for (
            let pass = 0;
            pass < SMOOTHING_PASSES;
            pass++
        ) {
            const nextField =
                new Float32Array(
                    field
                );

            for (
                let row = 0;
                row < height;
                row++
            ) {
                for (
                    let column = 0;
                    column < width;
                    column++
                ) {
                    const index =
                        row *
                            width +
                        column;

                    if (
                        valid[index] !==
                        1
                    ) {
                        continue;
                    }

                    let weightedSum = 0;
                    let weightTotal = 0;

                    for (
                        let dy = -1;
                        dy <= 1;
                        dy++
                    ) {
                        const neighborRow =
                            row + dy;

                        if (
                            neighborRow <
                                0 ||
                            neighborRow >=
                                height
                        ) {
                            continue;
                        }

                        for (
                            let dx = -1;
                            dx <= 1;
                            dx++
                        ) {
                            const neighborColumn =
                                wrapColumn(
                                    column +
                                        dx,
                                    width
                                );

                            const neighborIndex =
                                neighborRow *
                                    width +
                                neighborColumn;

                            if (
                                valid[
                                    neighborIndex
                                ] !== 1
                            ) {
                                continue;
                            }

                            const distance =
                                Math.abs(
                                    dx
                                ) +
                                Math.abs(
                                    dy
                                );

                            let weight = 1;

                            if (
                                distance ===
                                1
                            ) {
                                weight = 2;
                            }

                            if (
                                dx === 0 &&
                                dy === 0
                            ) {
                                weight = 4;
                            }

                            weightedSum +=
                                field[
                                    neighborIndex
                                ] *
                                weight;

                            weightTotal +=
                                weight;
                        }
                    }

                    if (
                        weightTotal > 0
                    ) {
                        nextField[
                            index
                        ] =
                            weightedSum /
                            weightTotal;
                    }
                }
            }

            field.set(
                nextField
            );
        }

        // ========================================================
        // 4. COASTLINE VALUE SMOOTHING
        // ========================================================

        for (
            let pass = 0;
            pass <
                COAST_SMOOTHING_PASSES;
            pass++
        ) {
            const nextField =
                new Float32Array(
                    field
                );

            for (
                let row = 1;
                row <
                    height - 1;
                row++
            ) {
                for (
                    let column = 0;
                    column < width;
                    column++
                ) {
                    const index =
                        row *
                            width +
                        column;

                    if (
                        valid[index] !==
                        1
                    ) {
                        continue;
                    }

                    let hasLandNeighbor =
                        false;

                    let sum = 0;
                    let count = 0;

                    for (
                        let dy = -1;
                        dy <= 1;
                        dy++
                    ) {
                        for (
                            let dx = -1;
                            dx <= 1;
                            dx++
                        ) {
                            if (
                                dx === 0 &&
                                dy === 0
                            ) {
                                continue;
                            }

                            const neighborRow =
                                row + dy;

                            if (
                                neighborRow <
                                    0 ||
                                neighborRow >=
                                    height
                            ) {
                                continue;
                            }

                            const neighborColumn =
                                wrapColumn(
                                    column +
                                        dx,
                                    width
                                );

                            const neighborIndex =
                                neighborRow *
                                    width +
                                neighborColumn;

                            if (
                                valid[
                                    neighborIndex
                                ] !== 1
                            ) {
                                hasLandNeighbor =
                                    true;

                                continue;
                            }

                            sum +=
                                field[
                                    neighborIndex
                                ];

                            count++;
                        }
                    }

                    if (
                        hasLandNeighbor &&
                        count >= 3
                    ) {
                        const neighborAverage =
                            sum /
                            count;

                        nextField[
                            index
                        ] =
                            field[index] *
                                0.65 +
                            neighborAverage *
                                0.35;
                    }
                }
            }

            field.set(
                nextField
            );
        }

        // ========================================================
        // 5. UPSAMPLE
        // ========================================================

        const factor =
            Math.max(
                1,
                Math.round(
                    UPSAMPLE_FACTOR
                )
            );

        const fineWidth =
            width * factor;

        const fineHeight =
            (height - 1) *
                factor +
            1;

        const fineTotalCells =
            fineWidth *
            fineHeight;

        const fineLatStep =
            latStep / factor;

        const fineLonStep =
            lonStep / factor;

        let fineField =
            new Float32Array(
                fineTotalCells
            );

        let fineCoverage =
            new Float32Array(
                fineTotalCells
            );

        {
            const nativeCoverage =
                valid;

            for (
                let fr = 0;
                fr < fineHeight;
                fr++
            ) {
                const sourceRow =
                    fr / factor;

                const r0 =
                    Math.floor(
                        sourceRow
                    );

                const r1 =
                    Math.min(
                        r0 + 1,
                        height - 1
                    );

                const fracRow =
                    sourceRow - r0;

                for (
                    let fc = 0;
                    fc < fineWidth;
                    fc++
                ) {
                    const sourceCol =
                        fc / factor;

                    let c0 =
                        Math.floor(
                            sourceCol
                        ) % width;

                    if (c0 < 0) {
                        c0 += width;
                    }

                    const c1 =
                        (c0 + 1) %
                        width;

                    const fracCol =
                        sourceCol -
                        Math.floor(
                            sourceCol
                        );

                    const w00 =
                        (1 - fracRow) *
                        (1 - fracCol);

                    const w01 =
                        (1 - fracRow) *
                        fracCol;

                    const w10 =
                        fracRow *
                        (1 - fracCol);

                    const w11 =
                        fracRow *
                        fracCol;

                    const i00 =
                        r0 * width +
                        c0;

                    const i01 =
                        r0 * width +
                        c1;

                    const i10 =
                        r1 * width +
                        c0;

                    const i11 =
                        r1 * width +
                        c1;

                    const cov00 =
                        nativeCoverage[
                            i00
                        ];

                    const cov01 =
                        nativeCoverage[
                            i01
                        ];

                    const cov10 =
                        nativeCoverage[
                            i10
                        ];

                    const cov11 =
                        nativeCoverage[
                            i11
                        ];

                    const coverage =
                        w00 * cov00 +
                        w01 * cov01 +
                        w10 * cov10 +
                        w11 * cov11;

                    let interpolated = 0;

                    if (
                        coverage > 0
                    ) {
                        const weightedFieldSum =
                            w00 *
                                cov00 *
                                field[
                                    i00
                                ] +
                            w01 *
                                cov01 *
                                field[
                                    i01
                                ] +
                            w10 *
                                cov10 *
                                field[
                                    i10
                                ] +
                            w11 *
                                cov11 *
                                field[
                                    i11
                                ];

                        interpolated =
                            weightedFieldSum /
                            coverage;
                    }

                    const fineIndex =
                        fr *
                            fineWidth +
                        fc;

                    fineField[
                        fineIndex
                    ] = interpolated;

                    fineCoverage[
                        fineIndex
                    ] = coverage;
                }
            }
        }

        // ========================================================
        // 6. SMOOTH COVERAGE
        // ========================================================

        fineCoverage =
            blurScalarGrid(
                fineCoverage,
                fineWidth,
                fineHeight,
                COVERAGE_SMOOTHING_PASSES
            );

        const fineValid =
            new Uint8Array(
                fineTotalCells
            );

        for (
            let i = 0;
            i < fineTotalCells;
            i++
        ) {
            fineValid[i] =
                fineCoverage[i] >=
                COVERAGE_THRESHOLD
                    ? 1
                    : 0;
        }

        // ========================================================
        // 7. LIGHT FINE-GRID SMOOTHING
        // ========================================================

        for (
            let pass = 0;
            pass <
                FINE_SMOOTHING_PASSES;
            pass++
        ) {
            const nextField =
                new Float32Array(
                    fineField
                );

            for (
                let row = 0;
                row < fineHeight;
                row++
            ) {
                for (
                    let column = 0;
                    column < fineWidth;
                    column++
                ) {
                    const index =
                        row *
                            fineWidth +
                        column;

                    if (
                        fineValid[index] !==
                        1
                    ) {
                        continue;
                    }

                    let weightedSum = 0;
                    let weightTotal = 0;

                    for (
                        let dy = -1;
                        dy <= 1;
                        dy++
                    ) {
                        const neighborRow =
                            row + dy;

                        if (
                            neighborRow <
                                0 ||
                            neighborRow >=
                                fineHeight
                        ) {
                            continue;
                        }

                        for (
                            let dx = -1;
                            dx <= 1;
                            dx++
                        ) {
                            const neighborColumn =
                                wrapColumn(
                                    column +
                                        dx,
                                    fineWidth
                                );

                            const neighborIndex =
                                neighborRow *
                                    fineWidth +
                                neighborColumn;

                            if (
                                fineValid[
                                    neighborIndex
                                ] !== 1
                            ) {
                                continue;
                            }

                            const distance =
                                Math.abs(
                                    dx
                                ) +
                                Math.abs(
                                    dy
                                );

                            let weight = 1;

                            if (
                                distance ===
                                1
                            ) {
                                weight = 2;
                            }

                            if (
                                dx === 0 &&
                                dy === 0
                            ) {
                                weight = 4;
                            }

                            weightedSum +=
                                fineField[
                                    neighborIndex
                                ] *
                                weight;

                            weightTotal +=
                                weight;
                        }
                    }

                    if (
                        weightTotal > 0
                    ) {
                        nextField[
                            index
                        ] =
                            weightedSum /
                            weightTotal;
                    }
                }
            }

            fineField.set(
                nextField
            );
        }

        // ========================================================
        // 8. SSH RANGE
        // ========================================================

        let minValue =
            Infinity;

        let maxValue =
            -Infinity;

        for (
            let i = 0;
            i < fineTotalCells;
            i++
        ) {
            if (
                fineValid[i] !== 1
            ) {
                continue;
            }

            const value =
                fineField[i];

            minValue =
                Math.min(
                    minValue,
                    value
                );

            maxValue =
                Math.max(
                    maxValue,
                    value
                );
        }

        if (
            !Number.isFinite(
                minValue
            ) ||
            !Number.isFinite(
                maxValue
            )
        ) {
            console.warn(
                "SeaSurfaceTowers: No valid SSH values"
            );

            return;
        }

        const sshRange =
            maxValue -
                minValue ||
            1;

        // ========================================================
        // 9. LOCAL RELIEF
        // ========================================================

        const relief =
            new Float32Array(
                fineTotalCells
            );

        let maxRelief = 0;

        for (
            let row = 0;
            row < fineHeight;
            row++
        ) {
            for (
                let column = 0;
                column < fineWidth;
                column++
            ) {
                const index =
                    row *
                        fineWidth +
                    column;

                if (
                    fineValid[index] !==
                    1
                ) {
                    continue;
                }

                let sum = 0;
                let count = 0;

                for (
                    let dy = -1;
                    dy <= 1;
                    dy++
                ) {
                    const neighborRow =
                        row + dy;

                    if (
                        neighborRow <
                            0 ||
                        neighborRow >=
                            fineHeight
                    ) {
                        continue;
                    }

                    for (
                        let dx = -1;
                        dx <= 1;
                        dx++
                    ) {
                        const neighborColumn =
                            wrapColumn(
                                column +
                                    dx,
                                fineWidth
                            );

                        const neighborIndex =
                            neighborRow *
                                fineWidth +
                            neighborColumn;

                        if (
                            fineValid[
                                neighborIndex
                            ] !== 1
                        ) {
                            continue;
                        }

                        sum +=
                            fineField[
                                neighborIndex
                            ];

                        count++;
                    }
                }

                if (
                    count === 0
                ) {
                    continue;
                }

                const localAverage =
                    sum / count;

                const localDifference =
                    fineField[index] -
                    localAverage;

                relief[index] =
                    localDifference;

                maxRelief =
                    Math.max(
                        maxRelief,
                        Math.abs(
                            localDifference
                        )
                    );
            }
        }

        // ========================================================
        // 10. GEOMETRY BUFFERS
        // ========================================================

        const positions =
            new Float32Array(
                fineTotalCells * 3
            );

        const colors =
            new Float32Array(
                fineTotalCells * 3
            );

        // ========================================================
        // 11. CREATE TERRAIN VERTICES
        // ========================================================

        let oceanPointCount = 0;

        for (
            let row = 0;
            row < fineHeight;
            row++
        ) {
            const latitude =
                minLatitude +
                row * fineLatStep;

            if (
                latitude < -90 ||
                latitude > 90
            ) {
                continue;
            }

            for (
                let column = 0;
                column < fineWidth;
                column++
            ) {
                const index =
                    row *
                        fineWidth +
                    column;

                if (
                    fineValid[index] !==
                    1
                ) {
                    continue;
                }

                const longitude =
                    minLongitude +
                    column *
                        fineLonStep;

                const coverage =
                    fineCoverage[index];

                // ----------------------------------------------
                // Coastline feather
                // ----------------------------------------------

                const heightFeather =
                    coverage >=
                    FEATHER_UPPER
                        ? 1
                        : THREE.MathUtils.clamp(
                              (
                                  coverage -
                                  COVERAGE_THRESHOLD
                              ) /
                                  (
                                      FEATHER_UPPER -
                                      COVERAGE_THRESHOLD
                                  ),
                              0,
                              1
                          );

                // ----------------------------------------------
                // Local relief
                // ----------------------------------------------

                let normalizedRelief =
                    maxRelief > 0
                        ? relief[index] /
                          maxRelief
                        : 0;

                normalizedRelief =
                    THREE.MathUtils.clamp(
                        normalizedRelief,
                        -1,
                        1
                    );

                const sign =
                    normalizedRelief <
                    0
                        ? -1
                        : 1;

                const magnitude =
                    Math.pow(
                        Math.abs(
                            normalizedRelief
                        ),
                        RELIEF_POWER
                    );

                let terrainHeight =
                    sign *
                    magnitude *
                    VERTICAL_EXAGGERATION;

                terrainHeight *=
                    heightFeather;

                if (
                    Math.abs(
                        terrainHeight
                    ) < 0.02
                ) {
                    terrainHeight = 0;
                }

                // ----------------------------------------------
                // Anchor to globe
                // ----------------------------------------------

                const altitude =
                    BASE_ALTITUDE +
                    terrainHeight /
                        GLOBE_RADIUS;

                const coords =
                    globe.getCoords(
                        latitude,
                        longitude,
                        altitude
                    );

                positions[
                    index * 3
                ] = coords.x;

                positions[
                    index * 3 + 1
                ] = coords.y;

                positions[
                    index * 3 + 2
                ] = coords.z;

                // ----------------------------------------------
                // Color
                // ----------------------------------------------

                let colorT =
                    (
                        fineField[index] -
                        minValue
                    ) /
                    sshRange;

                colorT =
                    THREE.MathUtils.clamp(
                        colorT,
                        0,
                        1
                    );

                let color =
                    getOceanColor(
                        colorT
                    );

                if (
                    coverage <
                    FEATHER_UPPER
                ) {
                    const shoreT =
                        (
                            1 -
                            heightFeather
                        ) *
                        SHORE_BLEND_MAX;

                    color =
                        color
                            .clone()
                            .lerp(
                                SHORE_TINT,
                                shoreT
                            );
                }

                colors[
                    index * 3
                ] = color.r;

                colors[
                    index * 3 + 1
                ] = color.g;

                colors[
                    index * 3 + 2
                ] = color.b;

                oceanPointCount++;
            }
        }

        // ========================================================
        // 12. BUILD TRIANGLES
        // ========================================================

        const indices = [];

        let triangleCount = 0;

        for (
            let row = 0;
            row <
                fineHeight - 1;
            row++
        ) {
            for (
                let column = 0;
                column < fineWidth;
                column++
            ) {
                const nextColumn =
                    wrapColumn(
                        column + 1,
                        fineWidth
                    );

                const topLeft =
                    row *
                        fineWidth +
                    column;

                const topRight =
                    row *
                        fineWidth +
                    nextColumn;

                const bottomLeft =
                    (row + 1) *
                        fineWidth +
                    column;

                const bottomRight =
                    (row + 1) *
                        fineWidth +
                    nextColumn;

                if (
                    fineValid[
                        topLeft
                    ] !== 1 ||
                    fineValid[
                        topRight
                    ] !== 1 ||
                    fineValid[
                        bottomLeft
                    ] !== 1 ||
                    fineValid[
                        bottomRight
                    ] !== 1
                ) {
                    continue;
                }

                indices.push(
                    topLeft,
                    topRight,
                    bottomLeft
                );

                indices.push(
                    topRight,
                    bottomRight,
                    bottomLeft
                );

                triangleCount += 2;
            }
        }

        // ========================================================
        // 13. THREE.JS GEOMETRY
        // ========================================================

        const geometry =
            new THREE.BufferGeometry();

        geometry.setAttribute(
            "position",
            new THREE.BufferAttribute(
                positions,
                3
            )
        );

        geometry.setAttribute(
            "color",
            new THREE.BufferAttribute(
                colors,
                3
            )
        );

        geometry.setIndex(
            indices
        );

        geometry.computeVertexNormals();

        // ========================================================
        // 14. TERRAIN MATERIAL
        // ========================================================

        const material =
            new THREE.MeshPhongMaterial({
                vertexColors: true,

                shininess: 14,

                specular:
                    new THREE.Color(
                        0x163c55
                    ),

                transparent: true,

                // Start invisible.
                //
                // The transition controller will immediately
                // move this to the correct opacity.
                opacity: 0,

                side:
                    THREE.FrontSide,

                depthTest: true,

                depthWrite: true,
            });

        // ========================================================
        // 15. CREATE TERRAIN MESH
        // ========================================================

        const mesh =
            new THREE.Mesh(
                geometry,
                material
            );

        mesh.name =
            "SeaSurfaceTerrain";

        mesh.renderOrder = 30;

        mesh.frustumCulled =
            false;

        // Prevent terrain from stealing globe clicks.
        mesh.raycast =
            () => {};

        globe.scene().add(
            mesh
        );

        // ========================================================
        // 16. SHARED LAYER TRANSITION
        // ========================================================

        let transitionFrame =
            null;

        function updateTransitionOpacity() {
            const transition =
                transitionRef.current;

            if (!transition) {
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

            let transitionOpacity = 0;

            // ----------------------------------------------------
            // Incoming SSH
            //
            // Any layer -> SSH
            // ----------------------------------------------------

            if (
                to === "seaHeight"
            ) {
                transitionOpacity =
                    easeInOutCubic(
                        progress
                    );
            }

            // ----------------------------------------------------
            // Outgoing SSH
            //
            // SSH -> any other layer
            // ----------------------------------------------------

            else if (
                from === "seaHeight"
            ) {
                transitionOpacity =
                    1 -
                    easeInOutCubic(
                        progress
                    );
            }

            // ----------------------------------------------------
            // Stable SSH state.
            // ----------------------------------------------------

            else if (
                from === "seaHeight" ||
                to === "seaHeight"
            ) {
                transitionOpacity = 1;
            }

            else {
                transitionOpacity = 0;
            }

            transitionOpacity =
                THREE.MathUtils.clamp(
                    transitionOpacity,
                    0,
                    1
                );

            material.opacity =
                TRANSITION_MAX_OPACITY *
                transitionOpacity;

            material.needsUpdate =
                true;

            transitionFrame =
                requestAnimationFrame(
                    updateTransitionOpacity
                );
        }

        updateTransitionOpacity();

        // ========================================================
        // DEBUG
        // ========================================================

        console.log(
            "Sea Surface Terrain:",
            {
                nativeGrid:
                    `${width} x ${height}`,

                fineGrid:
                    `${fineWidth} x ${fineHeight}`,

                upsampleFactor:
                    factor,

                oceanPoints:
                    oceanPointCount,

                triangles:
                    triangleCount,

                minSSH:
                    minValue,

                maxSSH:
                    maxValue,

                maxLocalRelief:
                    maxRelief,

                verticalExaggeration:
                    VERTICAL_EXAGGERATION,

                smoothingPasses:
                    SMOOTHING_PASSES,

                gapFillPasses:
                    GAP_FILL_PASSES,

                coastSmoothing:
                    COAST_SMOOTHING_PASSES,

                fineSmoothingPasses:
                    FINE_SMOOTHING_PASSES,

                coverageSmoothingPasses:
                    COVERAGE_SMOOTHING_PASSES,

                coverageThreshold:
                    COVERAGE_THRESHOLD,

                featherUpper:
                    FEATHER_UPPER,
            }
        );

        // ========================================================
        // CLEANUP
        // ========================================================

        return () => {
            if (
                transitionFrame !==
                null
            ) {
                cancelAnimationFrame(
                    transitionFrame
                );
            }

            globe.scene().remove(
                mesh
            );

            geometry.dispose();

            material.dispose();
        };
    }, [
        globeRef,
        data,
    ]);

    // Keep latest transition available without rebuilding mesh.
    useEffect(() => {
        transitionRef.current =
            layerTransition;
    }, [
        layerTransition,
    ]);

    return null;
}
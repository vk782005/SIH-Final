const express = require("express");
const cors = require("cors");

const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
    res.json({
        message: "Ocean Backend is running!",
    });
});

// Test PostgreSQL connection
app.get("/api/test-db", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.json({
            message: "PostgreSQL connected successfully!",
            time: result.rows[0].now,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Database connection failed",
        });
    }
});

// Get ocean data for a latitude and longitude
app.get("/api/ocean-data", async (req, res) => {
    try {
        const { latitude, longitude } = req.query;

        const lat = Number(latitude);
        const lon = Number(longitude);

        // Validate coordinates
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
            return res.status(400).json({
                hasOceanData: false,
                message: "Please provide valid latitude and longitude",
            });
        }

        // Validate geographic range
        if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            return res.status(400).json({
                hasOceanData: false,
                message:
                    "Latitude must be between -90 and 90, longitude between -180 and 180",
            });
        }

        const result = await pool.query(
            `
            SELECT
                time,
                latitude,
                longitude,
                depth,
                bottomT,
                mlotst,
                so,
                thetao,
                uo,
                vo,
                zos,
                siconc,
                sithick,
                usi,
                vsi
            FROM ocean_grid
            ORDER BY geom <-> ST_SetSRID(
                ST_MakePoint($2, $1),
                4326
            )
            LIMIT 1;
            `,
            [lat, lon],
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                hasOceanData: false,
                message: "No data found for this location",
            });
        }

        const data = result.rows[0];

        // Check if nearest grid point contains ocean data
        const hasOceanData =
            data.thetao !== null ||
            data.so !== null ||
            data.uo !== null ||
            data.vo !== null ||
            data.zos !== null;

        // Land / no-data location
        if (!hasOceanData) {
            return res.status(200).json({
                hasOceanData: false,
                message:
                    "This location is on land or has no ocean data available.",
                latitude: data.latitude,
                longitude: data.longitude,
            });
        }

        // Ocean location
        res.json({
            hasOceanData: true,
            ...data,
        });
    } catch (error) {
        console.error("Ocean data error:", error);

        res.status(500).json({
            hasOceanData: false,
            message: "Failed to fetch ocean data",
        });
    }
});


// =========================================================
// Area Analysis API
// POST /api/ocean-area-analysis
//
// Accepts a polygon as:
// {
//   polygon: [
//     { latitude: 30.2, longitude: 75.4 },
//     { latitude: 30.8, longitude: 76.1 },
//     { latitude: 29.9, longitude: 77.0 }
//   ]
// }
//
// The polygon is converted to GeoJSON and evaluated by PostGIS
// against the indexed ocean_grid.geom points. This keeps the
// heavy regional aggregation in PostgreSQL instead of the browser.
// =========================================================
app.post("/api/ocean-area-analysis", async (req, res) => {
    try {
        const { polygon } = req.body ?? {};

        if (!Array.isArray(polygon) || polygon.length < 3) {
            return res.status(400).json({
                error: "A polygon with at least 3 points is required.",
            });
        }

        if (polygon.length > 5000) {
            return res.status(400).json({
                error: "Polygon has too many vertices. Maximum is 5000.",
            });
        }

        const points = polygon.map((point) => ({
            latitude: Number(point?.latitude),
            longitude: Number(point?.longitude),
        }));

        const invalidPoint = points.find(
            ({ latitude, longitude }) =>
                !Number.isFinite(latitude) ||
                !Number.isFinite(longitude) ||
                latitude < -90 ||
                latitude > 90 ||
                longitude < -180 ||
                longitude > 180,
        );

        if (invalidPoint) {
            return res.status(400).json({
                error:
                    "Every polygon point must have a latitude between -90 and 90 and a longitude between -180 and 180.",
            });
        }

        // Remove a duplicated closing point if the frontend already sent one.
        const ringPoints = [...points];
        const first = ringPoints[0];
        const last = ringPoints[ringPoints.length - 1];

        if (
            first.latitude === last.latitude &&
            first.longitude === last.longitude
        ) {
            ringPoints.pop();
        }

        // A polygon still needs 3 unique vertices after normalization.
        const uniqueVertices = new Set(
            ringPoints.map(
                ({ latitude, longitude }) =>
                    `${latitude.toFixed(10)},${longitude.toFixed(10)}`,
            ),
        );

        if (ringPoints.length < 3 || uniqueVertices.size < 3) {
            return res.status(400).json({
                error: "A polygon must contain at least 3 distinct vertices.",
            });
        }

        // GeoJSON uses [longitude, latitude], and a Polygon ring must be closed.
        const coordinates = [
            ...ringPoints.map(({ latitude, longitude }) => [
                longitude,
                latitude,
            ]),
            [
                ringPoints[0].longitude,
                ringPoints[0].latitude,
            ],
        ];

        const geoJson = JSON.stringify({
            type: "Polygon",
            coordinates: [coordinates],
        });

        const result = await pool.query(
            `
            WITH input_polygon AS (
                SELECT ST_SetSRID(
                    ST_GeomFromGeoJSON($1),
                    4326
                ) AS geom
            ),
            selected_cells AS (
                SELECT
                    g.time,
                    g.depth,
                    g.bottomT,
                    g.mlotst,
                    g.so,
                    g.thetao,
                    g.uo,
                    g.vo,
                    g.zos,
                    g.siconc,
                    g.sithick,
                    g.usi,
                    g.vsi
                FROM ocean_grid AS g
                CROSS JOIN input_polygon AS p
                WHERE g.geom IS NOT NULL
                  AND g.geom && p.geom
                  AND ST_Covers(p.geom, g.geom)
                  AND (
                      g.thetao IS NOT NULL
                      OR g.so IS NOT NULL
                      OR g.uo IS NOT NULL
                      OR g.vo IS NOT NULL
                      OR g.zos IS NOT NULL
                  )
            )
            SELECT
                COUNT(*)::integer AS cells_analyzed,

                AVG(thetao) AS mean_temperature,
                COUNT(thetao)::integer AS temperature_cells,

                AVG(so) AS mean_salinity,
                COUNT(so)::integer AS salinity_cells,

                AVG(zos) AS mean_sea_height,
                COUNT(zos)::integer AS sea_height_cells,

                AVG(uo) FILTER (
                    WHERE uo IS NOT NULL AND vo IS NOT NULL
                ) AS mean_u,
                AVG(vo) FILTER (
                    WHERE uo IS NOT NULL AND vo IS NOT NULL
                ) AS mean_v,
                COUNT(*) FILTER (
                    WHERE uo IS NOT NULL AND vo IS NOT NULL
                )::integer AS current_cells,

                AVG(depth) AS mean_depth,
                COUNT(depth)::integer AS depth_cells,

                AVG(bottomT) AS mean_bottom_temperature,
                COUNT(bottomT)::integer AS bottom_temperature_cells,

                AVG(mlotst) AS mean_mixed_layer_depth,
                COUNT(mlotst)::integer AS mixed_layer_depth_cells,

                AVG(siconc) AS mean_sea_ice_concentration,
                COUNT(siconc)::integer AS sea_ice_cells,

                MIN(time) AS time_start,
                MAX(time) AS time_end

            FROM selected_cells;
            `,
            [geoJson],
        );

        // ST_Area(geography) returns square metres, so convert to km².
        const areaResult = await pool.query(
            `
            SELECT
                ST_Area(
                    ST_SetSRID(
                        ST_GeomFromGeoJSON($1),
                        4326
                    )::geography
                ) / 1000000.0 AS area_km2;
            `,
            [geoJson],
        );

        const row = result.rows[0];
        const areaKm2 = Number(areaResult.rows[0]?.area_km2 ?? 0);
        const cellsAnalyzed = Number(row.cells_analyzed ?? 0);

        if (cellsAnalyzed === 0) {
            return res.status(200).json({
                areaKm2,
                vertices: ringPoints.length,
                cellsAnalyzed: 0,
                message:
                    "No valid ocean grid cells fall inside the selected polygon.",
                metrics: {
                    temperature: null,
                    salinity: null,
                    currents: null,
                    seaHeight: null,
                },
                coverage: {
                    temperatureCells: 0,
                    salinityCells: 0,
                    currentCells: 0,
                    seaHeightCells: 0,
                },
                modelTime: null,
            });
        }

        const meanU =
            row.mean_u === null ? null : Number(row.mean_u);
        const meanV =
            row.mean_v === null ? null : Number(row.mean_v);

        let current = null;

        if (meanU !== null && meanV !== null) {
            const speed = Math.hypot(meanU, meanV);

            // Match the existing frontend's bearing convention:
            // atan2(u, v), clockwise from north.
            let bearing = (Math.atan2(meanU, meanV) * 180) / Math.PI;
            if (bearing < 0) bearing += 360;

            const compassPoints = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
            const compass =
                compassPoints[Math.round(bearing / 45) % 8];

            current = {
                meanU,
                meanV,
                speed,
                bearing,
                compass,
                cellsAnalyzed: Number(row.current_cells ?? 0),
            };
        }

        const modelTime =
            row.time_start && row.time_end && String(row.time_start) === String(row.time_end)
                ? row.time_start
                : null;

        return res.json({
            areaKm2,
            vertices: ringPoints.length,
            cellsAnalyzed,

            metrics: {
                temperature:
                    row.mean_temperature === null
                        ? null
                        : Number(row.mean_temperature),

                salinity:
                    row.mean_salinity === null
                        ? null
                        : Number(row.mean_salinity),

                currents: current,

                seaHeight:
                    row.mean_sea_height === null
                        ? null
                        : Number(row.mean_sea_height),
            },

            coverage: {
                temperatureCells: Number(row.temperature_cells ?? 0),
                salinityCells: Number(row.salinity_cells ?? 0),
                currentCells: Number(row.current_cells ?? 0),
                seaHeightCells: Number(row.sea_height_cells ?? 0),
            },

            additionalMetrics: {
                meanDepth:
                    row.mean_depth === null ? null : Number(row.mean_depth),
                meanBottomTemperature:
                    row.mean_bottom_temperature === null
                        ? null
                        : Number(row.mean_bottom_temperature),
                meanMixedLayerDepth:
                    row.mean_mixed_layer_depth === null
                        ? null
                        : Number(row.mean_mixed_layer_depth),
                meanSeaIceConcentration:
                    row.mean_sea_ice_concentration === null
                        ? null
                        : Number(row.mean_sea_ice_concentration),
            },

            modelTime,
        });
    } catch (error) {
        console.error("Ocean area analysis error:", error);

        res.status(500).json({
            error: "Failed to analyze the selected ocean area.",
        });
    }
});

// =========================================================
// HeatMap / Visualizations API
// Continuous Ocean Raster + Current Vector Field API
// =========================================================

app.get("/api/ocean-layer", async (req, res) => {
    try {
        const { variable } = req.query;

        // =====================================================
        // 1. ALLOWED VARIABLES
        // =====================================================

        const allowedVariables = {
            temperature: "thetao",
            salinity: "so",
            seaHeight: "zos",
        };

        // =====================================================
        // 2. SPECIAL CASE: OCEAN CURRENTS
        // =====================================================

        if (variable === "currents") {

            // -------------------------------------------------
            // GET COMPLETE REGULAR GRID
            // -------------------------------------------------

            const gridResult = await pool.query(`
                SELECT
                    MIN(latitude) AS min_latitude,
                    MAX(latitude) AS max_latitude,
                    MIN(longitude) AS min_longitude,
                    MAX(longitude) AS max_longitude,
                    COUNT(DISTINCT latitude) AS height,
                    COUNT(DISTINCT longitude) AS width
                FROM ocean_grid
                WHERE latitude >= -90
                  AND latitude <= 90
                  AND longitude >= -180
                  AND longitude <= 180;
            `);

            const grid = gridResult.rows[0];

            const width =
                Number(grid.width);

            const height =
                Number(grid.height);

            const minLatitude =
                Number(grid.min_latitude);

            const maxLatitude =
                Number(grid.max_latitude);

            const minLongitude =
                Number(grid.min_longitude);

            const maxLongitude =
                Number(grid.max_longitude);

            // -------------------------------------------------
            // GRID VALIDATION
            // -------------------------------------------------

            if (
                !width ||
                !height ||
                !Number.isFinite(minLatitude) ||
                !Number.isFinite(maxLatitude) ||
                !Number.isFinite(minLongitude) ||
                !Number.isFinite(maxLongitude)
            ) {
                return res.status(404).json({
                    error: "Invalid ocean grid",
                });
            }

            // -------------------------------------------------
            // GRID SPACING
            // -------------------------------------------------

            const latStep =
                (maxLatitude - minLatitude) /
                (height - 1);

            const lonStep =
                (maxLongitude - minLongitude) /
                (width - 1);

            // -------------------------------------------------
            // FETCH CURRENT VECTORS
            // -------------------------------------------------

            const result = await pool.query(`
                SELECT
                    latitude,
                    longitude,
                    uo,
                    vo
                FROM ocean_grid
                WHERE latitude >= -90
                  AND latitude <= 90
                  AND longitude >= -180
                  AND longitude <= 180
                ORDER BY latitude ASC,
                         longitude ASC;
            `);

            // -------------------------------------------------
            // CREATE U / V RASTERS
            // -------------------------------------------------

            const uValues =
                new Array(width * height)
                    .fill(null);

            const vValues =
                new Array(width * height)
                    .fill(null);

            // -------------------------------------------------
            // CURRENT SPEED RANGE
            // -------------------------------------------------

            let minSpeed =
                Infinity;

            let maxSpeed =
                -Infinity;

            let validCount =
                0;

            // -------------------------------------------------
            // FILL RASTERS
            // -------------------------------------------------

            for (const row of result.rows) {

                const latitude =
                    Number(row.latitude);

                const longitude =
                    Number(row.longitude);

                // Ignore incomplete current vectors.

                if (
                    row.uo === null ||
                    row.vo === null
                ) {
                    continue;
                }

                const u =
                    Number(row.uo);

                const v =
                    Number(row.vo);

                if (
                    !Number.isFinite(u) ||
                    !Number.isFinite(v)
                ) {
                    continue;
                }

                // ---------------------------------------------
                // CONVERT GEOGRAPHIC COORDINATES
                // INTO RASTER INDICES
                // ---------------------------------------------

                const latIndex =
                    Math.round(
                        (latitude - minLatitude) /
                        latStep
                    );

                const lonIndex =
                    Math.round(
                        (longitude - minLongitude) /
                        lonStep
                    );

                // ---------------------------------------------
                // SAFETY CHECK
                // ---------------------------------------------

                if (
                    latIndex < 0 ||
                    latIndex >= height ||
                    lonIndex < 0 ||
                    lonIndex >= width
                ) {
                    continue;
                }

                const index =
                    latIndex * width +
                    lonIndex;

                // ---------------------------------------------
                // STORE VECTOR
                // ---------------------------------------------

                uValues[index] = u;
                vValues[index] = v;

                // ---------------------------------------------
                // CALCULATE CURRENT SPEED
                // ---------------------------------------------

                const speed =
                    Math.sqrt(
                        u * u +
                        v * v
                    );

                if (speed < minSpeed) {
                    minSpeed = speed;
                }

                if (speed > maxSpeed) {
                    maxSpeed = speed;
                }

                validCount++;
            }

            // -------------------------------------------------
            // NO DATA SAFETY CHECK
            // -------------------------------------------------

            if (validCount === 0) {
                return res.status(404).json({
                    error:
                        "No valid current data available",
                });
            }

            // -------------------------------------------------
            // ROUND METADATA
            // -------------------------------------------------

            const round = (
                number,
                decimals = 4
            ) => {
                return Number(
                    number.toFixed(decimals)
                );
            };

            // -------------------------------------------------
            // SEND CURRENT VECTOR FIELD
            // -------------------------------------------------

            return res.json({

                variable: "currents",

                width,
                height,

                minLatitude:
                    round(minLatitude),

                minLongitude:
                    round(minLongitude),

                latStep:
                    round(latStep),

                lonStep:
                    round(lonStep),

                maxLatitude:
                    round(maxLatitude),

                maxLongitude:
                    round(maxLongitude),

                minSpeed:
                    round(minSpeed),

                maxSpeed:
                    round(maxSpeed),

                count:
                    validCount,

                uValues,

                vValues,
            });
        }

        // =====================================================
        // 3. SCALAR VARIABLES
        // =====================================================

        const column =
            allowedVariables[variable];

        if (!column) {
            return res.status(400).json({
                error: "Invalid variable",

                allowedVariables: [
                    ...Object.keys(
                        allowedVariables
                    ),
                    "currents",
                ],
            });
        }

        // =====================================================
        // 4. GET COMPLETE REGULAR GRID
        // =====================================================

        const gridResult =
            await pool.query(`
                SELECT
                    MIN(latitude) AS min_latitude,
                    MAX(latitude) AS max_latitude,
                    MIN(longitude) AS min_longitude,
                    MAX(longitude) AS max_longitude,
                    COUNT(DISTINCT latitude) AS height,
                    COUNT(DISTINCT longitude) AS width
                FROM ocean_grid
                WHERE latitude >= -90
                  AND latitude <= 90
                  AND longitude >= -180
                  AND longitude <= 180;
            `);

        const grid =
            gridResult.rows[0];

        const width =
            Number(grid.width);

        const height =
            Number(grid.height);

        const minLatitude =
            Number(grid.min_latitude);

        const maxLatitude =
            Number(grid.max_latitude);

        const minLongitude =
            Number(grid.min_longitude);

        const maxLongitude =
            Number(grid.max_longitude);

        // =====================================================
        // 5. GRID VALIDATION
        // =====================================================

        if (
            !width ||
            !height ||
            !Number.isFinite(minLatitude) ||
            !Number.isFinite(maxLatitude) ||
            !Number.isFinite(minLongitude) ||
            !Number.isFinite(maxLongitude)
        ) {
            return res.status(404).json({
                error: "Invalid ocean grid",
            });
        }

        // =====================================================
        // 6. GRID SPACING
        // =====================================================

        const latStep =
            (maxLatitude - minLatitude) /
            (height - 1);

        const lonStep =
            (maxLongitude - minLongitude) /
            (width - 1);

        // =====================================================
        // 7. FETCH SCALAR DATA + OCEAN MASK
        // =====================================================
        //
        // thetao is used to determine whether a grid cell
        // represents actual ocean data.
        //
        // IMPORTANT:
        // We do NOT use zos itself as the ocean mask because
        // SSH can contain values that are not sufficient to
        // distinguish land from ocean.
        //
        // =====================================================

        const result =
            await pool.query(`
                SELECT
                    latitude,
                    longitude,
                    ${column} AS value,
                    thetao
                FROM ocean_grid
                WHERE latitude >= -90
                  AND latitude <= 90
                  AND longitude >= -180
                  AND longitude <= 180
                ORDER BY latitude ASC,
                         longitude ASC;
            `);

        // =====================================================
        // 8. CREATE RASTERS
        // =====================================================

        const totalCells =
            width * height;

        const values =
            new Array(totalCells)
                .fill(null);

        // 1 = ocean
        // 0 = land / unavailable
        const oceanMask =
            new Array(totalCells)
                .fill(0);

        let min =
            Infinity;

        let max =
            -Infinity;

        let validCount =
            0;

        let oceanCount =
            0;

        // =====================================================
        // 9. FILL RASTER + OCEAN MASK
        // =====================================================

        for (const row of result.rows) {

            const latitude =
                Number(row.latitude);

            const longitude =
                Number(row.longitude);

            // -------------------------------------------------
            // CONVERT TO RASTER INDEX
            // -------------------------------------------------

            const latIndex =
                Math.round(
                    (latitude - minLatitude) /
                    latStep
                );

            const lonIndex =
                Math.round(
                    (longitude - minLongitude) /
                    lonStep
                );

            // -------------------------------------------------
            // SAFETY CHECK
            // -------------------------------------------------

            if (
                latIndex < 0 ||
                latIndex >= height ||
                lonIndex < 0 ||
                lonIndex >= width
            ) {
                continue;
            }

            const index =
                latIndex * width +
                lonIndex;

            // -------------------------------------------------
            // OCEAN MASK
            // -------------------------------------------------
            //
            // A valid thetao value means this grid point
            // contains actual ocean model data.
            //
            // This mask is independent of the selected
            // visualization variable.
            //
            // -------------------------------------------------

            if (
                row.thetao !== null &&
                Number.isFinite(
                    Number(row.thetao)
                )
            ) {
                oceanMask[index] = 1;
                oceanCount++;
            }

            // -------------------------------------------------
            // SCALAR VALUE
            // -------------------------------------------------

            if (row.value === null) {
                continue;
            }

            const value =
                Number(row.value);

            if (!Number.isFinite(value)) {
                continue;
            }

            values[index] =
                value;

            validCount++;

            // -------------------------------------------------
            // VALUE RANGE
            // -------------------------------------------------

            if (value < min) {
                min = value;
            }

            if (value > max) {
                max = value;
            }
        }

        // =====================================================
        // 10. NO DATA SAFETY CHECK
        // =====================================================

        if (validCount === 0) {
            return res.status(404).json({
                error:
                    `No valid ${variable} data available`,
            });
        }

        // =====================================================
        // 11. ROUND METADATA
        // =====================================================

        const round = (
            number,
            decimals = 4
        ) => {
            return Number(
                number.toFixed(decimals)
            );
        };

        // =====================================================
        // 12. SEND SCALAR RASTER
        // =====================================================

        return res.json({

            variable,

            // Raster dimensions
            width,
            height,

            // Geographic origin
            minLatitude:
                round(minLatitude),

            minLongitude:
                round(minLongitude),

            // Grid spacing
            latStep:
                round(latStep),

            lonStep:
                round(lonStep),

            // Geographic extent
            maxLatitude:
                round(maxLatitude),

            maxLongitude:
                round(maxLongitude),

            // Scientific value range
            min,
            max,

            // Number of valid scalar cells
            count:
                validCount,

            // Number of ocean cells
            oceanCount,

            // Scalar raster
            values,

            // -------------------------------------------------
            // OCEAN MASK
            // -------------------------------------------------
            //
            // 1 = ocean
            // 0 = land / unavailable
            //
            // SeaSurfaceTowers.jsx uses this to ensure
            // SSH terrain is rendered ONLY over ocean.
            //
            oceanMask,
        });

    } catch (error) {

        console.error(
            "Ocean raster error:",
            error
        );

        return res.status(500).json({
            error:
                "Failed to fetch ocean raster data",
        });
    }
});

const PORT = 5001;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

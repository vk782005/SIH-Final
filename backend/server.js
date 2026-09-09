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

/* ==========================================================================
   OCEAN-X — backend client

   Every Explore request goes through this file. The endpoints and response
   shapes below are exactly what the existing Express + PostGIS service
   already serves. Nothing here invents server behaviour.

     GET /api/ocean-data?latitude&longitude
       -> { hasOceanData, message, time, latitude, longitude, depth,
            bottomt, mlotst, so, thetao, uo, vo, zos, siconc, sithick,
            usi, vsi }

     GET /api/ocean-layer?variable=temperature|salinity|seaHeight|currents
       scalar   -> { variable, width, height, minLatitude, minLongitude,
                     latStep, lonStep, maxLatitude, maxLongitude,
                     min, max, count, oceanCount, values, oceanMask }
       currents -> { variable, width, height, minLatitude, minLongitude,
                     latStep, lonStep, maxLatitude, maxLongitude,
                     minSpeed, maxSpeed, count, uValues, vValues }
   ========================================================================== */

export const API_BASE =
    import.meta.env?.VITE_API_BASE ?? "http://localhost:5001";

/** Thrown when the server answered but reported a problem, or never answered. */
export class ApiError extends Error {
    constructor(message, { status, kind = "error" } = {}) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.kind = kind;
    }
}

async function getJson(path, { signal } = {}) {
    let response;

    try {
        response = await fetch(`${API_BASE}${path}`, { signal });
    } catch (error) {
        if (error.name === "AbortError") throw error;
        throw new ApiError("Ocean data service unavailable.", {
            kind: "offline",
        });
    }

    let payload;

    try {
        payload = await response.json();
    } catch {
        payload = null;
    }

    if (!response.ok) {
        throw new ApiError(
            payload?.message || payload?.error || "The ocean model request failed.",
            { status: response.status },
        );
    }

    return payload;
}

/**
 * Point query. Resolves to { kind: "data" | "empty" } so callers never have
 * to guess whether an empty body means "land" or "broken".
 */
export async function fetchOceanPoint({ latitude, longitude }, options = {}) {
    const result = await getJson(
        `/api/ocean-data?latitude=${latitude}&longitude=${longitude}`,
        options,
    );

    if (!result || result.hasOceanData === false) {
        return {
            kind: "empty",
            message:
                result?.message || "No ocean data available at this location.",
        };
    }

    return { kind: "data", data: result };
}


async function postJson(path, body, { signal } = {}) {
    let response;

    try {
        response = await fetch(`${API_BASE}${path}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
            signal,
        });
    } catch (error) {
        if (error.name === "AbortError") throw error;
        throw new ApiError("Ocean data service unavailable.", {
            kind: "offline",
        });
    }

    let payload;

    try {
        payload = await response.json();
    } catch {
        payload = null;
    }

    if (!response.ok) {
        throw new ApiError(
            payload?.message ||
                payload?.error ||
                "The ocean model request failed.",
            { status: response.status },
        );
    }

    return payload;
}

/** Full-globe raster for one variable. */
export async function fetchOceanLayer(variable, options = {}) {
    const result = await getJson(
        `/api/ocean-layer?variable=${encodeURIComponent(variable)}`,
        options,
    );

    if (!result || (!result.values && !result.uValues)) {
        throw new ApiError(`No raster returned for "${variable}".`, {
            kind: "empty",
        });
    }

    return result;
}


/**
 * Regional polygon analysis. The polygon is evaluated by the backend/PostGIS
 * service so database aggregation remains the source of truth.
 */
export async function fetchOceanAreaAnalysis(points, options = {}) {
    if (!Array.isArray(points) || points.length < 3) {
        throw new ApiError(
            "A polygon with at least three points is required.",
            { kind: "validation" },
        );
    }

    return postJson(
        "/api/ocean-area-analysis",
        {
            polygon: points.map(({ latitude, longitude }) => ({
                latitude: Number(latitude),
                longitude: Number(longitude),
            })),
        },
        options,
    );
}

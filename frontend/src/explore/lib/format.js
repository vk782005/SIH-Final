/* ==========================================================================
   OCEAN-X — display formatting
   ========================================================================== */

const EM_DASH = "—";

/** 30.2000° N — the hemisphere letter prevents a leading-minus misread. */
export function formatLatitude(value, decimals = 4) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return EM_DASH;
    return `${Math.abs(numeric).toFixed(decimals)}° ${numeric >= 0 ? "N" : "S"}`;
}

export function formatLongitude(value, decimals = 4) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return EM_DASH;
    return `${Math.abs(numeric).toFixed(decimals)}° ${numeric >= 0 ? "E" : "W"}`;
}

export function formatNumber(value, decimals = 2) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return EM_DASH;
    return numeric.toFixed(decimals);
}

export function isPresent(value) {
    return value !== null && value !== undefined && Number.isFinite(Number(value));
}

/** Speed and compass bearing derived from the model's u/v components. */
export function deriveCurrent(uo, vo) {
    const u = Number(uo);
    const v = Number(vo);

    if (!Number.isFinite(u) || !Number.isFinite(v)) return null;

    const speed = Math.hypot(u, v);

    let bearing = (Math.atan2(u, v) * 180) / Math.PI;
    if (bearing < 0) bearing += 360;

    const compass = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][
        Math.round(bearing / 45) % 8
    ];

    return { speed, bearing, compass };
}

/** Dataset timestamps arrive in a few shapes; render whatever we can. */
export function formatTimestamp(value) {
    if (!value) return null;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

/** Decimal places implied by a step size, e.g. 0.001 -> 3. */
export function decimalsForStep(step) {
    const text = String(step);
    const dot = text.indexOf(".");
    return dot === -1 ? 0 : text.length - dot - 1;
}

/** Approximate area of a lat/lon rectangle, in square kilometres. */
export function rectangleAreaKm2({ west, south, east, north }) {
    const R = 6371.0088;
    const toRad = (deg) => (deg * Math.PI) / 180;

    const lonSpan = Math.abs(east - west);
    if (lonSpan === 0) return 0;

    return Math.abs(
        R * R * toRad(lonSpan) * (Math.sin(toRad(north)) - Math.sin(toRad(south))),
    );
}

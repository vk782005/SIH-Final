import {
    FactRow,
    LoadingRow,
    Metric,
    StateMessage,
} from "../ui/Primitives.jsx";

import {
    deriveCurrent,
    formatLatitude,
    formatLongitude,
    formatNumber,
    formatTimestamp,
    isPresent,
} from "../lib/format.js";

export default function PointDataReadout({ pointStatus, oceanData }) {
    if (pointStatus?.state === "loading") {
        return <LoadingRow>Querying ocean model…</LoadingRow>;
    }

    if (pointStatus?.state === "empty") {
        return (
            <StateMessage
                tone="muted"
                title="No ocean data here"
                body={pointStatus.message}
            />
        );
    }

    if (pointStatus?.state === "error") {
        return (
            <StateMessage
                tone="danger"
                title="Could not reach the model"
                body={pointStatus.message}
            />
        );
    }

    if (!oceanData) return null;

    const current = deriveCurrent(oceanData.uo, oceanData.vo);
    const timestamp = formatTimestamp(oceanData.time);

    return (
        <div className="ox-readout">
            {isPresent(oceanData.thetao) && (
                <Metric
                    hero
                    label="Sea temperature"
                    value={formatNumber(oceanData.thetao, 1)}
                    unit="°C"
                />
            )}

            <div className="ox-metric-grid">
                {isPresent(oceanData.so) && (
                    <Metric
                        label="Salinity"
                        value={formatNumber(oceanData.so, 2)}
                        unit="PSU"
                    />
                )}

                {current && (
                    <Metric
                        label="Current"
                        value={formatNumber(current.speed, 2)}
                        unit={`m/s ${current.compass}`}
                    />
                )}

                {isPresent(oceanData.zos) && (
                    <Metric
                        label="Sea height"
                        value={formatNumber(oceanData.zos, 2)}
                        unit="m"
                    />
                )}
            </div>

            <div className="ox-facts">
                <FactRow
                    label="Nearest grid cell"
                    value={`${formatLatitude(oceanData.latitude, 2)} · ${formatLongitude(
                        oceanData.longitude,
                        2,
                    )}`}
                />
                {timestamp && <FactRow label="Model time" value={timestamp} />}
            </div>
        </div>
    );
}

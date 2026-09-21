import ContextPanel from "./ContextPanel.jsx";

import { FactRow, Metric, StateMessage, UnavailableNote } from "../ui/Primitives.jsx";
import { IconAnalysis } from "../ui/Icons.jsx";

import {
    deriveCurrent,
    formatLatitude,
    formatLongitude,
    formatNumber,
    formatTimestamp,
    isPresent,
} from "../lib/format.js";

import { getLegendRange } from "../lib/layers.js";

/* ==========================================================================
   OCEAN-X — analysis panel

   Two honest sections.

   "Point record" lists the fields /api/ocean-data returned for the selected
   cell, skipping anything the model reported as null.

   "Layer statistics" reports the min, max and valid-cell counts the raster
   endpoint already computes server-side. Nothing is recomputed in the
   browser and nothing is estimated.
   ========================================================================== */

const POINT_FIELDS = [
    { key: "thetao", label: "Temperature", unit: "°C", decimals: 2 },
    { key: "so", label: "Salinity", unit: "PSU", decimals: 3 },
    { key: "zos", label: "Sea surface height", unit: "m", decimals: 3 },
    { key: "mlotst", label: "Mixed layer thickness", unit: "m", decimals: 1 },
    { key: "bottomt", label: "Sea floor temperature", unit: "°C", decimals: 2 },
    { key: "siconc", label: "Sea ice concentration", unit: "", decimals: 3 },
    { key: "sithick", label: "Sea ice thickness", unit: "m", decimals: 3 },
];

export default function AnalysisContextPanel({
    layer,
    raster,
    oceanData,
    selectedLocation,
    onClose,
}) {
    const range = getLegendRange(layer, raster);
    const current = oceanData ? deriveCurrent(oceanData.uo, oceanData.vo) : null;

    const present = oceanData
        ? POINT_FIELDS.filter((field) => isPresent(oceanData[field.key]))
        : [];

    return (
        <ContextPanel
            side="left"
            kicker="Analysis"
            title="Statistics"
            icon={<IconAnalysis />}
            onClose={onClose}
        >
            <section className="ox-section">
                <h3 className="ox-section__title">Point record</h3>

                {!selectedLocation || !oceanData ? (
                    <StateMessage
                        tone="muted"
                        title="No point selected"
                        body="Select a location to read every field the model stores for that cell."
                    />
                ) : (
                    <>
                        <div className="ox-facts">
                            <FactRow
                                label="Grid cell"
                                value={`${formatLatitude(oceanData.latitude, 2)} · ${formatLongitude(
                                    oceanData.longitude,
                                    2,
                                )}`}
                            />

                            {formatTimestamp(oceanData.time) && (
                                <FactRow
                                    label="Model time"
                                    value={formatTimestamp(oceanData.time)}
                                />
                            )}

                            {present.map((field) => (
                                <FactRow
                                    key={field.key}
                                    label={field.label}
                                    value={`${formatNumber(
                                        oceanData[field.key],
                                        field.decimals,
                                    )}${field.unit ? ` ${field.unit}` : ""}`}
                                />
                            ))}

                            {current && (
                                <FactRow
                                    label="Current"
                                    value={`${formatNumber(current.speed, 3)} m/s · ${formatNumber(
                                        current.bearing,
                                        0,
                                    )}° ${current.compass}`}
                                />
                            )}
                        </div>

                        {present.length === 0 && !current && (
                            <p className="ox-panel__lede">
                                This cell carries no populated fields.
                            </p>
                        )}
                    </>
                )}
            </section>

            <section className="ox-section">
                <h3 className="ox-section__title">Layer statistics</h3>

                {!layer || !raster ? (
                    <StateMessage
                        tone="muted"
                        title="No layer loaded"
                        body="Activate a layer to see the range the server computed for its raster."
                    />
                ) : (
                    <>
                        {range && (
                            <div className="ox-metric-grid">
                                <Metric
                                    label={`${layer.short} min`}
                                    value={formatNumber(range.min, layer.decimals)}
                                    unit={layer.unit}
                                />
                                <Metric
                                    label={`${layer.short} max`}
                                    value={formatNumber(range.max, layer.decimals)}
                                    unit={layer.unit}
                                />
                            </div>
                        )}

                        <div className="ox-facts">
                            <FactRow
                                label="Raster grid"
                                value={`${raster.width} × ${raster.height}`}
                            />
                            <FactRow
                                label="Valid cells"
                                value={Number(raster.count ?? 0).toLocaleString()}
                            />
                            {raster.oceanCount !== undefined && (
                                <FactRow
                                    label="Ocean cells"
                                    value={Number(raster.oceanCount).toLocaleString()}
                                />
                            )}
                        </div>
                    </>
                )}
            </section>

            <UnavailableNote title="Comparison tools not available">
                Model-versus-observation comparison needs an in-situ endpoint,
                and regional aggregates need an area query. Neither exists yet,
                so neither is approximated here.
            </UnavailableNote>
        </ContextPanel>
    );
}

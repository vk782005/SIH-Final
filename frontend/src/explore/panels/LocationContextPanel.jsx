import ContextPanel from "./ContextPanel.jsx";
import PointDataReadout from "./PointDataReadout.jsx";

import {
    FactRow,
    StateMessage,
} from "../ui/Primitives.jsx";

import { IconArea, IconCrosshair, IconPin } from "../ui/Icons.jsx";

import { formatLatitude, formatLongitude, formatNumber } from "../lib/format.js";

export default function LocationContextPanel({
    selectionMode,
    selectedLocation,
    selectedArea,
    oceanData,
    pointStatus,
    areaAnalysis,
    areaAnalysisStatus,
    onAnalyzeArea,
    onUndoAreaPoint,
    onClearArea,
    onClose,
}) {
    return (
        <ContextPanel
            side="right"
            kicker="Location"
            title={
                selectionMode === "area"
                    ? "Area selection"
                    : selectionMode === "argo"
                      ? "Argo / float"
                      : "Selected point"
            }
            icon={<IconCrosshair />}
            onClose={onClose}
        >
            {selectionMode === "area" ? (
                <AreaBody
                    area={selectedArea}
                    analysis={areaAnalysis}
                    analysisStatus={areaAnalysisStatus}
                    onAnalyze={onAnalyzeArea}
                    onUndo={onUndoAreaPoint}
                    onClear={onClearArea}
                />
            ) : (
                <PointBody
                    selectionMode={selectionMode}
                    selectedLocation={selectedLocation}
                    oceanData={oceanData}
                    pointStatus={pointStatus}
                />
            )}
        </ContextPanel>
    );
}

function PointBody({ selectionMode, selectedLocation, oceanData, pointStatus }) {
    if (!selectedLocation) {
        return (
            <StateMessage
                icon={<IconPin />}
                title={
                    selectionMode === "argo"
                        ? "Select an Argo / float"
                        : "Select a location"
                }
                body={
                    selectionMode === "argo"
                        ? "Choose an available float or observation point on the globe."
                        : "Click anywhere on the globe to inspect the ocean model."
                }
            />
        );
    }

    return (
        <>
            <div className="ox-coords">
                <div className="ox-coords__item">
                    <span className="ox-coords__label">Latitude</span>
                    <span className="ox-coords__value">
                        {formatLatitude(selectedLocation.latitude)}
                    </span>
                </div>

                <div className="ox-coords__item">
                    <span className="ox-coords__label">Longitude</span>
                    <span className="ox-coords__value">
                        {formatLongitude(selectedLocation.longitude)}
                    </span>
                </div>
            </div>

            <PointDataReadout
                pointStatus={pointStatus}
                oceanData={oceanData}
            />
        </>
    );
}

function AreaBody({
    area,
    analysis,
    analysisStatus,
    onAnalyze,
    onUndo,
    onClear,
}) {
    const points = area?.points ?? [];
    const canAnalyze = points.length >= 3;
    const areaKm2 = Number(analysis?.areaKm2 ?? area?.areaKm2 ?? 0);
    const displayArea =
        areaKm2 > 1_000_000
            ? `${formatNumber(areaKm2 / 1_000_000, 2)}`
            : formatNumber(areaKm2, 0);

    if (!points.length) {
        return (
            <StateMessage
                icon={<IconArea />}
                title="Build a custom area"
                body="Click the globe to add vertices. Keep adding points until the region you want to study is outlined."
            />
        );
    }

    const isLoading = analysisStatus?.state === "loading";
    const isReady = analysisStatus?.state === "ready" && Boolean(analysis);

    return (
        <div className="ox-area-readout">
            <div className="ox-area-overview">
                <div className="ox-area-overview__eyebrow">
                    <span className="ox-area-overview__dot" />
                    {isReady ? "Analysis complete" : "Custom region"}
                </div>

                <div className="ox-area-overview__value">
                    <span>{displayArea}</span>
                    <small>{areaKm2 > 1_000_000 ? "million km²" : "km²"}</small>
                </div>

                <div className="ox-area-overview__meta">
                    <span>
                        {points.length}{" "}
                        {points.length === 1 ? "vertex" : "vertices"}
                    </span>

                    <span>
                        {isReady
                            ? `${Number(analysis.cellsAnalyzed ?? 0).toLocaleString()} cells`
                            : canAnalyze
                              ? "Ready to analyze"
                              : `${3 - points.length} more needed`}
                    </span>
                </div>
            </div>

            <div className="ox-area-actions">
                <button
                    type="button"
                    className="ox-button ox-button--ghost"
                    onClick={onUndo}
                    disabled={!points.length}
                >
                    Undo point
                </button>

                <button
                    type="button"
                    className="ox-button ox-button--ghost"
                    onClick={onClear}
                    disabled={!points.length}
                >
                    Clear
                </button>
            </div>

            {!canAnalyze && (
                <div className="ox-area-helper">
                    <div className="ox-area-helper__steps">
                        {[1, 2, 3].map((step) => (
                            <span
                                key={step}
                                className={
                                    points.length >= step ? "is-done" : ""
                                }
                            >
                                {step}
                            </span>
                        ))}
                    </div>

                    <div>
                        <strong>Keep drawing</strong>
                        <p>
                            Add at least three points to define the region.
                            Any polygon shape is supported.
                        </p>
                    </div>
                </div>
            )}

            {canAnalyze && (
                <button
                    type="button"
                    className="ox-area-analyze"
                    onClick={onAnalyze}
                    disabled={isLoading}
                >
                    <span className="ox-area-analyze__icon" aria-hidden="true">
                        <svg viewBox="0 0 20 20" width="18" height="18">
                            <path
                                d="M4 15.5 7.5 12l2.4 2.2L16 8"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M14 8h2v2"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </span>

                    <span>
                        <strong>
                            {isLoading
                                ? "Analyzing region…"
                                : isReady
                                  ? "Re-analyze region"
                                  : "Analyze selected area"}
                        </strong>
                        <small>
                            {isLoading
                                ? "Running a PostGIS regional query"
                                : "Calculate average ocean conditions"}
                        </small>
                    </span>

                    <span className="ox-area-analyze__arrow" aria-hidden="true">
                        →
                    </span>
                </button>
            )}

            {analysisStatus?.state === "invalid" && (
                <StateMessage
                    tone="muted"
                    title="More points needed"
                    body={analysisStatus.message}
                />
            )}

            {analysisStatus?.state === "error" && (
                <StateMessage
                    tone="danger"
                    title="Area analysis failed"
                    body={analysisStatus.message}
                />
            )}

            {analysisStatus?.state === "empty" && (
                <StateMessage
                    tone="muted"
                    title="No valid ocean cells"
                    body={analysisStatus.message}
                />
            )}

            {isReady && <AreaAnalysisResult analysis={analysis} />}
        </div>
    );
}

function AreaAnalysisResult({ analysis }) {
    const temperature = analysis?.metrics?.temperature;
    const salinity = analysis?.metrics?.salinity;
    const currents = analysis?.metrics?.currents;
    const seaHeight = analysis?.metrics?.seaHeight;
    const coverage = analysis?.coverage ?? {};

    const metrics = [
        temperature !== null && temperature !== undefined && {
            key: "temperature",
            label: "Sea temperature",
            value: formatNumber(temperature, 2),
            unit: "°C",
            accent: "warm",
        },
        salinity !== null && salinity !== undefined && {
            key: "salinity",
            label: "Salinity",
            value: formatNumber(salinity, 3),
            unit: "PSU",
            accent: "cool",
        },
        currents && {
            key: "currents",
            label: "Current",
            value: formatNumber(currents.speed, 3),
            unit: `m/s ${currents.compass ?? ""}`.trim(),
            accent: "flow",
        },
        seaHeight !== null && seaHeight !== undefined && {
            key: "seaHeight",
            label: "Sea height",
            value: formatNumber(seaHeight, 3),
            unit: "m",
            accent: "height",
        },
    ].filter(Boolean);

    return (
        <section className="ox-area-results" aria-label="Regional analysis results">
            <div className="ox-area-results__head">
                <div>
                    <span className="ox-panel__kicker">Regional analysis</span>
                    <h3>Average conditions</h3>
                </div>

                <span className="ox-area-results__verified">
                    <span />
                    PostGIS
                </span>
            </div>

            <div className="ox-area-results__grid">
                {metrics.map((metric) => (
                    <div
                        className={`ox-area-stat ox-area-stat--${metric.accent}`}
                        key={metric.key}
                    >
                        <span className="ox-area-stat__label">
                            {metric.label}
                        </span>

                        <span className="ox-area-stat__value">
                            {metric.value}
                            <small>{metric.unit}</small>
                        </span>
                    </div>
                ))}
            </div>

            <div className="ox-area-results__meta">
                <div className="ox-area-results__metahead">
                    <span>Sample coverage</span>
                    <strong>
                        {Number(analysis.cellsAnalyzed ?? 0).toLocaleString()}{" "}
                        ocean cells
                    </strong>
                </div>

                <div className="ox-area-coverage">
                    <CoverageBar
                        label="Temperature"
                        count={coverage.temperatureCells}
                        total={analysis.cellsAnalyzed}
                    />
                    <CoverageBar
                        label="Salinity"
                        count={coverage.salinityCells}
                        total={analysis.cellsAnalyzed}
                    />
                    <CoverageBar
                        label="Currents"
                        count={coverage.currentCells}
                        total={analysis.cellsAnalyzed}
                    />
                    <CoverageBar
                        label="Sea height"
                        count={coverage.seaHeightCells}
                        total={analysis.cellsAnalyzed}
                    />
                </div>
            </div>

            <div className="ox-area-results__facts">
                <FactRow
                    label="Region area"
                    value={`${formatNumber(Number(analysis.areaKm2 ?? 0), 0)} km²`}
                />
                <FactRow
                    label="Vertices"
                    value={String(analysis.vertices ?? "—")}
                />

                {currents && (
                    <>
                        <FactRow
                            label="Mean eastward flow"
                            value={`${formatNumber(currents.meanU ?? currents.u, 3)} m/s`}
                        />
                        <FactRow
                            label="Mean northward flow"
                            value={`${formatNumber(currents.meanV ?? currents.v, 3)} m/s`}
                        />
                    </>
                )}

                {analysis.modelTime && (
                    <FactRow
                        label="Model time"
                        value={String(analysis.modelTime)}
                    />
                )}
            </div>
        </section>
    );
}

function CoverageBar({ label, count, total }) {
    const safeCount = Number(count ?? 0);
    const safeTotal = Number(total ?? 0);
    const percent =
        safeTotal > 0
            ? Math.min(100, Math.max(0, (safeCount / safeTotal) * 100))
            : 0;

    return (
        <div className="ox-area-coverage__row">
            <div className="ox-area-coverage__label">
                <span>{label}</span>
                <span>{safeCount.toLocaleString()}</span>
            </div>

            <div className="ox-area-coverage__track">
                <span style={{ width: `${percent}%` }} />
            </div>
        </div>
    );
}

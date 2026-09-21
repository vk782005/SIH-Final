import {
    IconClock,
    IconExpand,
    IconHome,
    IconMinus,
    IconPlus,
} from "../ui/Icons.jsx";

import { formatNumber, formatTimestamp } from "../lib/format.js";
import { getLegendRange, getPalette, stopsGradient } from "../lib/layers.js";

/* ==========================================================================
   OCEAN-X — bottom dock

   Answers "what variable am I looking at, and what do the colours mean".
   Deliberately one line tall. Globe navigation lives at the right end so it
   never floats loose over the scene.
   ========================================================================== */

export default function BottomDataDock({
    collapsed,
    onToggleCollapsed,
    layer,
    raster,
    settings,
    oceanData,
    globeApi,
}) {
    if (collapsed) {
        return (
            <div className="ox-dock ox-dock--collapsed">
                <button
                    type="button"
                    className="ox-dock__handle"
                    onClick={onToggleCollapsed}
                    aria-expanded="false"
                >
                    <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
                        <path
                            d="M3.5 10 8 5.5 12.5 10"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    {layer ? layer.label : "Controls"}
                </button>
            </div>
        );
    }

    const range = getLegendRange(layer, raster);
    const timestamp = formatTimestamp(oceanData?.time);
    const layerSettings = layer ? settings[layer.id] ?? {} : {};
    const palette = layerSettings.palette ?? layer?.defaultPalette ?? null;
    const paletteStops =
        Array.isArray(layerSettings.paletteStops) && layerSettings.paletteStops.length >= 2
            ? layerSettings.paletteStops
            : palette && getPalette(palette)?.stops
              ? getPalette(palette).stops
              : null;
    const domain = layerSettings.domain ?? null;
    const shown = domain ?? range;

    return (
        <div className="ox-dock">
            <button
                type="button"
                className="ox-dock__collapse"
                onClick={onToggleCollapsed}
                aria-expanded="true"
                aria-label="Collapse controls"
                title="Collapse controls"
            >
                <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
                    <path
                        d="M3.5 6 8 10.5 12.5 6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>

            {layer && shown ? (
                <div className="ox-legend">
                    <div className="ox-legend__heading">
                        <span className="ox-legend__name">
                            <strong>{layer.label}</strong>
                            <span className="ox-legend__unit">{layer.unit}</span>
                        </span>

                        <span className="ox-legend__range-label">
                            {domain ? "Custom data range" : "Dataset range"}
                        </span>
                    </div>

                    <div className="ox-legend__scale">
                        <div className="ox-legend__bar-wrap">
                            <span
                                className="ox-legend__bar"
                                style={{
                                    backgroundImage:
                                        layer.kind === "vector"
                                            ? "linear-gradient(90deg, rgba(120,160,255,.25), rgba(210,235,255,.95))"
                                            : stopsGradient(paletteStops),
                                }}
                            />

                            <span className="ox-legend__tick ox-legend__tick--low" />
                            <span className="ox-legend__tick ox-legend__tick--mid" />
                            <span className="ox-legend__tick ox-legend__tick--high" />
                        </div>

                        <div className="ox-legend__labels">
                            <span>
                                <strong>{formatNumber(shown.min, layer.decimals)}</strong>
                                <small>Low</small>
                            </span>

                            <span>
                                <strong>
                                    {formatNumber(
                                        (Number(shown.min) + Number(shown.max)) / 2,
                                        layer.decimals,
                                    )}
                                </strong>
                                <small>Mid</small>
                            </span>

                            <span>
                                <strong>{formatNumber(shown.max, layer.decimals)}</strong>
                                <small>High</small>
                            </span>
                        </div>
                    </div>

                    {domain && (
                        <span className="ox-chip ox-legend__chip">
                            Custom range
                        </span>
                    )}
                </div>
            ) : (
                <p className="ox-dock__empty">
                    {layer
                        ? "Loading raster…"
                        : "No layer active — open Layers to choose one."}
                </p>
            )}

            <span className="ox-dock__rule" aria-hidden="true" />

            <div className="ox-dock__meta">
                {timestamp ? (
                    <span className="ox-dock__time">
                        <IconClock />
                        {timestamp}
                    </span>
                ) : (
                    <span className="ox-dock__time ox-dock__time--muted">
                        <IconClock />
                        PostGIS connected
                    </span>
                )}
            </div>

            <span className="ox-dock__rule" aria-hidden="true" />

            <div className="ox-dock__nav">
                <button
                    type="button"
                    onClick={() => globeApi?.zoomIn()}
                    disabled={!globeApi}
                    title="Zoom in"
                    aria-label="Zoom in"
                >
                    <IconPlus />
                </button>

                <button
                    type="button"
                    onClick={() => globeApi?.zoomOut()}
                    disabled={!globeApi}
                    title="Zoom out"
                    aria-label="Zoom out"
                >
                    <IconMinus />
                </button>

                <button
                    type="button"
                    onClick={() => globeApi?.resetView()}
                    disabled={!globeApi}
                    title="Reset view"
                    aria-label="Reset view"
                >
                    <IconHome />
                </button>

                <button
                    type="button"
                    onClick={() => {
                        if (document.fullscreenElement) {
                            document.exitFullscreen?.();
                        } else {
                            document.documentElement.requestFullscreen?.();
                        }
                    }}
                    title="Full screen"
                    aria-label="Full screen"
                >
                    <IconExpand />
                </button>
            </div>
        </div>
    );
}

import ContextPanel from "./ContextPanel.jsx";

import {
    FactRow,
    LoadingRow,
    Slider,
    StateMessage,
    Toggle,
    UnavailableNote,
} from "../ui/Primitives.jsx";

import { IconLayers } from "../ui/Icons.jsx";
import { formatNumber } from "../lib/format.js";
import { getLegendRange, paletteGradient } from "../lib/layers.js";

/* ==========================================================================
   OCEAN-X — layer panel

   Appears only once a layer is chosen, and shows controls for that one
   layer. Range figures come straight from the raster the backend returned;
   when a raster hasn't arrived the range is simply absent.
   ========================================================================== */

export default function LayerContextPanel({
    layer,
    raster,
    loading,
    error,
    settings,
    onSettingsChange,
    onRetry,
    onClose,
}) {
    if (!layer) return null;

    const range = getLegendRange(layer, raster);
    const layerSettings = settings[layer.id] ?? {};

    const update = (patch) =>
        onSettingsChange(layer.id, { ...layerSettings, ...patch });

    return (
        <ContextPanel
            side="left"
            kicker="Active layer"
            title={layer.label}
            icon={<IconLayers />}
            onClose={onClose}
        >
            <p className="ox-panel__lede">{layer.description}</p>

            {layer.status === "planned" && (
                <UnavailableNote title="Backend connection pending">
                    This layer is available in the Explore interface, but its
                    data endpoint has not been connected yet. It can be activated
                    here as soon as the backend starts serving it.
                </UnavailableNote>
            )}

            {loading && <LoadingRow>Loading {layer.short} raster…</LoadingRow>}

            {error && (
                <StateMessage
                    tone="danger"
                    title="Layer could not load"
                    body={error}
                    action={
                        <button
                            type="button"
                            className="ox-button ox-button--ghost"
                            onClick={onRetry}
                        >
                            Try again
                        </button>
                    }
                />
            )}

            {range && (
                <div className="ox-rangecard">
                    <span className="ox-rangecard__label">
                        Current range
                        <span className="ox-rangecard__unit">{layer.unit}</span>
                    </span>

                    <div
                        className="ox-rangecard__bar"
                        style={{
                            backgroundImage:
                                layer.kind === "vector"
                                    ? "linear-gradient(90deg, rgba(120,160,255,.25), rgba(210,235,255,.95))"
                                    : paletteGradient(
                                          layerSettings.palette ??
                                              layer.defaultPalette,
                                      ),
                        }}
                    />

                    <div className="ox-rangecard__ends">
                        <span>{formatNumber(range.min, layer.decimals)}</span>
                        <span>{formatNumber(range.max, layer.decimals)}</span>
                    </div>
                </div>
            )}

            <Slider
                label="Opacity"
                value={Math.round((layerSettings.opacity ?? 1) * 100)}
                display={`${Math.round((layerSettings.opacity ?? 1) * 100)}%`}
                min={10}
                max={100}
                onChange={(value) => update({ opacity: value / 100 })}
            />

            {layer.kind === "vector" ? (
                <>
                    <div className="ox-setting">
                        <span className="ox-setting__copy">
                            <span className="ox-setting__label">
                                Flow animation
                            </span>
                            <span className="ox-setting__hint">
                                Comet trails follow the velocity field
                            </span>
                        </span>
                        <Toggle
                            label="Flow animation"
                            checked={layerSettings.flowVisible !== false}
                            onChange={(next) => update({ flowVisible: next })}
                        />
                    </div>

                    {raster && (
                        <div className="ox-facts">
                            <FactRow
                                label="Peak speed"
                                value={`${formatNumber(raster.maxSpeed, 2)} m/s`}
                            />
                            <FactRow
                                label="Vectors"
                                value={Number(raster.count ?? 0).toLocaleString()}
                            />
                        </div>
                    )}
                </>
            ) : (
                raster && (
                    <div className="ox-facts">
                        <FactRow
                            label="Grid"
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
                )
            )}

            {layer.id === "seaHeight" && (
                <UnavailableNote title="Experimental rendering">
                    Sea surface height draws through the terrain-relief
                    renderer. The values are real model output; the vertical
                    relief is exaggerated for legibility, not to scale.
                </UnavailableNote>
            )}
        </ContextPanel>
    );
}

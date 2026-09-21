import { useEffect, useMemo, useState } from "react";

import ContextPanel from "./ContextPanel.jsx";

import { StateMessage, UnavailableNote } from "../ui/Primitives.jsx";
import { IconPalette } from "../ui/Icons.jsx";
import { formatNumber } from "../lib/format.js";
import {
    PALETTES,
    getPalette,
    getLegendRange,
    paletteGradient,
    stopsGradient,
} from "../lib/layers.js";

const CUSTOM_DEFAULTS = {
    low: "#0B3C8C",
    mid: "#20C7B3",
    high: "#F53F2F",
};

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

function hexToRgb(hex) {
    const clean = hex.replace("#", "");
    return [
        parseInt(clean.slice(0, 2), 16) / 255,
        parseInt(clean.slice(2, 4), 16) / 255,
        parseInt(clean.slice(4, 6), 16) / 255,
    ];
}

function rgbToHex([r, g, b]) {
    return `#${[r, g, b]
        .map((channel) =>
            Math.round(Math.max(0, Math.min(1, channel)) * 255)
                .toString(16)
                .padStart(2, "0"),
        )
        .join("")
        .toUpperCase()}`;
}

function stopsToCustomColors(stops) {
    if (!Array.isArray(stops) || stops.length < 2) {
        return { ...CUSTOM_DEFAULTS };
    }

    const pick = (position) => {
        let nearest = stops[0];

        for (const stop of stops) {
            if (Math.abs(stop[0] - position) < Math.abs(nearest[0] - position)) {
                nearest = stop;
            }
        }

        return rgbToHex(nearest[1]);
    };

    return {
        low: pick(0),
        mid: pick(0.5),
        high: pick(1),
    };
}

function customColorsToStops(colors) {
    return [
        [0, hexToRgb(colors.low)],
        [0.5, hexToRgb(colors.mid)],
        [1, hexToRgb(colors.high)],
    ];
}

function isValidHex(value) {
    return HEX_RE.test(value);
}

function rangeKey(layer, dataRange) {
    return [
        layer?.id ?? "none",
        dataRange?.min ?? "",
        dataRange?.max ?? "",
    ].join(":");
}

function paletteKey(layer, layerSettings) {
    return [
        layer?.id ?? "none",
        layerSettings?.palette ?? "",
        JSON.stringify(layerSettings?.paletteStops ?? []),
        JSON.stringify(layerSettings?.customColors ?? {}),
    ].join(":");
}

export default function ColorContextPanel({
    layer,
    raster,
    settings,
    onSettingsChange,
    onClose,
}) {
    const layerSettings = layer ? settings[layer.id] ?? {} : {};
    const dataRange = getLegendRange(layer, raster);

    const [customOpen, setCustomOpen] = useState(
        layerSettings.palette === "custom",
    );
    const [customColors, setCustomColors] = useState(
        layerSettings.customColors ??
            stopsToCustomColors(
                layer?.defaultPalette
                    ? getPalette(layer.defaultPalette).stops
                    : null,
            ),
    );

    const [minInput, setMinInput] = useState(
        layerSettings.domain
            ? String(formatNumber(layerSettings.domain.min, 4))
            : dataRange
              ? String(formatNumber(dataRange.min, 4))
              : "",
    );
    const [maxInput, setMaxInput] = useState(
        layerSettings.domain
            ? String(formatNumber(layerSettings.domain.max, 4))
            : dataRange
              ? String(formatNumber(dataRange.max, 4))
              : "",
    );
    const [error, setError] = useState(null);

    const currentRangeKey = rangeKey(layer, dataRange);
    const currentPaletteKey = paletteKey(layer, layerSettings);

    const [syncedRangeKey, setSyncedRangeKey] = useState(currentRangeKey);
    const [syncedPaletteKey, setSyncedPaletteKey] =
        useState(currentPaletteKey);

    useEffect(() => {
        if (currentRangeKey === syncedRangeKey) return;

        // Intentional synchronization: the server range can arrive after the
        // panel mounts, so the editable fields must reflect the new dataset.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSyncedRangeKey(currentRangeKey);

        const active = layerSettings.domain ?? dataRange;

        setMinInput(active ? String(formatNumber(active.min, 4)) : "");
        setMaxInput(active ? String(formatNumber(active.max, 4)) : "");
        setError(null);
    }, [
        currentRangeKey,
        syncedRangeKey,
        dataRange,
        layerSettings.domain,
    ]);

    useEffect(() => {
        if (currentPaletteKey === syncedPaletteKey) return;

        // Intentional synchronization with external layer settings.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSyncedPaletteKey(currentPaletteKey);

        if (layerSettings.palette === "custom") {
                setCustomColors(
                layerSettings.customColors ??
                    stopsToCustomColors(layerSettings.paletteStops),
            );
                setCustomOpen(true);
        } else {
                setCustomColors(
                layer?.defaultPalette
                    ? stopsToCustomColors(
                          getPalette(layer.defaultPalette).stops,
                      )
                    : { ...CUSTOM_DEFAULTS },
            );
                setCustomOpen(false);
        }
        setError(null);
    }, [
        currentPaletteKey,
        syncedPaletteKey,
        layer,
        layerSettings.palette,
        layerSettings.paletteStops,
        layerSettings.customColors,
    ]);

    const update = (patch) =>
        onSettingsChange(layer.id, {
            ...layerSettings,
            ...patch,
        });

    const customStops = useMemo(
        () => customColorsToStops(customColors),
        [customColors],
    );

    const customPreview = useMemo(
        () => stopsGradient(customStops),
        [customStops],
    );

    const updateCustomColor = (key, value) => {
        setCustomColors((previous) => ({
            ...previous,
            [key]: value.toUpperCase(),
        }));
        setError(null);
    };

    const applyCustomPalette = () => {
        if (Object.values(customColors).some((value) => !isValidHex(value))) {
            setError("Use a valid 6-digit HEX colour for all three stops.");
            return;
        }

        const paletteStops = customColorsToStops(customColors);

        update({
            palette: "custom",
            paletteStops,
            customColors: { ...customColors },
        });

        setCustomOpen(true);
        setError(null);
    };

    const resetCustom = () => {
        const defaults = layer?.defaultPalette
            ? stopsToCustomColors(getPalette(layer.defaultPalette).stops)
            : { ...CUSTOM_DEFAULTS };

        setCustomColors(defaults);
        setError(null);
    };

    const applyDomain = (event) => {
        event.preventDefault();

        const min = Number(minInput);
        const max = Number(maxInput);

        if (!Number.isFinite(min) || !Number.isFinite(max)) {
            setError("Both bounds must be numbers.");
            return;
        }

        if (max <= min) {
            setError("Maximum must be greater than minimum.");
            return;
        }

        update({ domain: { min, max } });
        setError(null);
    };

    const resetDomain = () => {
        update({ domain: null });
        setMinInput(dataRange ? String(formatNumber(dataRange.min, 4)) : "");
        setMaxInput(dataRange ? String(formatNumber(dataRange.max, 4)) : "");
        setError(null);
    };

    if (!layer) {
        return (
            <ContextPanel
                side="left"
                kicker="Style"
                title="Colour mapping"
                icon={<IconPalette />}
                onClose={onClose}
            >
                <StateMessage
                    icon={<IconPalette />}
                    title="No layer active"
                    body="Turn on a data layer and its colour mapping will appear here."
                />
            </ContextPanel>
        );
    }

    const customIsActive = layerSettings.palette === "custom";

    return (
        <ContextPanel
            side="left"
            kicker="Style"
            title="Colour mapping"
            icon={<IconPalette />}
            onClose={onClose}
        >
            <div className="ox-color-panel">
                <p className="ox-panel__lede">
                    Applies to <strong>{layer.label}</strong>. Visualisation only —
                    your model values are unchanged.
                </p>

                {layer.kind === "vector" ? (
                    <UnavailableNote title="Fixed ramp for currents">
                        Currents use a speed-based shader ramp. Preset scalar
                        palettes and custom colour stops do not change the
                        current renderer.
                    </UnavailableNote>
                ) : (
                    <>
                        <section className="ox-color-section">
                            <div className="ox-field__heading">
                                <span className="ox-field__label">
                                    Preset palettes
                                </span>
                                <span className="ox-field__helper">
                                    4 ready-to-use ramps
                                </span>
                            </div>

                            <div
                                className="ox-palettes"
                                role="radiogroup"
                                aria-label="Colour preset"
                            >
                                {Object.values(PALETTES).map((palette) => {
                                    const active =
                                        !customIsActive &&
                                        (layerSettings.palette ??
                                            layer.defaultPalette) === palette.id;

                                    return (
                                        <button
                                            key={palette.id}
                                            type="button"
                                            role="radio"
                                            aria-checked={active}
                                            className={`ox-palette ${
                                                active ? "is-active" : ""
                                            }`}
                                            onClick={() =>
                                                update({
                                                    palette: palette.id,
                                                    paletteStops: palette.stops,
                                                    customColors: undefined,
                                                })
                                            }
                                        >
                                            <span
                                                className="ox-palette__swatch"
                                                style={{
                                                    backgroundImage:
                                                        paletteGradient(palette.id),
                                                }}
                                            />

                                            <span className="ox-palette__copy">
                                                <span className="ox-palette__name">
                                                    {palette.label}
                                                </span>
                                                <span className="ox-palette__desc">
                                                    {palette.id === "thermal"
                                                        ? "Temperature-style"
                                                        : palette.id === "salinity"
                                                          ? "Salinity-style"
                                                          : palette.id === "ocean"
                                                            ? "Oceanic"
                                                            : "Neutral"}
                                                </span>
                                            </span>

                                            {active && (
                                                <span className="ox-palette__state">
                                                    Active
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        <section
                            className={`ox-custom-gradient ${
                                customOpen ? "is-open" : ""
                            } ${customIsActive ? "is-custom-active" : ""}`}
                        >
                            <button
                                type="button"
                                className="ox-custom-gradient__toggle"
                                aria-expanded={customOpen}
                                onClick={() =>
                                    setCustomOpen((open) => !open)
                                }
                            >
                                <span className="ox-custom-gradient__title">
                                    <span className="ox-custom-gradient__icon">
                                        <IconPalette />
                                    </span>
                                    <span>
                                        <strong>Custom gradient</strong>
                                        <small>
                                            Choose Low, Mid & High colours
                                        </small>
                                    </span>
                                </span>

                                <span
                                    className="ox-custom-gradient__chevron"
                                    aria-hidden="true"
                                />
                            </button>

                            {customOpen && (
                                <div className="ox-custom-gradient__body">
                                    <div
                                        className="ox-custom-preview"
                                        style={{
                                            backgroundImage: customPreview,
                                        }}
                                        aria-label="Custom gradient preview"
                                    >
                                        <span>Low</span>
                                        <span>Mid</span>
                                        <span>High</span>
                                    </div>

                                    <div className="ox-custom-stop-head">
                                        <span>Set the three anchor colours</span>
                                        <span>0% · 50% · 100%</span>
                                    </div>

                                    <div className="ox-custom-stops">
                                        <ColorStop
                                            label="Low"
                                            hint="Minimum"
                                            value={customColors.low}
                                            onChange={(value) =>
                                                updateCustomColor("low", value)
                                            }
                                        />
                                        <ColorStop
                                            label="Mid"
                                            hint="Middle"
                                            value={customColors.mid}
                                            onChange={(value) =>
                                                updateCustomColor("mid", value)
                                            }
                                        />
                                        <ColorStop
                                            label="High"
                                            hint="Maximum"
                                            value={customColors.high}
                                            onChange={(value) =>
                                                updateCustomColor("high", value)
                                            }
                                        />
                                    </div>

                                    {error && (
                                        <p className="ox-stepper__error" role="alert">
                                            {error}
                                        </p>
                                    )}

                                    <div className="ox-custom-gradient__actions">
                                        <button
                                            type="button"
                                            className="ox-button ox-button--primary"
                                            onClick={applyCustomPalette}
                                        >
                                            Apply gradient
                                        </button>

                                        <button
                                            type="button"
                                            className="ox-button ox-button--ghost"
                                            onClick={resetCustom}
                                        >
                                            Reset colours
                                        </button>
                                    </div>

                                    {customIsActive && (
                                        <div className="ox-custom-gradient__status">
                                            <span />
                                            Custom gradient active
                                        </div>
                                    )}
                                </div>
                            )}
                        </section>

                        <section className="ox-domain">
                            <div className="ox-field__heading">
                                <span className="ox-field__label">
                                    Value range
                                    <span className="ox-field__unit">
                                        {layer.unit}
                                    </span>
                                </span>
                                <span className="ox-field__helper">
                                    Optional
                                </span>
                            </div>

                            <form onSubmit={applyDomain} noValidate>
                                <div className="ox-domain__inputs">
                                    <label>
                                        <span>Low</span>
                                        <input
                                            value={minInput}
                                            inputMode="decimal"
                                            onChange={(event) =>
                                                setMinInput(
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </label>

                                    <label>
                                        <span>High</span>
                                        <input
                                            value={maxInput}
                                            inputMode="decimal"
                                            onChange={(event) =>
                                                setMaxInput(
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </label>
                                </div>

                                <div className="ox-domain__foot">
                                    <button
                                        type="submit"
                                        className="ox-button ox-button--primary"
                                    >
                                        Apply range
                                    </button>

                                    <button
                                        type="button"
                                        className="ox-button ox-button--ghost"
                                        onClick={resetDomain}
                                        disabled={!layerSettings.domain}
                                    >
                                        Reset
                                    </button>
                                </div>

                                {dataRange && (
                                    <p className="ox-domain__hint">
                                        Dataset range{" "}
                                        {formatNumber(
                                            dataRange.min,
                                            layer.decimals,
                                        )}{" "}
                                        to{" "}
                                        {formatNumber(
                                            dataRange.max,
                                            layer.decimals,
                                        )}{" "}
                                        {layer.unit}
                                    </p>
                                )}
                            </form>
                        </section>
                    </>
                )}
            </div>
        </ContextPanel>
    );
}

function ColorStop({ label, hint, value, onChange }) {
    const valid = isValidHex(value);
    const safeColor = valid ? value : "#777777";

    return (
        <label className={`ox-colorstop ${valid ? "" : "has-error"}`}>
            <span className="ox-colorstop__top">
                <span>
                    <strong>{label}</strong>
                    <small>{hint}</small>
                </span>

                <span
                    className="ox-colorstop__preview"
                    style={{ backgroundColor: safeColor }}
                />
            </span>

            <span className="ox-colorstop__control">
                <input
                    type="color"
                    value={safeColor}
                    onChange={(event) => onChange(event.target.value)}
                    aria-label={`${label} colour picker`}
                />

                <input
                    type="text"
                    value={value}
                    maxLength={7}
                    spellCheck="false"
                    inputMode="text"
                    aria-label={`${label} HEX colour`}
                    onChange={(event) => {
                        let next = event.target.value.toUpperCase();
                        if (!next.startsWith("#")) next = `#${next}`;
                        onChange(next.slice(0, 7));
                    }}
                    placeholder="#RRGGBB"
                />
            </span>
        </label>
    );
}

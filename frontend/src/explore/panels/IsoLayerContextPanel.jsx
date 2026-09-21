import { useState } from "react";

import ContextPanel from "./ContextPanel.jsx";

import { Slider, Toggle, UnavailableNote } from "../ui/Primitives.jsx";
import { IconIso } from "../ui/Icons.jsx";
import { LAYERS, getLegendRange } from "../lib/layers.js";
import { formatNumber } from "../lib/format.js";

/* ==========================================================================
   OCEAN-X — isolayer panel

   Isosurface extraction needs a depth-resolved volume. The dataset is a
   single level per cell, so there is no volume to contour and nothing is
   rendered on the globe from this panel.

   The controls are laid out and wired to local state so the shape of the
   tool is settled, but they are disabled and labelled as such rather than
   pretending to drive the scene.
   ========================================================================== */

const ISO_CAPABLE = LAYERS.filter((layer) => layer.kind === "scalar");

export default function IsoLayerContextPanel({ rasters, onClose }) {
    const [variable, setVariable] = useState(ISO_CAPABLE[0]?.id ?? "temperature");
    const [isoValue, setIsoValue] = useState(50);
    const [opacity, setOpacity] = useState(70);
    const [visible, setVisible] = useState(false);

    const layer = ISO_CAPABLE.find((item) => item.id === variable);
    const range = getLegendRange(layer, rasters?.[variable]);

    const realValue = range
        ? range.min + ((range.max - range.min) * isoValue) / 100
        : null;

    return (
        <ContextPanel
            side="left"
            kicker="Analysis"
            title="IsoLayer"
            icon={<IconIso />}
            onClose={onClose}
        >
            <p className="ox-panel__lede">
                Contour a variable at a constant value through the water column.
            </p>

            <div className="ox-field">
                <label className="ox-field__label" htmlFor="ox-iso-variable">
                    Variable
                </label>

                <select
                    id="ox-iso-variable"
                    className="ox-nativeselect"
                    value={variable}
                    onChange={(event) => setVariable(event.target.value)}
                >
                    {ISO_CAPABLE.map((item) => (
                        <option key={item.id} value={item.id}>
                            {item.label}
                        </option>
                    ))}
                </select>
            </div>

            <Slider
                label="Iso value"
                value={isoValue}
                display={
                    realValue !== null
                        ? `${formatNumber(realValue, layer?.decimals ?? 2)} ${layer?.unit ?? ""}`
                        : `${isoValue}%`
                }
                min={0}
                max={100}
                onChange={setIsoValue}
                disabled
            />

            <Slider
                label="Surface opacity"
                value={opacity}
                display={`${opacity}%`}
                min={10}
                max={100}
                onChange={setOpacity}
                disabled
            />

            <div className="ox-setting is-disabled">
                <span className="ox-setting__copy">
                    <span className="ox-setting__label">Show isosurface</span>
                    <span className="ox-setting__hint">
                        Requires a depth-resolved volume
                    </span>
                </span>
                <Toggle
                    label="Show isosurface"
                    checked={visible}
                    onChange={setVisible}
                    disabled
                />
            </div>

            <UnavailableNote title="Isosurfaces not available">
                Contouring needs values at many depths for each cell. The
                current grid stores one level, so no surface can be extracted
                and none is faked. These controls are disabled until a
                volumetric dataset is loaded.
            </UnavailableNote>
        </ContextPanel>
    );
}

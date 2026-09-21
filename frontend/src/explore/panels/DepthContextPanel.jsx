import ContextPanel from "./ContextPanel.jsx";

import {
    FactRow,
    StateMessage,
    UnavailableNote,
} from "../ui/Primitives.jsx";

import { IconDepth } from "../ui/Icons.jsx";
import { formatNumber, isPresent } from "../lib/format.js";

/* ==========================================================================
   OCEAN-X — depth panel

   The ocean_grid table stores one record per horizontal cell with a single
   `depth` column, and the API returns that record as-is. There is no
   depth-resolved query, so this panel reports the depth of the record the
   user actually selected and is explicit that profiles are not available.

   No slider is drawn, because a slider that changes nothing is worse than
   an honest readout.
   ========================================================================== */

export default function DepthContextPanel({ oceanData, selectedLocation, onClose }) {
    return (
        <ContextPanel
            side="left"
            kicker="Analysis"
            title="Depth"
            icon={<IconDepth />}
            onClose={onClose}
        >
            {!selectedLocation ? (
                <StateMessage
                    icon={<IconDepth />}
                    title="No point selected"
                    body="Choose Location → Point selection and click the globe to read the depth of a model cell."
                />
            ) : (
                <>
                    <div className="ox-depthcard">
                        <span className="ox-depthcard__label">Record depth</span>
                        <span className="ox-depthcard__value">
                            {isPresent(oceanData?.depth)
                                ? formatNumber(oceanData.depth, 2)
                                : "—"}
                            <span className="ox-depthcard__unit">m</span>
                        </span>
                        <span className="ox-depthcard__note">
                            Level stored for this grid cell
                        </span>
                    </div>

                    <div className="ox-facts">
                        {isPresent(oceanData?.mlotst) && (
                            <FactRow
                                label="Mixed layer thickness"
                                value={`${formatNumber(oceanData.mlotst, 1)} m`}
                            />
                        )}

                        {isPresent(oceanData?.bottomt) && (
                            <FactRow
                                label="Sea floor temperature"
                                value={`${formatNumber(oceanData.bottomt, 2)} °C`}
                            />
                        )}

                        {isPresent(oceanData?.thetao) && (
                            <FactRow
                                label="Temperature at level"
                                value={`${formatNumber(oceanData.thetao, 2)} °C`}
                            />
                        )}
                    </div>
                </>
            )}

            <UnavailableNote title="Vertical profiles not available">
                The dataset holds a single level per grid cell, so there is no
                water column to slice. When depth-resolved records are loaded,
                the profile and slice controls belong in this panel.
            </UnavailableNote>
        </ContextPanel>
    );
}

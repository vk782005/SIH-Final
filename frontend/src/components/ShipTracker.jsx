import React from "react";

export default function ShipTracker({
    tracking,
    onTrackingChange,
}) {
    return (
        <div className="ship-tracker">
            <button
                type="button"
                className={`ship-tracker-button ${
                    tracking ? "active" : ""
                }`}
                onClick={() =>
                    onTrackingChange(!tracking)
                }
            >
                <span className="ship-icon">
                    🚢
                </span>

                <span>
                    {tracking
                        ? "Stop Tracking"
                        : "Track Ships"}
                </span>
            </button>

            {tracking && (
                <div className="ship-tracker-status">
                    <span className="ship-status-dot" />

                    <span>
                        30 SHIPS TRACKED
                    </span>
                </div>
            )}
        </div>
    );
}
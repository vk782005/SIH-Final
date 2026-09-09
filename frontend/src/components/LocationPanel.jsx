function formatCoordinate(value, positive, negative) {
    const direction = value >= 0 ? positive : negative;
    return `${Math.abs(value).toFixed(4)}° ${direction}`;
}

function formatValue(value, decimals = 2) {
    if (value === null || value === undefined || !Number.isFinite(Number(value))) {
        return "—";
    }

    return Number(value).toFixed(decimals);
}

function getCurrentInfo(uo, vo) {
    const u = Number(uo);
    const v = Number(vo);

    if (!Number.isFinite(u) || !Number.isFinite(v)) {
        return null;
    }

    const speed = Math.sqrt(u * u + v * v);

    let direction = (Math.atan2(u, v) * 180) / Math.PI;

    if (direction < 0) {
        direction += 360;
    }

    const directions = [
        "N",
        "NE",
        "E",
        "SE",
        "S",
        "SW",
        "W",
        "NW",
    ];

    const directionIndex =
        Math.round(direction / 45) % 8;

    return {
        speed,
        direction,
        compass: directions[directionIndex],
    };
}

function LocationPanel({
    selectedLocation,
    oceanData,
    message,
    loading,
}) {
    if (!selectedLocation) {
        return (
            <aside className="location-panel glass-panel empty-location">
                <div className="empty-icon">
                    ⌖
                </div>

                <h2>Select a location</h2>

                <p>
                    Click anywhere on the globe to
                    explore ocean data.
                </p>
            </aside>
        );
    }

    const current = oceanData
        ? getCurrentInfo(
              oceanData.uo,
              oceanData.vo
          )
        : null;

    return (
        <aside className="location-panel glass-panel">

            {/* HEADER */}
            <div className="panel-heading">
                <div>
                    <span>OCEAN OBSERVATION</span>
                    <strong>SELECTED LOCATION</strong>
                </div>

                <div className="live-indicator">
                    <span></span>
                    LIVE
                </div>
            </div>

            {/* COORDINATES */}
            <div className="coordinates">
                <div>
                    <span>LATITUDE</span>

                    <strong>
                        {formatCoordinate(
                            selectedLocation.latitude,
                            "N",
                            "S"
                        )}
                    </strong>
                </div>

                <div>
                    <span>LONGITUDE</span>

                    <strong>
                        {formatCoordinate(
                            selectedLocation.longitude,
                            "E",
                            "W"
                        )}
                    </strong>
                </div>
            </div>

            {/* LOADING */}
            {loading && (
                <div className="loading-state">
                    <div className="loader"></div>

                    <span>
                        Querying ocean database...
                    </span>
                </div>
            )}

            {/* NO DATA */}
            {message && !loading && (
                <div className="no-data">
                    <div className="no-data-icon">
                        !
                    </div>

                    <h3>No Ocean Data</h3>

                    <p>
                        {message}
                    </p>
                </div>
            )}

            {/* OCEAN DATA */}
            {oceanData && !loading && (
                <div className="ocean-data">

                    {/* STATUS */}
                    <div className="data-status">
                        <span></span>
                        OCEAN DATA AVAILABLE
                    </div>

                    {/* TEMPERATURE */}
                    <div className="primary-value">
                        <span>SEA TEMPERATURE</span>

                        <strong>
                            {formatValue(
                                oceanData.thetao,
                                2
                            )}

                            <small>°C</small>
                        </strong>
                    </div>

                    {/* MAIN DATA GRID */}
                    <div className="data-grid">

                        {/* SALINITY */}
                        <div className="data-item">
                            <span>SALINITY</span>

                            <strong>
                                {formatValue(
                                    oceanData.so,
                                    2
                                )}
                            </strong>

                            <small>PSU</small>
                        </div>

                        {/* SEA HEIGHT */}
                        <div className="data-item">
                            <span>SEA SURFACE HEIGHT</span>

                            <strong>
                                {formatValue(
                                    oceanData.zos,
                                    3
                                )}
                            </strong>

                            <small>m</small>
                        </div>

                        {/* CURRENT SPEED */}
                        <div className="data-item current-item">
                            <span>CURRENT SPEED</span>

                            <strong>
                                {current
                                    ? current.speed.toFixed(3)
                                    : "—"}
                            </strong>

                            <small>m/s</small>
                        </div>

                        {/* CURRENT DIRECTION */}
                        <div className="data-item current-item">
                            <span>CURRENT DIRECTION</span>

                            <strong className="current-direction">
                                {current
                                    ? `${current.compass}`
                                    : "—"}
                            </strong>

                            <small>
                                {current
                                    ? `${current.direction.toFixed(
                                          0
                                      )}°`
                                    : ""}
                            </small>
                        </div>
                    </div>

                    {/* VECTOR DETAILS */}
                    <div className="vector-details">
                        <div>
                            <span>E-W VELOCITY</span>

                            <strong>
                                {formatValue(
                                    oceanData.uo,
                                    3
                                )}
                                <small> m/s</small>
                            </strong>
                        </div>

                        <div>
                            <span>N-S VELOCITY</span>

                            <strong>
                                {formatValue(
                                    oceanData.vo,
                                    3
                                )}
                                <small> m/s</small>
                            </strong>
                        </div>
                    </div>

                    {/* MODEL GRID */}
                    <div className="grid-point">

                        <div className="grid-heading">
                            <span>
                                NEAREST MODEL GRID POINT
                            </span>

                            <span className="grid-dot">
                                ●
                            </span>
                        </div>

                        <strong>
                            {formatCoordinate(
                                oceanData.latitude,
                                "N",
                                "S"
                            )}

                            {" · "}

                            {formatCoordinate(
                                oceanData.longitude,
                                "E",
                                "W"
                            )}
                        </strong>

                        <small>
                            Depth{" "}
                            {formatValue(
                                oceanData.depth,
                                2
                            )}{" "}
                            m
                        </small>
                    </div>

                    {/* TIMESTAMP */}
                    {oceanData.time && (
                        <div className="observation-time">
                            <span>MODEL TIME</span>

                            <strong>
                                {oceanData.time}
                            </strong>
                        </div>
                    )}

                </div>
            )}
        </aside>
    );
}

export default LocationPanel;
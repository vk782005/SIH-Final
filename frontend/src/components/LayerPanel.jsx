function LayerPanel({
    selectedVariable,
    onVariableChange,
    layerLoading,
}) {

    return (
        <aside className="layer-panel glass-panel">

            <div className="panel-heading">
                <span>DATA LAYERS</span>
                <span className="panel-count">04</span>
            </div>


            <div className="layer-list">

                {/* TEMPERATURE */}

                <button
                    className={`layer-item ${
                        selectedVariable === "temperature"
                            ? "active"
                            : ""
                    }`}
                    onClick={() =>
                        onVariableChange("temperature")
                    }
                >

                    <span className="layer-icon temperature">
                        🌡
                    </span>

                    <span className="layer-info">

                        <strong>
                            Temperature
                        </strong>

                        <small>
                            Ocean temperature
                        </small>

                    </span>

                    {selectedVariable === "temperature" && (
                        <span className="layer-indicator"></span>
                    )}

                </button>


                {/* SALINITY */}

                <button
                    className={`layer-item ${
                        selectedVariable === "salinity"
                            ? "active"
                            : ""
                    }`}
                    onClick={() =>
                        onVariableChange("salinity")
                    }
                >

                    <span className="layer-icon">
                        🧂
                    </span>

                    <span className="layer-info">

                        <strong>
                            Salinity
                        </strong>

                        <small>
                            Sea water salinity
                        </small>

                    </span>

                    {selectedVariable === "salinity" && (
                        <span className="layer-indicator"></span>
                    )}

                </button>


                {/* CURRENTS */}

                <button
                    className={`layer-item ${
                        selectedVariable === "currents"
                            ? "active"
                            : ""
                    }`}
                    onClick={() =>
                        onVariableChange("currents")
                    }
                >

                    <span className="layer-icon">
                        🌊
                    </span>

                    <span className="layer-info">

                        <strong>
                            Currents
                        </strong>

                        <small>
                            Ocean velocity
                        </small>

                    </span>

                    {selectedVariable === "currents" && (
                        <span className="layer-indicator"></span>
                    )}

                </button>


                {/* SEA SURFACE HEIGHT */}

                <button
                    className={`layer-item ${
                        selectedVariable === "seaHeight"
                            ? "active"
                            : ""
                    }`}
                    onClick={() =>
                        onVariableChange("seaHeight")
                    }
                >

                    <span className="layer-icon">
                        📐
                    </span>

                    <span className="layer-info">

                        <strong>
                            Sea Surface Height
                        </strong>

                        <small>
                            Surface elevation
                        </small>

                    </span>

                    {selectedVariable === "seaHeight" && (
                        <span className="layer-indicator"></span>
                    )}

                </button>

            </div>


            <div className="panel-divider"></div>


            {/* <div className="control-section">

                <div className="control-title">

                    DEPTH

                    <span>
                        0.49 m
                    </span>

                </div>

                <input
                    type="range"
                    min="0"
                    max="5000"
                    defaultValue="0"
                    className="depth-slider"
                />

                <div className="slider-labels">

                    <span>
                        SURFACE
                    </span>

                    <span>
                        5000 m
                    </span>

                </div>

            </div> */}


            {layerLoading && (

                <div className="layer-loading">

                    Loading visualization...

                </div>

            )}

        </aside>
    );
}

export default LayerPanel;
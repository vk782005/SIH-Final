import { DEPTH_LIMIT, PARAMETER_CONFIG } from "../data/depthDemoData";

const DepthControls = ({
  parameter,
  depth,
  setDepth,
  playing,
  setPlaying,
  playbackSpeed,
}) => {
  const config = PARAMETER_CONFIG[parameter];

  const stepDepth = (amount) => {
    setDepth((current) =>
      Math.min(DEPTH_LIMIT, Math.max(0, Math.round((current + amount) / 10) * 10))
    );
  };

  return (
    <section className="da-control-strip" aria-label="Depth controls">
      <div className="da-control-main">
        <div className="da-control-heading">
          <div>
            <span className="da-eyebrow">VERTICAL EXPLORATION</span>
            <h2>Navigate the water column</h2>
          </div>

          <div className="da-depth-readout">
            <span>Current depth</span>
            <strong>{depth.toLocaleString()} m</strong>
          </div>
        </div>

        <div className="da-slider-wrap">
          <div className="da-slider-scale">
            <span>0 m</span>
            <span>300 m</span>
            <span>600 m</span>
            <span>900 m</span>
            <span>{DEPTH_LIMIT.toLocaleString()} m</span>
          </div>

          <input
            className={`da-depth-slider ${config.accentClass}`}
            type="range"
            min="0"
            max={DEPTH_LIMIT}
            step="5"
            value={depth}
            onChange={(event) => setDepth(Number(event.target.value))}
            aria-label="Select depth"
          />

          <div className="da-depth-ticks" aria-hidden="true">
            {[0, 200, 400, 600, 800, 1000, 1200].map((tick) => (
              <button
                key={tick}
                type="button"
                className={Math.abs(depth - tick) < 25 ? "is-active" : ""}
                onClick={() => setDepth(tick)}
                style={{ left: `${(tick / DEPTH_LIMIT) * 100}%` }}
              />
            ))}
          </div>
        </div>

        <div className="da-control-actions">
          <div className="da-stepper">
            <button type="button" onClick={() => stepDepth(-50)} aria-label="Move up 50 meters">
              −50m
            </button>
            <button type="button" onClick={() => stepDepth(50)} aria-label="Move down 50 meters">
              +50m
            </button>
          </div>

          <button
            type="button"
            className={`da-dive-button ${playing ? "is-playing" : ""}`}
            onClick={() => setPlaying((current) => !current)}
          >
            <span>{playing ? "Ⅱ" : "▶"}</span>
            {playing ? "PAUSE DIVE" : "START DIVE"}
          </button>

          <div className="da-speed-control">
            <span>Speed</span>
            <strong>{playbackSpeed}×</strong>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DepthControls;

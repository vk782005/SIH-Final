import { useEffect, useState } from "react";

import ContextPanel from "./ContextPanel.jsx";
import PointDataReadout from "./PointDataReadout.jsx";

import {
    NumberStepper,
} from "../ui/Primitives.jsx";

import { IconArrow, IconCrosshair } from "../ui/Icons.jsx";

import { decimalsForStep } from "../lib/format.js";

const STEP_OPTIONS = ["0.01", "0.1", "1", "5"];

export default function ExactCoordinatesContextPanel({
    selectedLocation,
    oceanData,
    pointStatus,
    onGoToLocation,
    onClose,
}) {
    const [latInput, setLatInput] = useState("20.000000");
    const [lonInput, setLonInput] = useState("70.000000");
    const [step, setStep] = useState("0.01");
    const [errors, setErrors] = useState({});

    const decimals = decimalsForStep(step);

    useEffect(() => {
        if (!selectedLocation) return;

        // The selected point is external state; mirror it into the editable
        // form whenever the selected location changes.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLatInput(Number(selectedLocation.latitude).toFixed(6));
        setLonInput(Number(selectedLocation.longitude).toFixed(6));
        setErrors({});
    }, [selectedLocation]);

    const commit = () => {
        const latitude = Number(latInput);
        const longitude = Number(lonInput);
        const next = {};

        if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
            next.lat = "Latitude must be between −90° and +90°.";
        }

        if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
            next.lon = "Longitude must be between −180° and +180°.";
        }

        setErrors(next);

        if (Object.keys(next).length) return;

        onGoToLocation?.({ latitude, longitude });
    };

    const submit = (event) => {
        event.preventDefault();
        commit();
    };

    return (
        <ContextPanel
            side="right"
            kicker="Location"
            title="Exact coordinates"
            icon={<IconCrosshair />}
            onClose={onClose}
        >
            <p className="ox-panel__lede">
                Enter an exact latitude and longitude to move the globe and
                inspect the nearest ocean grid cell.
            </p>

            <form className="ox-coordform" onSubmit={submit} noValidate>
                <NumberStepper
                    label="Latitude"
                    hint="−90° to +90°"
                    value={latInput}
                    onChange={setLatInput}
                    onCommit={commit}
                    step={Number(step)}
                    decimals={decimals}
                    error={errors.lat}
                    suffix="°"
                />

                <NumberStepper
                    label="Longitude"
                    hint="−180° to +180°"
                    value={lonInput}
                    onChange={setLonInput}
                    onCommit={commit}
                    step={Number(step)}
                    decimals={decimals}
                    error={errors.lon}
                    suffix="°"
                />

                <div className="ox-coordform__foot">
                    <label className="ox-select">
                        <span>Step</span>
                        <select
                            value={step}
                            onChange={(event) => setStep(event.target.value)}
                        >
                            {STEP_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                    {option}°
                                </option>
                            ))}
                        </select>
                    </label>

                    <button
                        type="submit"
                        className="ox-button ox-button--primary"
                    >
                        Go to location
                        <IconArrow />
                    </button>
                </div>
            </form>

            <PointDataReadout
                pointStatus={pointStatus}
                oceanData={oceanData}
            />
        </ContextPanel>
    );
}

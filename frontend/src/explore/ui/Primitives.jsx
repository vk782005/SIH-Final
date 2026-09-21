import { useEffect, useId, useRef, useState } from "react";

/* ==========================================================================
   OCEAN-X — Explore UI primitives

   Deliberately small. Every state an operator needs to read — active,
   inactive, disabled, unavailable — is carried by shape or text as well as
   colour, so nothing depends on hue alone.
   ========================================================================== */

/* --------------------------------------------------------------------------
   DISCLOSURE — progressive disclosure in one component
   -------------------------------------------------------------------------- */

export function Disclosure({
    label,
    hint,
    icon,
    defaultOpen = false,
    open: controlledOpen,
    onToggle,
    badge,
    children,
}) {
    const [internalOpen, setInternalOpen] = useState(defaultOpen);
    const panelId = useId();

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;

    const toggle = () => {
        if (!isControlled) setInternalOpen((value) => !value);
        onToggle?.(!open);
    };

    return (
        <section className="ox-disclosure">
            <button
                type="button"
                className={`ox-disclosure__head ${open ? "is-open" : ""}`}
                onClick={toggle}
                aria-expanded={open}
                aria-controls={panelId}
            >
                {icon && <span className="ox-disclosure__icon">{icon}</span>}

                <span className="ox-disclosure__copy">
                    <span className="ox-disclosure__label">{label}</span>
                    {hint && <span className="ox-disclosure__hint">{hint}</span>}
                </span>

                {badge && <span className="ox-chip">{badge}</span>}

                <Chevron open={open} />
            </button>

            <div
                id={panelId}
                className={`ox-disclosure__body ${open ? "is-open" : ""}`}
                hidden={!open}
            >
                <div className="ox-disclosure__inner">{children}</div>
            </div>
        </section>
    );
}

export function Chevron({ open }) {
    return (
        <svg
            className={`ox-chevron ${open ? "is-open" : ""}`}
            viewBox="0 0 16 16"
            width="14"
            height="14"
            aria-hidden="true"
        >
            <path
                d="M4 6.5 8 10.5 12 6.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

/* --------------------------------------------------------------------------
   TOGGLE
   -------------------------------------------------------------------------- */

export function Toggle({ checked, onChange, disabled, label }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            disabled={disabled}
            className={`ox-toggle ${checked ? "is-on" : ""}`}
            onClick={() => !disabled && onChange?.(!checked)}
        >
            <span className="ox-toggle__thumb" />
        </button>
    );
}

/* --------------------------------------------------------------------------
   SLIDER
   -------------------------------------------------------------------------- */

export function Slider({
    label,
    value,
    display,
    min = 0,
    max = 100,
    step = 1,
    onChange,
    disabled,
}) {
    const id = useId();

    return (
        <div className={`ox-slider ${disabled ? "is-disabled" : ""}`}>
            <div className="ox-slider__head">
                <label htmlFor={id}>{label}</label>
                <span className="ox-slider__value">{display ?? value}</span>
            </div>

            <input
                id={id}
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                disabled={disabled}
                onChange={(event) => onChange?.(Number(event.target.value))}
            />
        </div>
    );
}

/* --------------------------------------------------------------------------
   NUMERIC STEPPER — type a value, or press and hold the arrows
   -------------------------------------------------------------------------- */

export function NumberStepper({
    label,
    hint,
    value,
    onChange,
    onCommit,
    step,
    decimals,
    error,
    suffix,
}) {
    const id = useId();
    const repeatRef = useRef({ timeout: null, interval: null });

    // Never leave a timer running if the control unmounts mid-hold.
    useEffect(() => {
        const timers = repeatRef.current;

        return () => {
            clearTimeout(timers.timeout);
            clearInterval(timers.interval);
        };
    }, []);

    const nudge = (direction) => {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return;
        onChange((numeric + step * direction).toFixed(decimals));
    };

    const startRepeat = (direction) => {
        nudge(direction);

        repeatRef.current.timeout = setTimeout(() => {
            repeatRef.current.interval = setInterval(() => nudge(direction), 70);
        }, 400);
    };

    const stopRepeat = () => {
        clearTimeout(repeatRef.current.timeout);
        clearInterval(repeatRef.current.interval);
    };

    const handleKeyDown = (event) => {
        if (event.key === "ArrowUp") {
            event.preventDefault();
            nudge(1);
        } else if (event.key === "ArrowDown") {
            event.preventDefault();
            nudge(-1);
        } else if (event.key === "Enter") {
            event.preventDefault();
            onCommit?.();
        }
    };

    return (
        <div className={`ox-stepper ${error ? "is-invalid" : ""}`}>
            <div className="ox-stepper__head">
                <label htmlFor={id}>{label}</label>
                {hint && <span className="ox-stepper__hint">{hint}</span>}
            </div>

            <div className="ox-stepper__field">
                <input
                    id={id}
                    value={value}
                    inputMode="decimal"
                    autoComplete="off"
                    spellCheck="false"
                    aria-invalid={Boolean(error)}
                    onChange={(event) => onChange(event.target.value)}
                    onKeyDown={handleKeyDown}
                />

                {suffix && <span className="ox-stepper__suffix">{suffix}</span>}

                <div className="ox-stepper__arrows">
                    <button
                        type="button"
                        aria-label={`Increase ${label}`}
                        onPointerDown={() => startRepeat(1)}
                        onPointerUp={stopRepeat}
                        onPointerLeave={stopRepeat}
                        onPointerCancel={stopRepeat}
                    >
                        <Caret up />
                    </button>
                    <button
                        type="button"
                        aria-label={`Decrease ${label}`}
                        onPointerDown={() => startRepeat(-1)}
                        onPointerUp={stopRepeat}
                        onPointerLeave={stopRepeat}
                        onPointerCancel={stopRepeat}
                    >
                        <Caret />
                    </button>
                </div>
            </div>

            {error && (
                <p className="ox-stepper__error" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}

function Caret({ up }) {
    return (
        <svg viewBox="0 0 10 6" width="10" height="6" aria-hidden="true">
            <path
                d={up ? "M1 5 5 1 9 5" : "M1 1 5 5 9 1"}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

/* --------------------------------------------------------------------------
   READOUTS
   -------------------------------------------------------------------------- */

export function Metric({ label, value, unit, hero }) {
    return (
        <div className={`ox-metric ${hero ? "ox-metric--hero" : ""}`}>
            <span className="ox-metric__label">{label}</span>
            <span className="ox-metric__value">
                {value}
                {unit && <span className="ox-metric__unit">{unit}</span>}
            </span>
        </div>
    );
}

export function FactRow({ label, value }) {
    return (
        <div className="ox-fact">
            <span className="ox-fact__label">{label}</span>
            <span className="ox-fact__value">{value}</span>
        </div>
    );
}

/* --------------------------------------------------------------------------
   STATES — product-grade, never a browser alert
   -------------------------------------------------------------------------- */

export function StateMessage({ tone = "neutral", icon, title, body, action }) {
    return (
        <div className={`ox-state ox-state--${tone}`}>
            {icon && <div className="ox-state__icon">{icon}</div>}
            <h4 className="ox-state__title">{title}</h4>
            {body && <p className="ox-state__body">{body}</p>}
            {action}
        </div>
    );
}

export function Spinner({ label }) {
    return (
        <span className="ox-spinner" role="status" aria-label={label ?? "Loading"}>
            <span />
        </span>
    );
}

export function LoadingRow({ children }) {
    return (
        <div className="ox-loading">
            <Spinner />
            <span>{children}</span>
        </div>
    );
}

/** Small "not available yet" note used wherever the backend can't back a tool. */
export function UnavailableNote({ title, children }) {
    return (
        <div className="ox-unavailable">
            <span className="ox-unavailable__title">
                <LockGlyph />
                {title}
            </span>
            <p>{children}</p>
        </div>
    );
}

function LockGlyph() {
    return (
        <svg viewBox="0 0 20 20" width="13" height="13" aria-hidden="true">
            <rect
                x="4.4"
                y="8.6"
                width="11.2"
                height="8"
                rx="2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
            />
            <path
                d="M7.2 8.6V6.4a2.8 2.8 0 0 1 5.6 0v2.2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
            />
        </svg>
    );
}

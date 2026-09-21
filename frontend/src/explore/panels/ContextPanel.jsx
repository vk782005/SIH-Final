import { useState } from "react";

/* ==========================================================================
   OCEAN-X — contextual panel shell

   Every tool panel uses this. It gives them one collapse affordance, one
   close affordance and one animation, so a screen with three panels open
   still reads as a single product rather than three widgets.

   `side` decides where the panel docks and, when collapsed, which edge the
   rail sits on. Collapsing leaves only a narrow rail, so the globe is
   always one click from unobstructed.
   ========================================================================== */

export default function ContextPanel({
    side = "left",
    kicker,
    title,
    icon,
    onClose,
    footer,
    children,
}) {
    const [collapsed, setCollapsed] = useState(false);

    if (collapsed) {
        return (
            <div className={`ox-rail ox-rail--${side}`}>
                <button
                    type="button"
                    className="ox-rail__button"
                    onClick={() => setCollapsed(false)}
                    aria-expanded="false"
                    title={`Show ${title}`}
                >
                    {icon}
                    <span className="ox-rail__label">{title}</span>
                </button>
            </div>
        );
    }

    return (
        <aside
            className={`ox-panel ox-panel--${side}`}
            aria-label={title}
        >
            <header className="ox-panel__head">
                <div className="ox-panel__heading">
                    {kicker && <p className="ox-panel__kicker">{kicker}</p>}
                    <h2 className="ox-panel__title">{title}</h2>
                </div>

                <div className="ox-panel__actions">
                    <button
                        type="button"
                        className="ox-panel__action"
                        onClick={() => setCollapsed(true)}
                        aria-expanded="true"
                        title="Collapse panel"
                        aria-label={`Collapse ${title}`}
                    >
                        <svg
                            viewBox="0 0 16 16"
                            width="15"
                            height="15"
                            aria-hidden="true"
                        >
                            <path
                                d={
                                    side === "left"
                                        ? "M9.5 3.5 5 8l4.5 4.5"
                                        : "M6.5 3.5 11 8l-4.5 4.5"
                                }
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>

                    {onClose && (
                        <button
                            type="button"
                            className="ox-panel__action"
                            onClick={onClose}
                            title="Close panel"
                            aria-label={`Close ${title}`}
                        >
                            <svg
                                viewBox="0 0 16 16"
                                width="15"
                                height="15"
                                aria-hidden="true"
                            >
                                <path
                                    d="M4.5 4.5l7 7M11.5 4.5l-7 7"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.6"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </button>
                    )}
                </div>
            </header>

            <div className="ox-panel__body ox-scroll">{children}</div>

            {footer && <footer className="ox-panel__foot">{footer}</footer>}
        </aside>
    );
}
